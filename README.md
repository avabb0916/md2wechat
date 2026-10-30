# md2wechat · Markdown → 公众号草稿

**简体中文** | [English](README.en.md)

把 Markdown 一键变成**公众号草稿**：主题排版、两张封面、正文图片自动上传、文末引导自动追加。
**只建草稿，不发布** —— 点发布这一步永远留给你。

- 需要对公众号的 AppID / AppSecret（免费，在后台取）
- 一篇 3000 字 + 9 图，从推送到草稿箱约 **20 秒**
- 支持更新已有草稿（`--update`），改稿不新建
- 排版、封面、文末全部配置化，改一处全局生效

> ⚠️ 用的是公众号官方接口（`draft/add`），不是模拟点击。未认证号也能推草稿，只是不能调"发布"接口。

## 为什么做这个

公众号排版有个硬约束：**编辑器会过滤 `<style>`、`class`、`id`**，只认行内 `style`。

这意味着：
- 你不能用普通 Markdown 转 HTML 直接贴进去（样式全丢）
- 手工调排版，每篇要花半小时

md2wechat 的做法：**每个段落直接写行内样式**，然后走官方接口推进草稿箱。于是排版一次定好、所有文章复用。

代价是 HTML 会膨胀：3000 字的文章，HTML 约 1.9 万字符——离公众号 2 万上限很近，所以本项目对体积做了压缩（继承样式、去冗余属性）。

## 安装

```bash
git clone https://github.com/avabb0916/md2wechat.git
cd md2wechat
node -v   # 需要 >= 20
```

无第三方依赖（只用 Node 内置模块 + 本机 Chrome 生成封面）。

## 三步跑通

**1. 生成配置**

```bash
node bin/wxpub.mjs init
# 会在 ~/.config/md2wechat/config.json 生成模板
```

填入 `appid` 与 `secret`（公众号后台 → 设置与开发 → 基本配置）。

**2. 把本机公网 IP 加入白名单**

同一页面 → API IP 白名单。不加会报 `40164`。

```bash
curl -s https://api.ipify.org   # 查当前公网 IP
```

**3. 推送**

```bash
node bin/wxpub.mjs check                    # 先验证权限
node bin/wxpub.mjs publish 文章.md --dry-run # 看计划
node bin/wxpub.mjs publish 文章.md           # 真推送
```

输出里有 `mediaId`，去公众号后台草稿箱就能看到。

## 命令

| 命令 | 作用 |
|---|---|
| `publish <md>` | 推送到草稿箱（主题+封面+图+摘要+文末） |
| `publish <md> --update <media_id>` | 更新已有草稿，不新建 |
| `publish <md> --dry-run` | 只打印计划 |
| `render <md> --out 目录 [--inline]` | 只生成 HTML 预览（不联网） |
| `covers <md> --out 目录` | 只生成两张封面 |
| `check` | 检查 AppID/Secret 与权限 |
| `list` / `delete <id>` | 列出 / 删除草稿 |
| `init` | 生成配置模板 |

常用参数：`--theme blue|warm|green|red`、`--digest 摘要`、`--title 标题`、`--source-url 原文链接`、`--no-comment`、`--credit 出处说明`。

## 主题

| 主题 | 主色 | 特点 |
|---|---|---|
| `blue`（默认） | `#2B77BF` | 三级标题蓝、引用块浅蓝底、加粗同色 |
| `warm` | `#b45309` | 暖棕，适合随笔 |
| `green` | `#0f766e` | 翠绿，适合教程 |
| `red` | `#c0392b` | 暗红，适合盘点 |

改色只需改 `lib/md.mjs` 里的 `THEMES`。

## 封面

自动生成两张：

| 文件 | 尺寸 | 用途 |
|---|---|---|
| `cover-2.35x1.png` | 1410×600 | 公众号首图 |
| `cover-1x1.png` | 766×766 | 分享小图 |

内容放在**上 1/3**，标题 54–70px。也可以用 `--cover 你的图.png` 传自己的封面，自动裁两种比例。

## 文末引导

在配置的 `footer` 里写一次，每篇自动追加：

```json
{
  "credit": "说明：内容来自公开资料与我的实践总结。",
  "footer": {
    "who": "一句话介绍自己",
    "pathTitle": "这条路径",
    "path": "合集说明：这个系列按什么顺序写",
    "closing": "最后想对读者说的话",
    "account": "你的公众号名",
    "brandLine": "品牌 · 一行小字"
  }
}
```

留空则不追加。

## 官方限制（本项目已处理）

| 限制 | 处理 |
|---|---|
| 正文 HTML < 2 万字符 | 样式压缩 + 超限直接报错 |
| 正文图片 URL 必须来自 `media/uploadimg` | 逐张上传后替换 |
| 标题 ≤32 字、摘要 ≤120 字 | 自动截断 |
| 封面必须是永久素材 | 用 `material/add_material` 上传 |
| 原创 / 合集 / 发布接口无权限 | 只能后台手动点（`freepublish` 返回 48001） |

更多：[docs/LIMITS.md](docs/LIMITS.md)

## 目录结构

```
bin/wxpub.mjs     CLI
lib/md.mjs        Markdown → 公众号 HTML（内联样式 + 主题）
lib/covers.mjs    两张封面生成（HTML → Chrome 截图）
lib/footer.mjs    文末引导（配置驱动）
lib/api.mjs       token / 图片上传 / 草稿增删改查
lib/config.mjs    配置读写
docs/             SETUP / LIMITS / PUBLISHING-SOP
examples/         示例文章与图片
```

## 配套项目

| 项目 | 作用 |
|---|---|
| [x-md-publisher](https://github.com/avabb0916/x-md-publisher) | Markdown → X 文章草稿（同一思路，X 版） |
| [x-article-factory](https://github.com/avabb0916/x-article-factory) | 发布前质检 + 配图生成 |
| [agent-skill-content-factory](https://github.com/avabb0916/agent-skill-content-factory) | 写作流程 Skill |
| [x-article-template](https://github.com/avabb0916/x-article-template) | 内容仓库模板（含 CI 检查） |

## License

MIT
