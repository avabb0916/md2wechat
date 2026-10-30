// 配置：全部来自 ~/.config/md2wechat/config.json 或环境变量，无硬编码个人信息
import fs from 'fs';
import os from 'os';
import path from 'path';

export const CONFIG_DIR = process.env.MD2WECHAT_CONFIG_DIR || path.join(os.homedir(), '.config', 'md2wechat');
export const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); } catch { return {}; }
}

export function saveConfig(patch) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  const cur = loadConfig();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ ...cur, ...patch }, null, 2));
  fs.chmodSync(CONFIG_FILE, 0o600);
  return CONFIG_FILE;
}

export function exampleConfig() {
  return `{
  "appid": "wxYOUR_APPID",
  "secret": "YOUR_APPSECRET",
  "author": "你的名字",
  "credit": "",
  "footer": {
    "who": "一句话介绍你自己",
    "pathTitle": "这条路径",
    "path": "合集说明：这个系列按什么顺序写，读者怎么读",
    "closing": "想对读者说的最后一句",
    "promo": "",
    "account": "你的公众号名",
    "brandLine": "你的品牌 · 一行小字"
  }
}`;
}
