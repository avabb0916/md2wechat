# md2wechat · Markdown → WeChat Official Account drafts

[简体中文](README.md) | **English**

Turn a Markdown file into a **WeChat Official Account draft**: themed typography, two cover images, inline images uploaded automatically, configurable footer.
**Drafts only — publishing always stays with you.**

- Needs a WeChat MP AppID / AppSecret (free, from the dashboard)
- ~20s to push a 3,000-word article with 9 images
- Supports updating an existing draft (`--update`)
- Theme, covers and footer are config-driven: change once, apply everywhere

> ⚠️ Uses the official MP endpoints (`draft/add`), not UI automation. Unverified accounts can create drafts; the publish endpoint is not available for them.

## Why

The WeChat editor strips `<style>`, `class` and `id` — only inline `style` survives.

So a plain Markdown→HTML conversion loses all formatting, and hand-styling costs ~30 minutes per article.

md2wechat writes inline styles directly and pushes through the official API. The trade-off: HTML inflation — a 3,000-word article becomes ~19k characters, close to the 20k limit. This project compresses where possible (style inheritance, redundant property removal).

## Install

```bash
git clone https://github.com/avabb0916/md2wechat.git
cd md2wechat
node -v   # needs >= 20
```

No third-party dependencies (Node built-ins + local Chrome for covers).

## Quick start

```bash
node bin/wxpub.mjs init                     # create config template
# fill appid / secret from MP dashboard → Settings → Basic config
node bin/wxpub.mjs check                    # verify credentials
node bin/wxpub.mjs publish article.md       # push a draft
```

Also add your public IP to the API IP whitelist, otherwise you get `40164`.

## Commands

`publish` · `render` · `covers` · `check` · `list` · `delete` · `init`

Useful flags: `--theme blue|warm|green|red`, `--digest`, `--title`, `--source-url`, `--update <media_id>`, `--dry-run`, `--no-comment`, `--credit`.

## Limits handled

| Limit | Handling |
|---|---|
| content < 20k chars | compress styles, fail fast when exceeded |
| images must come from `media/uploadimg` | upload then rewrite URLs |
| title ≤32 / digest ≤120 chars | truncated automatically |
| cover must be a permanent asset | uploaded via `material/add_material` |
| original-claim / collections / publish | manual in the dashboard (no API) |

More: [docs/LIMITS.md](docs/LIMITS.md)

## License

MIT
