window.__ModuleLoader__.load({
  id: 'dsh-plugin-switchboard',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const API = '/dsh-switchboard'

    async function call(path, body) {
      const response = await fetch(location.origin + API + path, {
        method: body === undefined ? 'GET' : 'POST',
        headers: body === undefined
          ? undefined
          : { 'content-type': 'application/json', 'x-switchboard': '1' },
        body: body === undefined ? undefined : JSON.stringify(body),
        credentials: 'same-origin',
        cache: 'no-store',
      })
      let data = null
      try {
        data = await response.json()
      } catch {
        data = null
      }
      if (!response.ok) {
        throw new Error((data && (data.message || data.error)) || 'HTTP ' + response.status)
      }
      return data
    }

    const CSS = `
      .dsw-sb-panel {
        position: fixed; left: 14px; bottom: 64px; width: 352px; max-width: calc(100vw - 28px);
        display: flex; flex-direction: column; max-height: min(66vh, 620px);
        background: var(--dsw-alias-bg-overlay, #1b1c1f);
        color: var(--dsw-alias-label-primary, #e8eaed);
        border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.12));
        border-radius: 16px; overflow: hidden; z-index: 1400; pointer-events: auto;
        box-shadow: 0 18px 48px rgba(0,0,0,.34), 0 2px 8px rgba(0,0,0,.22);
        font: inherit; font-size: 13px; line-height: 1.45;
        animation: dsw-sb-in 170ms cubic-bezier(.2,.8,.25,1);
      }
      @keyframes dsw-sb-in { from { opacity: 0; transform: translateY(8px) scale(.985);} to { opacity:1; transform:none;} }
      .dsw-sb-head { display:flex; align-items:flex-start; gap:8px; padding:14px 14px 10px; }
      .dsw-sb-title { font-size:14px; font-weight:600; letter-spacing:.01em; }
      .dsw-sb-sub { margin-top:2px; font-size:11.5px; color: var(--dsw-alias-label-secondary, #9aa0a6); }
      .dsw-sb-close {
        margin-left:auto; width:26px; height:26px; border-radius:8px; border:0; cursor:pointer;
        background: transparent; color: var(--dsw-alias-label-secondary, #9aa0a6); font-size:17px; line-height:1;
        display:flex; align-items:center; justify-content:center;
      }
      .dsw-sb-close:hover { background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,.06)); color: var(--dsw-alias-label-primary,#fff); }
      .dsw-sb-search { padding: 0 14px 8px; }
      .dsw-sb-input {
        width:100%; box-sizing:border-box; padding:7px 10px; border-radius:9px;
        border:1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.12));
        background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,.05));
        color: inherit; font: inherit; outline: none;
      }
      .dsw-sb-input:focus { border-color: var(--dsw-alias-brand-primary, #4c8dff); }
      .dsw-sb-tabs { display:flex; gap:6px; padding: 0 14px 10px; flex-wrap: wrap; }
      .dsw-sb-chip {
        border:1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.12)); background:transparent;
        color: var(--dsw-alias-label-secondary,#9aa0a6); border-radius:999px; padding:3px 10px;
        font-size:11.5px; cursor:pointer; transition: all 120ms ease;
      }
      .dsw-sb-chip[data-active="true"] {
        color: var(--dsw-alias-brand-primary,#4c8dff);
        border-color: color-mix(in srgb, var(--dsw-alias-brand-primary,#4c8dff) 55%, transparent);
        background: color-mix(in srgb, var(--dsw-alias-brand-primary,#4c8dff) 12%, transparent);
      }
      .dsw-sb-list { overflow:auto; padding: 2px 8px 8px; flex:1; scrollbar-width: thin; }
      .dsw-sb-row {
        display:flex; align-items:center; gap:9px; padding:8px 8px; border-radius:10px; cursor:pointer;
        transition: background 120ms ease;
      }
      .dsw-sb-row:hover { background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,.05)); }
      .dsw-sb-row[data-off="true"] .dsw-sb-name { opacity:.62; }
      .dsw-sb-dot { width:7px; height:7px; border-radius:50%; flex:none; background: var(--dsw-alias-state-idle-primary,#6b7280); }
      .dsw-sb-dot[data-state="on"] { background: var(--dsw-alias-state-success-primary,#3ecf8e); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-success-primary,#3ecf8e) 18%, transparent); }
      .dsw-sb-dot[data-state="failed"] { background: var(--dsw-alias-state-error-primary,#ef5b5b); }
      .dsw-sb-dot[data-state="locked"] { background: var(--dsw-alias-state-warn-primary,#e0a93b); }
      .dsw-sb-main { min-width:0; flex:1; }
      .dsw-sb-name { display:flex; align-items:center; gap:6px; font-size:12.8px; font-weight:520; }
      .dsw-sb-name span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .dsw-sb-mod {
        display:block; margin-top:1px; font-size:10.8px; letter-spacing:.01em;
        color: var(--dsw-alias-label-secondary,#9aa0a6);
        overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
      }
      .dsw-sb-tag {
        flex:none; font-size:10px; padding:1px 6px; border-radius:999px;
        color: var(--dsw-alias-state-warn-primary,#e0a93b);
        background: color-mix(in srgb, var(--dsw-alias-state-warn-primary,#e0a93b) 14%, transparent);
      }
      .dsw-sb-switch {
        flex:none; width:34px; height:19px; border-radius:999px; border:1px solid transparent;
        background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,.12)); position:relative;
        cursor:pointer; transition: background 150ms ease; padding:0;
      }
      .dsw-sb-switch[data-on="true"] { background: var(--dsw-alias-brand-primary,#4c8dff); }
      .dsw-sb-switch:disabled { opacity:.4; cursor:not-allowed; }
      .dsw-sb-knob {
        position:absolute; top:2px; left:2px; width:13px; height:13px; border-radius:50%;
        background:#fff; transition: transform 160ms cubic-bezier(.2,.8,.25,1);
        box-shadow: 0 1px 2px rgba(0,0,0,.3);
      }
      .dsw-sb-switch[data-on="true"] .dsw-sb-knob { transform: translateX(15px); }
      .dsw-sb-banner {
        margin: 0 14px 8px; padding:9px 10px; border-radius:10px; font-size:11.8px;
        display:flex; align-items:center; gap:8px;
        color: var(--dsw-alias-state-warn-primary,#e0a93b);
        background: color-mix(in srgb, var(--dsw-alias-state-warn-primary,#e0a93b) 11%, transparent);
        border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary,#e0a93b) 28%, transparent);
      }
      .dsw-sb-banner button {
        margin-left:auto; flex:none; border:1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary,#e0a93b) 45%, transparent);
        background: transparent; color: inherit; border-radius:8px; padding:3px 9px; cursor:pointer; font: inherit; font-size:11.5px;
      }
      .dsw-sb-foot {
        display:flex; gap:6px; padding: 9px 12px; align-items:center;
        border-top: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.1));
        background: color-mix(in srgb, var(--dsw-alias-bg-layer-1,#15161a) 60%, transparent);
      }
      .dsw-sb-btn {
        border:1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.14)); background:transparent;
        color: var(--dsw-alias-label-primary,#e8eaed); border-radius:9px; padding:5px 10px;
        font: inherit; font-size:11.8px; cursor:pointer; transition: background 120ms ease;
      }
      .dsw-sb-btn:hover { background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,.07)); }
      .dsw-sb-btn[data-kind="danger"] { margin-left:auto; color: var(--dsw-alias-state-error-primary,#ef5b5b); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary,#ef5b5b) 40%, transparent); }
      .dsw-sb-note { padding: 8px 14px 0; font-size:11px; color: var(--dsw-alias-label-secondary,#9aa0a6); }
      .dsw-sb-toast {
        position:absolute; left:50%; bottom:14px; transform:translateX(-50%);
        background: var(--dsw-alias-bg-layer-2, #26282c); color: var(--dsw-alias-label-primary,#fff);
        border:1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.14));
        padding:6px 12px; border-radius:999px; font-size:11.5px; white-space:nowrap;
        box-shadow: 0 6px 18px rgba(0,0,0,.3); animation: dsw-sb-in 140ms ease;
      }
      .dsw-sb-empty { padding: 26px 16px; text-align:center; color: var(--dsw-alias-label-secondary,#9aa0a6); font-size:12px; }
      .dsw-sb-trigger {
        display:flex; align-items:center; justify-content:center; width:30px; height:30px;
        border-radius:9px; border:0; background:transparent; cursor:pointer;
        color: var(--dsw-alias-label-secondary,#c9ccd1);
      }
      .dsw-sb-trigger:hover { background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,.08)); color: var(--dsw-alias-label-primary,#fff); }
      .dsw-sb-trigger[data-open="true"] { color: var(--dsw-alias-brand-primary,#4c8dff); background: color-mix(in srgb, var(--dsw-alias-brand-primary,#4c8dff) 14%, transparent); }
    `

    function createStore() {
      let state = {
        open: false,
        loading: false,
        error: null,
        plugins: [],
        query: '',
        filter: 'all',
        pending: {},
        toasting: null,
        confirmRestart: false,
        restarting: false,
      }
      const listeners = new Set()
      return {
        get: () => state,
        set(patch) {
          state = { ...state, ...patch }
          for (const listener of [...listeners]) listener()
        },
        subscribe(listener) {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
      }
    }

    function useStore(store) {
      const [snapshot, setSnapshot] = React.useState(store.get())
      React.useEffect(() => {
        setSnapshot(store.get())
        return store.subscribe(() => setSnapshot(store.get()))
      }, [])
      return snapshot
    }

    function toast(store, message) {
      store.set({ toasting: message })
      const timer = setTimeout(() => {
        if (store.get().toasting === message) store.set({ toasting: null })
      }, 2600)
      return () => clearTimeout(timer)
    }

    function shortName(moduleName) {
      const base = String(moduleName || '').replace(/^@[^/]+\//, '')
      return base || moduleName
    }

    async function loadPlugins(store) {
      store.set({ loading: true, error: null })
      try {
        const data = await call('/list')
        store.set({ plugins: Array.isArray(data && data.plugins) ? data.plugins : [], loading: false })
      } catch (error) {
        store.set({ loading: false, error: String(error && error.message ? error.message : error) })
      }
    }

    async function toggle(store, plugin) {
      if (plugin.readOnly) return
      const next = !plugin.enabled
      const before = store.get().plugins
      store.set({
        plugins: before.map((row) => (row.id === plugin.id ? { ...row, enabled: next } : row)),
      })
      try {
        const data = await call('/toggle', { id: plugin.id, enabled: next })
        const result = (data && data.result) || {}
        if (result.application === 'restart-required') {
          store.set({ pending: { ...store.get().pending, [plugin.id]: result.restartReason || 'restart' } })
          toast(store, '已保存，需重启 Host 生效')
        } else if (result.application === 'overridden') {
          toast(store, '已保存，但被更高优先级层覆盖')
        } else if (result.application === 'failed' || result.application === 'cancelled') {
          store.set({ plugins: before })
          toast(store, '切换失败：' + ((result.error && (result.error.diagnostic || result.error.code)) || result.application))
        } else {
          toast(store, next ? '已启用' : '已停用')
        }
        const fresh = await call('/list').catch(() => null)
        if (fresh && Array.isArray(fresh.plugins)) store.set({ plugins: fresh.plugins })
      } catch (error) {
        store.set({ plugins: before })
        toast(store, '请求失败：' + (error && error.message ? error.message : error))
      }
    }

    async function restartHost(store) {
      if (!store.get().confirmRestart) {
        store.set({ confirmRestart: true })
        setTimeout(() => {
          if (store.get().confirmRestart && !store.get().restarting) store.set({ confirmRestart: false })
        }, 4000)
        return
      }
      store.set({ restarting: true, confirmRestart: false })
      try {
        await call('/restart', {})
        toast(store, '正在重启 Host…')
      } catch (error) {
        store.set({ restarting: false })
        toast(store, '重启请求失败：' + (error && error.message ? error.message : error))
      }
    }

    function Trigger(props) {
      const store = React.useContext(StoreContext)
      const state = useStore(store)
      const open = state.open
      const pendingCount = Object.keys(state.pending).length
      return h('button', {
        type: 'button',
        className: 'dsw-sb-trigger',
        style: { position: 'relative' },
        'data-open': open ? 'true' : 'false',
        title: open ? '收起插件开关' : '插件开关',
        'aria-label': '插件开关',
        'aria-pressed': open,
        onClick: () => {
          const next = !store.get().open
          store.set({ open: next })
          if (next) loadPlugins(store)
        },
      },
        h('svg', { width: 17, height: 17, viewBox: '0 0 20 20', 'aria-hidden': true, fill: 'none' },
          h('rect', { x: 2.2, y: 4.6, width: 15.6, height: 4.6, rx: 2.3, stroke: 'currentColor', strokeWidth: 1.35 }),
          h('circle', { cx: 13.7, cy: 6.9, r: 1.35, fill: 'currentColor' }),
          h('rect', { x: 2.2, y: 10.8, width: 15.6, height: 4.6, rx: 2.3, stroke: 'currentColor', strokeWidth: 1.35 }),
          h('circle', { cx: 6.3, cy: 13.1, r: 1.35, fill: 'currentColor' }),
        ),
        pendingCount > 0
          ? h('span', {
              style: {
                position: 'absolute', marginLeft: 14, marginTop: -14,
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--dsw-alias-state-warn-primary, #e0a93b)',
              },
            })
          : null,
      )
    }

    function Row(props) {
      const store = React.useContext(StoreContext)
      const { plugin } = props
      const state = useStore(store)
      const needsRestart = Boolean(state.pending[plugin.id])
      const dot = plugin.phase === 'failed'
        ? 'failed'
        : plugin.readOnly
          ? 'locked'
          : plugin.enabled ? 'on' : 'off'
      return h('div', {
        className: 'dsw-sb-row',
        'data-off': plugin.enabled ? 'false' : 'true',
        role: 'button',
        tabIndex: 0,
        title: plugin.description || plugin.moduleName,
        onClick: () => toggle(store, plugin),
        onKeyDown: (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            toggle(store, plugin)
          }
        },
      },
        h('span', { className: 'dsw-sb-dot', 'data-state': dot }),
        h('div', { className: 'dsw-sb-main' },
          h('div', { className: 'dsw-sb-name' }, h('span', null, plugin.title || shortName(plugin.moduleName))),
          h('span', { className: 'dsw-sb-mod' }, shortName(plugin.moduleName)),
        ),
        needsRestart ? h('span', { className: 'dsw-sb-tag' }, '待重启') : null,
        h('button', {
          type: 'button',
          role: 'switch',
          className: 'dsw-sb-switch',
          'data-on': plugin.enabled ? 'true' : 'false',
          'aria-checked': plugin.enabled,
          'aria-label': (plugin.title || shortName(plugin.moduleName)) + (plugin.enabled ? ' 已启用' : ' 已停用'),
          disabled: Boolean(plugin.readOnly),
          onClick: (event) => {
            event.stopPropagation()
            toggle(store, plugin)
          },
        }, h('span', { className: 'dsw-sb-knob' })),
      )
    }

    function Panel() {
      const store = React.useContext(StoreContext)
      const state = useStore(store)
      if (!state.open) return null
      const pendingCount = Object.keys(state.pending).length
      const query = state.query.trim().toLowerCase()
      const filtered = state.plugins.filter((plugin) => {
        if (state.filter === 'on' && !plugin.enabled) return false
        if (state.filter === 'off' && plugin.enabled) return false
        if (state.filter === 'pending' && !state.pending[plugin.id]) return false
        if (!query) return true
        const haystack = (plugin.title + ' ' + plugin.moduleName).toLowerCase()
        return haystack.includes(query)
      })
      const enabledCount = state.plugins.filter((plugin) => plugin.enabled).length

      return h('div', {
        className: 'dsw-sb-panel',
        role: 'dialog',
        'aria-label': '插件开关',
        onKeyDown: (event) => {
          if (event.key === 'Escape') store.set({ open: false })
        },
      },
        h('style', null, CSS),
        h('div', { className: 'dsw-sb-head' },
          h('div', null,
            h('div', { className: 'dsw-sb-title' }, '插件开关'),
            h('div', { className: 'dsw-sb-sub' },
              state.loading
                ? '读取中…'
                : state.plugins.length + ' 个插件 · ' + enabledCount + ' 个已启用'),
          ),
          h('button', {
            type: 'button',
            className: 'dsw-sb-close',
            'aria-label': '关闭',
            onClick: () => store.set({ open: false }),
          }, '×'),
        ),
        h('div', { className: 'dsw-sb-search' },
          h('input', {
            className: 'dsw-sb-input',
            placeholder: '搜索插件…',
            value: state.query,
            autoFocus: true,
            onChange: (event) => store.set({ query: event.target.value }),
          }),
        ),
        h('div', { className: 'dsw-sb-tabs' },
          ...[['all', '全部'], ['on', '已启用'], ['off', '已停用'], ['pending', '待重启']].map(([key, label]) =>
            h('button', {
              key,
              type: 'button',
              className: 'dsw-sb-chip',
              'data-active': state.filter === key ? 'true' : 'false',
              onClick: () => store.set({ filter: key }),
            }, label),
          ),
        ),
        pendingCount > 0
          ? h('div', { className: 'dsw-sb-banner' },
              h('span', null, pendingCount + ' 项更改需重启 Host 才生效'),
              h('button', {
                type: 'button',
                onClick: () => restartHost(store),
              }, state.confirmRestart ? '再次点击确认' : '重启 Host'),
            )
          : null,
        state.error
          ? h('div', { className: 'dsw-sb-empty' }, h('div', null, '读取失败'), h('div', { style: { marginTop: 6, opacity: .8 } }, state.error))
          : h('div', { className: 'dsw-sb-list' },
              filtered.length === 0
                ? h('div', { className: 'dsw-sb-empty' }, state.loading ? '读取中…' : '没有匹配的插件')
                : filtered.map((plugin) => h(Row, { key: plugin.id, plugin })),
            ),
        state.restarting
          ? h('div', { className: 'dsw-sb-note' }, '正在结束 Host 进程；若窗口没有自动重开，请重新启动 DeepSeek Harness。')
          : null,
        state.confirmRestart && pendingCount === 0
          ? h('div', { className: 'dsw-sb-note' }, '再次点击「重启 Host」确认。')
          : null,
        h('div', { className: 'dsw-sb-foot' },
          h('button', {
            type: 'button',
            className: 'dsw-sb-btn',
            onClick: () => loadPlugins(store),
          }, '刷新'),
          h('button', {
            type: 'button',
            className: 'dsw-sb-btn',
            onClick: () => location.reload(),
          }, '重载界面'),
          h('button', {
            type: 'button',
            className: 'dsw-sb-btn',
            'data-kind': 'danger',
            onClick: () => restartHost(store),
          }, state.confirmRestart ? '确认重启？' : '重启 Host'),
        ),
        state.toasting ? h('div', { className: 'dsw-sb-toast' }, state.toasting) : null,
      )
    }

    const StoreContext = React.createContext(null)

    return {
      inject: ['slots'],
      apply(ctx) {
        const store = createStore()
        const wrap = (Component) => function Bound() {
          return h(StoreContext.Provider, { value: store }, h(Component, null))
        }
        ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
          name: 'sidebar.footer.action',
          id: 'plugin-switchboard',
          order: 20,
          label: '插件开关',
        }, wrap(Trigger)))
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'plugin-switchboard-panel',
          order: 60,
          label: '插件开关',
        }, wrap(Panel)))
      },
    }
  },
})
