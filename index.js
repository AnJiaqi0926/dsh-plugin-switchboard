/**
 * Host half of dsh-plugin-switchboard.
 *
 * Exposes three same-origin endpoints backed by the shipped `pluginManager`
 * service, so the Client half never depends on a generated Remote namespace:
 *
 *   GET  /dsh-switchboard/list    -> { plugins: [...] }
 *   POST /dsh-switchboard/toggle  -> { result: ChangeResult }
 *   POST /dsh-switchboard/restart -> { ok: true } then ends the Host process
 */

const BASE = '/dsh-switchboard'

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

function readJson(req, limit = 64 * 1024) {
  return new Promise((resolve) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        req.destroy()
        resolve(undefined)
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8')
      try {
        resolve(text ? JSON.parse(text) : undefined)
      } catch {
        resolve(undefined)
      }
    })
    req.on('error', () => resolve(undefined))
  })
}

function text(value) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    if (typeof value.zh === 'string') return value.zh
    if (typeof value.en === 'string') return value.en
    const first = Object.values(value).find((entry) => typeof entry === 'string')
    if (typeof first === 'string') return first
  }
  return undefined
}

function toRow(entry) {
  const meta = entry.meta
  return {
    id: String(entry.entryId),
    moduleName: String(entry.moduleName ?? ''),
    title: text(meta?.title) ?? String(entry.moduleName ?? ''),
    description: text(meta?.description) ?? '',
    icon: typeof meta?.icon === 'string' ? meta.icon : undefined,
    enabled: entry.enabled === true,
    phase: entry.fiberPhase ?? null,
    readOnly: typeof entry.readOnlyReason === 'string' ? entry.readOnlyReason : undefined,
  }
}

function toChange(result) {
  if (!result || typeof result !== 'object') return { application: 'failed' }
  return {
    changed: result.changed,
    application: result.application,
    restartReason: result.restartReason,
    stage: result.stage,
    target: result.target,
    enabled: result.enabled,
    error: result.error ? { code: result.error.code, diagnostic: result.error.diagnostic } : undefined,
  }
}

function mountRoutes(ctx) {
  const manager = ctx.pluginManager
  const server = ctx.webServer
  if (!manager || !server) return

  ctx.effect(() => server.register({
    kind: 'exact',
    path: `${BASE}/list`,
    handler: async (req, res) => {
      if (req.method !== 'GET') return sendJson(res, 405, { error: 'method-not-allowed' })
      try {
        const plugins = await manager.listPlugins()
        sendJson(res, 200, { plugins: plugins.map(toRow) })
      } catch (error) {
        sendJson(res, 500, { error: 'list-failed', message: String(error?.message ?? error) })
      }
    },
  }))

  ctx.effect(() => server.register({
    kind: 'exact',
    path: `${BASE}/toggle`,
    handler: async (req, res) => {
      if (req.method !== 'POST') return sendJson(res, 405, { error: 'method-not-allowed' })
      if (req.headers['x-switchboard'] !== '1') return sendJson(res, 403, { error: 'forbidden' })
      const body = await readJson(req)
      if (!body || typeof body.id !== 'string' || typeof body.enabled !== 'boolean') {
        return sendJson(res, 400, { error: 'bad-request' })
      }
      try {
        const result = await manager.setPluginEnabled(body.id, body.enabled)
        sendJson(res, 200, { result: toChange(result) })
      } catch (error) {
        sendJson(res, 500, { error: 'toggle-failed', message: String(error?.message ?? error) })
      }
    },
  }))

  ctx.effect(() => server.register({
    kind: 'exact',
    path: `${BASE}/restart`,
    handler: async (req, res) => {
      if (req.method !== 'POST') return sendJson(res, 405, { error: 'method-not-allowed' })
      if (req.headers['x-switchboard'] !== '1') return sendJson(res, 403, { error: 'forbidden' })
      sendJson(res, 202, { ok: true, at: Date.now() })
      // Give the response time to flush, then end this Host process. The
      // desktop shell exits with it; sessions and profile state are durable.
      setTimeout(() => {
        try {
          process.exit(0)
        } catch {
          // ignore
        }
      }, 1200).unref?.()
    },
  }))
}

export function apply(ctx) {
  if (typeof ctx.inject === 'function') {
    ctx.inject(['webServer', 'pluginManager'], (scope) => mountRoutes(scope))
    return
  }
  mountRoutes(ctx)
}
