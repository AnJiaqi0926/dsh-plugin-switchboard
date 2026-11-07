/**
 * Host half of dsh-plugin-switchboard.
 *
 * Endpoints (same-origin, backed by the shipped `pluginManager` service):
 *   GET  /dsh-switchboard/list      -> { plugins: [...] }   every row carries its origin
 *   GET  /dsh-switchboard/recommend -> { items: [...] }     curated, not installed only
 *   POST /dsh-switchboard/toggle    -> { result: ChangeResult }
 *   POST /dsh-switchboard/install   -> { result: ChangeResult }
 *   POST /dsh-switchboard/restart   -> { ok: true } then ends the Host process
 */

const BASE = '/dsh-switchboard'

/** Curated plugins for the Discover tab. Every spec below is published on npm. */
const RECOMMENDATIONS = [
  {
    spec: 'dsh-language-guard',
    title: '语言守卫',
    description: '把思考过程、回复与工具调用描述锁定为指定语言（默认简体中文），三档强度，可跟随界面语言。',
  },
  {
    spec: '@max-null/dsh-chinese-thinking',
    title: '中文思考',
    description: '注入一条系统提示段落，让 Agent 无论用户使用什么语言都始终用中文思考和回复。',
  },
  {
    spec: 'dsh-composer-plus',
    title: '输入框增强',
    description: 'git 改动面板、输入历史、排队消息排序、复制会话链接、中断后继续等，均可逐项开关。',
  },
  {
    spec: 'dsh-better-input',
    title: '语音与润色',
    description: '输入框语音输入与提示词润色（带差异预览），跟随 DSH 界面语言自动切换中英文。',
  },
  {
    spec: 'dsh-user-message-timeline',
    title: '消息导轨',
    description: '对话内悬浮药丸导轨，悬停预览、点击跳转到任意一轮用户消息。',
  },
  {
    spec: 'dsh-cot-translation-reader',
    title: '译文阅读页',
    description: '在 better-display 阅读页里显示官方「思考过程机器翻译」译文，可逐卡切换原文/译文。',
  },
]

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

function packageNameOf(moduleName) {
  if (!moduleName || moduleName.startsWith('cordis:') || moduleName.startsWith('.')) return undefined
  const parts = moduleName.split('/')
  if (moduleName.startsWith('@')) return parts.length >= 2 ? parts[0] + '/' + parts[1] : moduleName
  return parts[0]
}

/**
 * Origin per entry, taken from the owning bundle rather than the profile file:
 * official catalog bundles are `official`, a `file:` / `link:` source means the
 * user installed it locally, anything else came from a registry.
 */
function bundleOrigins(bundles) {
  const byEntry = new Map()
  const installed = new Set()
  for (const bundle of bundles) {
    installed.add(String(bundle.name))
    const origin = bundle.availability === 'installation'
      ? 'official'
      : typeof bundle.source === 'string' && /^(file:|link:)/.test(bundle.source)
        ? 'local'
        : 'market'
    for (const row of bundle.rows || []) {
      if (row && row.entryId) byEntry.set(String(row.entryId), origin)
    }
  }
  return { byEntry, installed }
}

function toRow(entry, byEntry) {
  const meta = entry.meta
  const moduleName = String(entry.moduleName ?? '')
  const id = String(entry.entryId)
  const origin = byEntry.get(id)
    ?? (moduleName.startsWith('@deepseek-ai/') || moduleName.startsWith('cordis:') ? 'official' : 'market')
  return {
    id,
    moduleName,
    title: text(meta?.title) ?? moduleName,
    description: text(meta?.description) ?? '',
    enabled: entry.enabled === true,
    phase: entry.fiberPhase ?? null,
    readOnly: typeof entry.readOnlyReason === 'string' ? entry.readOnlyReason : undefined,
    origin,
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
        const [plugins, bundles] = await Promise.all([manager.listPlugins(), manager.listBundles()])
        const { byEntry } = bundleOrigins(bundles)
        sendJson(res, 200, { plugins: plugins.map((entry) => toRow(entry, byEntry)) })
      } catch (error) {
        sendJson(res, 500, { error: 'list-failed', message: String(error?.message ?? error) })
      }
    },
  }))

  ctx.effect(() => server.register({
    kind: 'exact',
    path: `${BASE}/recommend`,
    handler: async (req, res) => {
      if (req.method !== 'GET') return sendJson(res, 405, { error: 'method-not-allowed' })
      try {
        const bundles = await manager.listBundles()
        const { installed } = bundleOrigins(bundles)
        const items = RECOMMENDATIONS
          .filter((item) => {
            const name = packageNameOf(item.spec)
            return !(name && installed.has(name))
          })
          .map((item) => ({ spec: item.spec, title: item.title, description: item.description }))
        sendJson(res, 200, { items })
      } catch (error) {
        sendJson(res, 500, { error: 'recommend-failed', message: String(error?.message ?? error) })
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
    path: `${BASE}/install`,
    handler: async (req, res) => {
      if (req.method !== 'POST') return sendJson(res, 405, { error: 'method-not-allowed' })
      if (req.headers['x-switchboard'] !== '1') return sendJson(res, 403, { error: 'forbidden' })
      const body = await readJson(req)
      if (!body || typeof body.spec !== 'string' || !body.spec.trim()) {
        return sendJson(res, 400, { error: 'bad-request' })
      }
      try {
        const result = await manager.installBundle(body.spec.trim(), { enabled: true })
        sendJson(res, 200, { result: toChange(result) })
      } catch (error) {
        sendJson(res, 500, { error: 'install-failed', message: String(error?.message ?? error) })
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
