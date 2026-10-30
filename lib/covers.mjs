// 公众号两张封面：2.35:1（首图 900×383）+ 1:1（小图 383×383）
// 输入一张 5:2 或任意横图，按两种比例居中裁切输出，关键信息在中央安全区
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const CHROME = process.env.WXPUB_CHROME || (
  process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : process.platform === 'win32'
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      : '/usr/bin/google-chrome'
);

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"PingFang SC","Hiragino Sans GB",sans-serif;overflow:hidden}
.dark{background:#101821;color:#f6f7f3}
.light{background:#f6f7f3;color:#1b2430}
.wrap{width:100%;height:100%;position:relative;display:flex;flex-direction:column;justify-content:center}
.kicker{letter-spacing:.2em;font-weight:700}
h1{font-weight:800;line-height:1.2}
h1 em{font-style:normal;color:#f2b544}
.sub{line-height:1.5}
.brand{position:absolute;left:6%;bottom:7%;font-size:13px;letter-spacing:.1em;opacity:.55}
`;

// 标题断行：优先在「：」后断，其次在标点处，再不行按字数均衡断
// 返回 [{text, em}] 的数组，em=true 表示这段用强调色
function splitTitle(raw) {
  const t = String(raw || '').replace(/<br\s*\/?>/gi, '\u0001').replace(/<[^>]+>/g, '').trim();
  const segs = t.split('\u0001').filter(Boolean);
  if (segs.length > 1) {
    const [a, ...rest] = segs;
    return [{ text: a, em: false }, { text: rest.join('，'), em: true }];
  }
  const s = segs[0] || '';
  const PUNCT = ['：', ':', '，', ',', '？', '?', '—', '\u3001'];
  const mid = s.length / 2;
  let best = -1, bestDist = Infinity;
  for (const p of PUNCT) {
    let idx = s.indexOf(p);
    while (idx >= 0) {
      const d = Math.abs(idx + 1 - mid);
      if (idx >= 4 && idx <= s.length - 4 && d < bestDist) { best = idx; bestDist = d; }
      idx = s.indexOf(p, idx + 1);
    }
  }
  if (best >= 0) return [{ text: s.slice(0, best + 1), em: false }, { text: s.slice(best + 1), em: true }];
  if (s.length >= 16) {
    const cut = Math.round(mid);
    return [{ text: s.slice(0, cut), em: false }, { text: s.slice(cut), em: true }];
  }
  return [{ text: s, em: true }];
}

function titleHtml(raw) {
  const lines = splitTitle(raw);
  return lines.map(l => (l.em ? `<em style="font-style:normal;color:#f2b544">${l.text}</em>` : l.text)).join('<br>');
}

function plainTitle(raw) {
  return String(raw || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').trim();
}

// 首图 2.35:1
export function cover235({ title, kicker = '', sub = '', brand = '', dark = true, out }) {
  const W = 1410, H = 600; // 2.35:1 精确
  const t = plainTitle(title);
  const lines = splitTitle(title).map(l => l.text);
  const maxLen = Math.max(1, ...lines.map(x => x.length));
  // 1410 宽、左右各 7% 边距 => 可用 1212px；按最长行定字号，上限 76
  const size = Math.max(44, Math.min(76, Math.floor(1180 / maxLen - 2)));
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
  body{width:${W}px;height:${H}px}.wrap{padding:0 7%}</style></head><body>
  <div class="wrap ${dark ? 'dark' : 'light'}" style="justify-content:flex-start;padding:9% 7% 0">
    ${kicker ? `<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <span style="display:inline-block;width:6px;height:22px;background:#f2b544"></span>
      <span class="kicker" style="font-size:20px;color:${dark ? '#f2b544' : '#c0392b'}">${kicker}</span></div>` : ''}
    <h1 style="font-size:${size}px;margin-top:2%;line-height:1.22">${titleHtml(title)}</h1>
    ${sub ? `<div class="sub" style="font-size:22px;margin-top:22px;color:${dark ? '#aab6bd' : '#5b655f'}">${sub}</div>` : ''}
    <div style="position:absolute;left:7%;bottom:10%;display:flex;align-items:center;gap:10px">
      <span style="display:inline-block;width:26px;height:2px;background:#f2b544;opacity:.7"></span>
      <span class="brand" style="position:static">${brand}</span></div>
  </div></body></html>`;
  return render(html, W, H, out);
}

// 小图 1:1
export function cover11({ title, kicker = '', brand = '', out }) {
  const W = 766, H = 766;
  const plain = plainTitle(title);
  const size = plain.length > 16 ? 48 : plain.length > 11 ? 56 : 66;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
  body{width:${W}px;height:${H}px}.wrap{padding:0 9%;justify-content:center}</style></head><body>
  <div class="wrap dark" style="justify-content:flex-start;padding-top:16%">
    <div style="width:56px;height:6px;background:#f2b544;margin-bottom:22px"></div>
    ${kicker ? `<div style="font-size:17px;color:#f2b544;letter-spacing:.16em;margin-bottom:18px">${kicker}</div>` : ''}
    <h1 style="font-size:${size}px;line-height:1.26">${titleHtml(title)}</h1>
    <div class="brand">${brand}</div>
  </div></body></html>`;
  return render(html, W, H, out);
}

function render(html, W, H, out) {
  const tmp = path.join(os.tmpdir(), `wxpub-${Date.now()}-${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(tmp, html, 'utf8');
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  execFileSync(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    '--force-device-scale-factor=1', `--window-size=${W},${H}`,
    `--screenshot=${out}`, `file://${tmp}`,
  ], { stdio: 'ignore' });
  fs.unlinkSync(tmp);
  return { file: out, width: W, height: H, bytes: fs.statSync(out).size };
}

// 从已有封面图裁出两种比例（不重新设计，只裁切）
export function cropTwo(src, outDir, { slug = 'cover' } = {}) {
  fs.mkdirSync(outDir, { recursive: true });
  const a = path.join(outDir, `${slug}-2.35x1.png`);
  const b = path.join(outDir, `${slug}-1x1.png`);
  for (const [ratio, target] of [[1410 / 600, a], [1, b]]) {
    execFileSync('sips', ['-s', 'format', 'png', '--cropToHeightWidth', '600', String(Math.round(600 * ratio)), src, '--out', target], { stdio: 'ignore' });
  }
  return [a, b];
}
