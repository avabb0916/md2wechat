#!/usr/bin/env node
// md2wechat — Markdown / 图文文档 → 公众号草稿（主题 + 两张封面 + 文末引导）
import fs from 'fs';
import path from 'path';
import { parseMd, toHtml, THEMES } from '../lib/md.mjs';
import { cover235, cover11, cropTwo } from '../lib/covers.mjs';
import { getToken, uploadContentImage, uploadThumb, addDraft, updateDraft, checkPermission, listDrafts, deleteDraft } from '../lib/api.mjs';
import { loadConfig, exampleConfig, CONFIG_FILE } from '../lib/config.mjs';

const argv = process.argv.slice(2);
const cmd = argv[0];
const has = n => argv.includes(n);
const flag = (n, d = null) => { const i = argv.indexOf(n); return i < 0 ? d : (argv[i + 1] ?? d); };
const positional = argv.slice(1).filter((a, i, arr) => !a.startsWith('--') && !['--out', '--cover', '--title', '--digest', '--theme', '--kicker', '--sub'].includes(arr[i - 1]));

function usage() {
  console.log(`md2wechat — Markdown → 公众号草稿

命令:
  render   <md> [--out 目录] [--theme blue|warm|green|red] [--inline]   生成公众号 HTML
  covers   <md> --out 目录 [--kicker 栏目] [--sub 副标题] [--cover 图片]  生成两张封面
  publish  <md> [--dry-run] [--theme 主题] [--update <media_id>]         推送到草稿箱
  check                                                                  检查接口权限
  list                                                                   列出草稿
  delete   <media_id>                                                    删除草稿
  init                                                                   生成配置模板

配置:
  ${CONFIG_FILE}
  运行 wxpub init 可生成模板。

环境变量:
  MD2WECHAT_CONFIG_DIR   配置目录（默认 ~/.config/md2wechat）
  MD2WECHAT_CHROME       Chrome 路径（生成封面用）

注意:
  · AppID / AppSecret 在公众号后台「设置与开发 → 基本配置」获取
  · 必须把本机公网 IP 加入 IP 白名单，否则报 40164
  · 只建草稿，不发布；原创声明/合集/发布仍需在后台手动操作
`);
}

if (!cmd || has('--help') || has('-h')) { usage(); process.exit(cmd ? 0 : 1); }

if (cmd === 'init') {
  const f = CONFIG_FILE;
  fs.mkdirSync(path.dirname(f), { recursive: true });
  if (fs.existsSync(f)) { console.log('已存在:', f); process.exit(0); }
  fs.writeFileSync(f, exampleConfig());
  fs.chmodSync(f, 0o600);
  console.log('已生成配置模板:', f, '\n填入 appid / secret 后即可 publish。');
  process.exit(0);
}

const mdFile = positional[0];
const cfg = loadConfig();
const themeKey = flag('--theme', 'blue');
const theme = THEMES[themeKey] || THEMES.blue;

function ensureCovers(doc, outDir, coverSrc) {
  fs.mkdirSync(outDir, { recursive: true });
  const a = path.join(outDir, 'cover-2.35x1.png');
  const b = path.join(outDir, 'cover-1x1.png');
  if (coverSrc && fs.existsSync(coverSrc)) { cropTwo(coverSrc, outDir, { slug: 'cover' }); return [a, b]; }
  const brand = (cfg.footer && cfg.footer.brandLine) || cfg.brand || '';
  cover235({ title: doc.title, kicker: flag('--kicker', ''), sub: flag('--sub', ''), brand, out: a });
  cover11({ title: doc.title, kicker: flag('--kicker', ''), brand, out: b });
  return [a, b];
}

if (cmd === 'render') {
  const out = flag('--out', path.join(path.dirname(mdFile), 'wechat'));
  const doc = parseMd(mdFile);
  const imgMap = {};
  if (has('--inline')) {
    doc.images.forEach((f, i) => {
      if (!fs.existsSync(f)) return;
      const ext = /\.jpe?g$/i.test(f) ? 'jpeg' : 'png';
      imgMap[i] = `data:image/${ext};base64,` + fs.readFileSync(f).toString('base64');
    });
  }
  const skipped = new Set();
  doc.images.forEach((f, i) => { if (/\/cover[^/]*\.(png|jpe?g|webp)$/i.test(f)) skipped.add(i); });
  doc.blocks = doc.blocks.filter(b => !(b.k === 'img' && skipped.has(b.idx)));
  const html = toHtml(doc, { imgUrl: i => imgMap[i] || null, theme, credit: flag('--credit', cfg.credit || ''), footerOpts: cfg.footer || {} });
  fs.mkdirSync(out, { recursive: true });
  const page = `<!doctype html><html lang="zh"><head><meta charset="utf-8"><title>${doc.title}</title>
<style>body{background:#fff;margin:0;padding:24px}strong{font-weight:700}</style></head><body>
<section style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;max-width:740px;margin:0 auto;">
<h1 style="margin:0 0 26px;font-size:25px;font-weight:800;line-height:1.4;color:#111;">${doc.title}</h1>
${html}</section></body></html>`;
  fs.writeFileSync(path.join(out, 'preview.html'), page);
  console.log(JSON.stringify({ ok: true, html: path.join(out, 'preview.html'), blocks: doc.blocks.length, images: doc.images.length }, null, 2));
  process.exit(0);
}

