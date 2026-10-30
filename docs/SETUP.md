# 安装与排错

## 1. 环境

```bash
node -v    # >= 20
```

封面生成需要本机 Chrome（macOS 默认路径已内置，其他平台用 `MD2WECHAT_CHROME` 指定）。

## 2. 取 AppID / AppSecret

公众号后台 → **设置与开发 → 基本配置**

- AppID：公开的，直接复制
- AppSecret：点「启用」生成，**只显示一次**，保存好

个人订阅号也能取，但接口能力有限（见 LIMITS）。

## 3. 配置 IP 白名单

同一页面 → **API IP 白名单** → 修改 → 填公网 IP：

```bash
curl -s https://api.ipify.org
```

家庭宽带 IP 会变，**变了就报 `40164`**，回来改一次即可。

## 4. 写配置文件

```bash
node bin/wxpub.mjs init
# → ~/.config/md2wechat/config.json（权限 600）
```

必填：`appid`、`secret`。可选：`author`、`credit`、`footer`。

## 5. 验证

```bash
node bin/wxpub.mjs check
```

返回 `{"ok": true, "detail": {...}}` 表示凭证与白名单都正常。

如果返回：
- `40164` → IP 不在白名单
- `40013 invalid appid` → AppID 填错
- `40125 invalid appsecret` → Secret 填错或已重置

## 6. 第一次推送

```bash
node bin/wxpub.mjs publish 文章.md --dry-run
node bin/wxpub.mjs publish 文章.md
```

成功后去公众号后台「草稿箱」查看。

## 7. 常见问题

| 现象 | 原因 | 处理 |
|---|---|---|
| 正文超过 2 万字符 | 样式太多或文章太长 | 精简文末 / 拆成两篇 |
| 推成功但图片不显示 | 图片 URL 不是微信 CDN | 检查是否走 `media/uploadimg` |
| 封面变形 | 原图比例不对 | 用默认生成，或传 2.35:1 原图 |
| 标题被截断 | 超过 32 字 | 用 `--title` 给短标题 |
| 摘要生硬 | 自动取首段前 120 字 | 用 `--digest` 指定 |
