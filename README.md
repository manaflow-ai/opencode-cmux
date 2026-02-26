# opencode-cmux

OpenCode plugin that bridges OpenCode events to cmux notifications and sidebar metadata.

## Requirements

- OpenCode ≥ 1.0
- [cmux](https://cmux.app) (macOS app) installed with CLI accessible at `/usr/local/bin/cmux`
- The plugin is a no-op when not running inside a cmux workspace

## Installation

### npm (recommended)

Install the package and add it to `~/.config/opencode/opencode.json`:

```bash
npm install -g opencode-cmux
```

```json
{
  "plugin": ["opencode-cmux"]
}
```

### Local / development

Build the package, then symlink the output directly into OpenCode's plugin directory:

```bash
ln -sf ~/path/to/opencode-cmux/dist/index.js ~/.config/opencode/plugins/cmux.js
```

## What it does

| Event | cmux action |
|---|---|
| Session starts working | Sidebar status: "working" (amber, terminal icon) |
| Session completes (primary) | Desktop notification + log + clear status |
| Session completes (subagent) | Log only (no notification spam) |
| Session error | Desktop notification + log + clear status |
| Permission requested | Desktop notification + sidebar status: "waiting" (red, lock icon) |
| AI has a question (`ask` tool) | Desktop notification + sidebar status: "question" (purple) |

## How it works

The plugin responds to OpenCode lifecycle events by firing cmux CLI commands (`cmux notify`, `cmux set-status`, etc.). Each action targets the current cmux workspace, providing ambient awareness of what OpenCode is doing without requiring you to switch context. All commands are no-ops when cmux is not running.

## License

MIT
