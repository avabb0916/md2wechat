// Markdown → 公众号 HTML（内联样式）+ 图片清单
import fs from 'fs';
import path from 'path';
import os from 'os';
import { buildFooter } from './footer.mjs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export const THEMES = {
  blue:   { accent: '#2B77BF', bold: '#2B77BF', h3: '#2B77BF', quoteBg: '#F1F6FB', quoteBar: '#2B77BF', quoteText: '#1C4E7C', name: '蓝白杂志' },
  warm:   { accent: '#b45309', bold: '#92400e', h3: '#b45309', quoteBg: '#fdf7f1', quoteBar: '#b45309', quoteText: '#7c2d12', name: '暖棕手记' },
  green:  { accent: '#0f766e', bold: '#0f766e', h3: '#0f766e', quoteBg: '#f0faf7', quoteBar: '#0f766e', quoteText: '#134e4a', name: '翠绿科技' },
  red:    { accent: '#c0392b', bold: '#a93226', h3: '#c0392b', quoteBg: '#fdf6f5', quoteBar: '#c0392b', quoteText: '#7f1d1d', name: '暗红' },
};

const S = {
  root: 'font-size:17px;line-height:1.85;color:#333;font-family:-apple-system,BlinkMacSystemFont,PingFang SC,Hiragino Sans GB,sans-serif;',
  p: 'margin:0 0 16px;',
  h2: (t) => `margin:32px 0 14px;padding-left:10px;border-left:4px solid ${t.accent};font-size:20px;color:#111;line-height:1.5;`,
  h3: (t) => `margin:22px 0 10px;font-size:17px;font-weight:700;color:${t.h3 || t.accent};`,
  li: 'margin:0 0 10px;',
  quote: (t) => `margin:20px 0;padding:14px 16px;background:${t.quoteBg};border-left:3px solid ${t.quoteBar};font-size:16px;color:${t.quoteText || '#444'};`,
  ul: 'margin:0 0 16px;padding-left:20px;',
  img: 'width:100%;height:auto;display:block;margin:22px auto;',
  strong: (t) => `font-weight:700;color:${t.bold};`,
};

function escHtml(t) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(text, theme) {
  let t = escHtml(text.replace(/`/g, ''));
  t = t.replace(/_{3,}/g, '＿＿＿');
  t = t.replace(/\*\*(.+?)\*\*/g, (_, m) => `<strong style="${S.strong(theme)}">${m}</strong>`);
  return t;
}

export function parseMd(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const base = path.dirname(path.resolve(file));
  let text = raw;
  let fm = {};
  if (text.startsWith('---')) {
    const end = text.indexOf('\n---', 3);
    if (end > 0) {
      for (const line of text.slice(3, end).split('\n')) {
        const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
        if (m) fm[m[1]] = m[2].trim();
      }
      text = text.slice(end + 4);
    }
  }
  const blocks = [];
  const images = [];
  let inFence = false;
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (t.startsWith('```')) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (!t) continue;
    let m;
    if (!fm._h1 && (m = t.match(/^#\s+(.+)$/))) { fm._h1 = m[1].replace(/\*\*/g, '').trim(); continue; }
    if (t.startsWith('# ')) continue;
    if (t.startsWith('## ')) { blocks.push({ k: 'h2', v: t.slice(3) }); continue; }
    if (t.startsWith('### ')) { blocks.push({ k: 'h3', v: t.slice(4) }); continue; }
    if ((m = t.match(/!\[\[([^\]]+)\]\]/)) || (m = t.match(/!\[[^\]]*\]\(([^)]+)\)/))) {
      let p = m[1].trim();
      if (!path.isAbsolute(p)) {
        const os = require('os');
        const vault = process.env.OBSIDIAN_VAULT || '';
        const cands = [path.resolve(base, p), path.resolve(process.cwd(), p)];
        if (vault) cands.push(path.join(vault, p));
        p = cands.find(c => fs.existsSync(c)) || cands[1];
      }
      images.push(p);
      blocks.push({ k: 'img', v: p, idx: images.length - 1 });
      continue;
    }
    if ((m = t.match(/^[-*]\s+(.+)$/))) { blocks.push({ k: 'li', v: m[1] }); continue; }
    if (t.startsWith('> ')) { blocks.push({ k: 'quote', v: t.slice(2) }); continue; }
    if (/^-{3,}$/.test(t)) { blocks.push({ k: 'hr' }); continue; }
    // 表格降级为列表
    if (/^\|.*\|$/.test(t)) { continue; }
    blocks.push({ k: 'p', v: t });
  }
  return { fm, blocks, images, title: fm.title || fm._h1 || '' };
}

export function toHtml(doc, { imgUrl = () => null, theme = THEMES.blue, footer = true, credit = '', footerOpts = {} } = {}) {
  const out = [];
  let inUl = false;
  const closeUl = () => { if (inUl) { out.push('</ul>'); inUl = false; } };
  for (const b of doc.blocks) {
    if (b.k !== 'li') closeUl();
    if (b.k === 'h1') continue;
    if (b.k === 'h2') out.push(`<h2 style="${S.h2(theme)}">${inline(b.v, theme)}</h2>`);
    else if (b.k === 'h3') out.push(`<h3 style="${S.h3(theme)}">${inline(b.v, theme)}</h3>`);
    else if (b.k === 'li') {
      if (!inUl) { out.push(`<ul style="${S.ul}">`); inUl = true; }
      out.push(`<li style="${S.li}">${inline(b.v, theme).trim()}</li>`);
    } else if (b.k === 'quote') out.push(`<blockquote style="${S.quote(theme)}">${inline(b.v, theme)}</blockquote>`);
    else if (b.k === 'hr') out.push('<p style="text-align:center;color:#ccc;">· · ·</p>');
    else if (b.k === 'img') {
      const url = imgUrl(b.idx, b.v);
      if (url) out.push(`<p><img src="${url}" style="${S.img}" /></p>`);
      else out.push(`<p style="color:#c0392b;">［插图 ${b.idx + 1}：${path.basename(b.v)}］</p>`);
    } else out.push(`<p style="${S.p}">${inline(b.v, theme)}</p>`);
  }
  closeUl();
  // 外层统一字体/行高/颜色，公众号编辑器会保留嵌套继承
  const body = out.join('');
  return `<section style="${S.root}">${body}${footer ? buildFooter(theme, { credit, ...footerOpts }) : ''}</section>`;
}
