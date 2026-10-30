# 已知限制

## 1. 正文 HTML 必须 < 2 万字符

公众号 `draft/add` 的 `content` 字段限制：少于 2 万字符、小于 1M。

由于样式必须内联，3000 字中文文章的 HTML 约 1.9 万字符。本项目做了三个压缩：

1. 外层 section 统一字体/行高/颜色，子块只写差异
2. 去掉 `letter-spacing:0`、`box-sizing` 等无意义属性
3. 块之间无换行（换行会被公众号转成空行/空项目符号）

超过限制会直接报错，不会静默截断。

## 2. 图片必须来自微信 CDN

正文里引用外部图片 URL 会被平台过滤。正确流程：

1. `cgi-bin/media/uploadimg` 上传，得到 URL
2. 用返回的 URL 替换 HTML 里的 `src`

封面不同：封面要 `cgi-bin/material/add_material?type=thumb`，得到 `thumb_media_id`。

## 3. 接口能力按账号类型不同

| 接口 | 未认证个人号 | 认证号 |
|---|---|---|
| `stable_token` | ✅ | ✅ |
| `media/uploadimg` | ✅ | ✅ |
| `material/add_material` | ✅ | ✅ |
| `draft/add` / `update` / `delete` | ✅（实测可用） | ✅ |
| `freepublish/submit`（发布） | ❌ `48001` | ✅ |

所以本项目只建草稿。

## 4. 无法自动化的三件事

| 设置 | 原因 |
|---|---|
| 原创声明 | 草稿接口没有该字段；发布后不能补 |
| 合集 | 草稿接口没有该字段；可发布后批量加 |
| 点发布 | 未认证号无权限 |

## 5. 排版限制

公众号编辑器会过滤 `<style>`、`class`、`id`、`position:fixed`、`grid` 等。

可行的写法只有：**行内 style + section/p/span 这类基础标签**。

不要试图用外链 CSS 或复杂布局，会被静默丢弃。

## 6. 不做的事

- 不自动发布（只建草稿）
- 不做批量养号、多账号矩阵
- 不绕过平台审核
