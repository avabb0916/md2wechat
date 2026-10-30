---
title: 一个示例：把 Markdown 发成公众号草稿
---

# 一个示例：把 Markdown 发成公众号草稿

这是一篇给 md2wechat 做冒烟测试的示例文章。它演示了三件事：标题怎么取、图片怎么嵌、文末引导怎么配。

## 一、标题从哪来

默认取第一个 `#` 一级标题，也可以用 `--title` 覆盖。公众号标题上限 32 字，超出会自动截断。

## 二、为什么必须内联样式

公众号编辑器会过滤 `<style>`、`class`、`id`，只保留行内 `style`。

所以 md2wechat 把每个段落的样式都写到 `style` 属性里——这也是为什么一篇 3000 字的文章，HTML 会有 1.9 万字符。

## 三、图片怎么处理

正文图片会先上传到微信 CDN（`media/uploadimg`），再把返回的 URL 塞回 HTML。

外部图片 URL 会被平台过滤，所以这一步不能省。

![[examples/images/fig1.png]]

## 四、封面是两张

公众号需要 2.35:1 首图和 1:1 分享图。

```bash
md2wechat covers 文章.md --out out --kicker "栏目名"
```

生成 `cover-2.35x1.png` 与 `cover-1x1.png`。

![[examples/images/fig2.png]]

## 五、文末引导

在配置文件的 `footer` 里写好，每篇自动追加，不用手工复制。

如果不需要，留空即可。

## 六、跑起来

```bash
md2wechat init                      # 生成配置模板
md2wechat publish 文章.md --dry-run  # 看计划，不推送
md2wechat publish 文章.md            # 真推送到草稿箱
```

## 七、最后一句

只建草稿，不发布——发布这一步永远留给人。
