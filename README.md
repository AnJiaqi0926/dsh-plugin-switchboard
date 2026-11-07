# dsh-plugin-switchboard

DeepSeek Harness 的侧边栏插件开关：一行一个插件，点一下就启停；需要重启才生效的改动会被单独标出，面板里可以直接重启 Host。

Sidebar switchboard for DeepSeek Harness: toggle installed plugins in one click, see which changes need a Host restart, and relaunch from the same panel.

## 安装 / Install

```sh
dsh plugin --profile <profile> add dsh-plugin-switchboard
```

或在 DSH 桌面端 **插件 → 添加插件** 里填入包名 / GitHub 地址；也可以在本地目录直接安装：

```sh
dsh plugin --profile <profile> add /absolute/path/to/dsh-plugin-switchboard
```

安装后刷新页面（Web）或重启应用（Desktop）。

## 用法 / Usage

左侧栏底部、**设置**旁边多出一个开关图标，点开即为面板：

- **分类**：默认按来源分成「官方自带 / 市场安装 / 本地导入」三组，组头显示「已启用/总数」，点组头可折叠。
- **搜索 / 筛选**：全部、官方、市场、本地、待重启；也可以直接搜插件名。
- **发现**：列出几条未安装的推荐插件，点「安装」直接走插件管理器安装。
- **一行一个插件**：状态点 + 中文名 + 模块名 + 开关，整行可点。
- **待重启标记**：宿主返回 `application: 'restart-required'` 时，该行打上「待重启」，顶部出现黄色横幅并统计条数。
- **被覆盖的情况**：返回 `overridden` 时提示「已保存，但被更高优先级层覆盖」，此时开关不会真的生效。
- **底部动作**：刷新列表、重载界面（`location.reload`，只对界面层改动有效）、重启 Host。

来源判定来自插件管理器本身：`availability: 'installation'` 的 bundle 记为官方自带，`source` 为 `file:` / `link:` 的记为本地导入，其余为市场安装。

## 工作原理 / How it works

插件分两半：

- `index.js`（宿主）：基于 `ctx.webServer` 注册三个同源路由，内部调用官方 `pluginManager` 服务，不依赖生成的 Remote 类型。

  | 路由 | 作用 |
  | --- | --- |
  | `GET /dsh-switchboard/list` | 读取 `pluginManager.listPlugins()` |
  | `POST /dsh-switchboard/toggle` | 调用 `setPluginEnabled(id, enabled)`，返回精简后的 `ChangeResult` |
  | `POST /dsh-switchboard/restart` | 应答后延迟约 1.2 秒结束 Host 进程 |

- `client.js`（浏览器）：纯 React 组件，注册到 `sidebar.footer.action`（按钮）与 `shell.overlay`（浮层面板），样式只使用 `--dsw-alias-*` 主题变量。

## 已知限制 / Limitations

- **「重启 Host」不是自动重开**：桌面端的 Host 跑在应用进程内，这个动作会结束进程、窗口随之关闭，需要手动重新打开 DeepSeek Harness；会话与插件配置都在磁盘上，不会丢失。
- 修改是否立即生效由宿主决定：多数界面层插件热生效，注入 system prompt 或占用宿主模块的插件通常要重启。
- 只切换**行级**条目（`entryId`）；不提供 bundle 级安装/卸载，那是插件页的职责。

## 兼容性 / Compatibility

- 需要 dsh `>= 0.2.1`（使用 `sidebar.footer.action` 与 `shell.overlay` 两个插槽）。
- 无第三方运行时依赖。

## 许可

MIT
