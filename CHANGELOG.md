# Changelog

## 0.1.0 — 2026-10-30

首个版本。

- `publish`：Markdown → 公众号草稿（主题 + 两张封面 + 图片上传 + 摘要 + 文末）
- `render`：只生成 HTML 预览，不联网
- `covers`：生成 2.35:1 首图与 1:1 分享图
- `check` / `list` / `delete`：权限检查与草稿管理
- `init`：生成配置模板
- 4 套主题（blue / warm / green / red）
- 文末引导配置化（出处 / 关于我 / 路径 / 推荐 / 署名）
- 正文 HTML 自动压缩，避免超过 2 万字符限制
- 文本转义修复：正文出现裸 HTML 标签不会打乱排版