if (cmd === 'covers') {
  const out = flag('--out', path.join(path.dirname(mdFile), 'wechat'));
  const doc = parseMd(mdFile);
  const files = ensureCovers(doc, out, flag('--cover'));
  console.log(JSON.stringify({ ok: true, covers: files.map(f => ({ file: f, kb: Math.round(fs.statSync(f).size / 1024) })) }, null, 2));
  process.exit(0);
}

if (cmd === 'check') {
  if (!cfg.appid || !cfg.secret) { console.error('缺少配置，先运行 wxpub init'); process.exit(1); }
  const token = await getToken(cfg.appid, cfg.secret);
  const r = await checkPermission(token);
  console.log(JSON.stringify({ ok: r.ok, detail: r.detail }, null, 2));
  process.exit(r.ok ? 0 : 1);
}

if (cmd === 'list') {
  const token = await getToken(cfg.appid, cfg.secret);
  const items = await listDrafts(token);
  console.log(JSON.stringify(items, null, 2));
  process.exit(0);
}

if (cmd === 'delete') {
  const id = positional[0];
  if (!id) { console.error('用法: wxpub delete <media_id>'); process.exit(1); }
  const token = await getToken(cfg.appid, cfg.secret);
  await deleteDraft(token, id);
  console.log(JSON.stringify({ ok: true, deleted: id }, null, 2));
  process.exit(0);
}

if (cmd === 'publish') {
  const doc = parseMd(mdFile);
  const outDir = path.join(path.dirname(mdFile), 'wechat');
  const [c235, c11] = ensureCovers(doc, outDir, flag('--cover'));
  const title = flag('--title', doc.title).slice(0, 32);
  let digest = flag('--digest', cfg.digest || '');
  if (!digest) {
    const firstP = doc.blocks.find(b => b.k === 'p' && (b.v || '').length > 20);
    digest = (firstP?.v || doc.title).replace(/\*\*|`/g, '').replace(/\s+/g, ' ').trim();
  }
  digest = digest.slice(0, 120);
  console.log('标题:', title, '| 块:', doc.blocks.length, '| 图:', doc.images.length, '| 封面:', path.basename(c235) + ' + ' + path.basename(c11));

  if (has('--dry-run')) {
    console.log(JSON.stringify({ ok: true, dryRun: true, title, digest, covers: [c235, c11], images: doc.images.length }, null, 2));
    process.exit(0);
  }
  if (!cfg.appid || !cfg.secret) { console.error('缺少配置，先运行 wxpub init'); process.exit(1); }

  const token = await getToken(cfg.appid, cfg.secret);
  const urls = {};
  for (let i = 0; i < doc.images.length; i++) {
    urls[i] = await uploadContentImage(token, doc.images[i]);
    process.stdout.write(`\r上传图片 ${i + 1}/${doc.images.length}`);
  }
  console.log('');
  const thumbId = await uploadThumb(token, c235);
  const skipped = new Set();
  doc.images.forEach((f, i) => { if (/\/cover[^/]*\.(png|jpe?g|webp)$/i.test(f)) skipped.add(i); });
  doc.blocks = doc.blocks.filter(b => !(b.k === 'img' && skipped.has(b.idx)));
  const content = toHtml(doc, { imgUrl: i => urls[i], theme, credit: flag('--credit', cfg.credit || ''), footerOpts: cfg.footer || {} });
  if (content.length > 19900) throw new Error('正文超过 2 万字符限制: ' + content.length);

  const article = {
    article_type: 'news',
    title,
    author: (cfg.author || '').slice(0, 16),
    digest,
    content,
    thumb_media_id: thumbId,
    need_open_comment: has('--no-comment') ? 0 : 1,
    only_fans_can_comment: 0,
  };
  const srcUrl = flag('--source-url');
  if (srcUrl) article.content_source_url = String(srcUrl).slice(0, 1024);
  const updateId = flag('--update');
  const mediaId = updateId ? (await updateDraft(token, String(updateId), article), String(updateId)) : await addDraft(token, article);
  console.log(JSON.stringify({ ok: true, mediaId, title, covers: [path.basename(c235), path.basename(c11)] }, null, 2));
  process.exit(0);
}

usage();
process.exit(1);
