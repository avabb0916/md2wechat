// 公众号 API 封装：token / 上传正文图 / 上传封面(永久素材) / 新增草稿
import fs from 'fs';
import path from 'path';

const BASE = 'https://api.weixin.qq.com';

async function jsonGet(url) {
  const r = await fetch(url);
  const t = await r.text();
  try { return JSON.parse(t); } catch { return { raw: t.slice(0, 300) }; }
}

export async function getToken(appid, secret) {
  // stable_token 更稳（不会被其他调用刷掉）
  const r = await fetch(`${BASE}/cgi-bin/stable_token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credential', appid, secret, force_refresh: false }),
  });
  const d = await r.json();
  if (!d.access_token) throw new Error('获取 access_token 失败: ' + JSON.stringify(d));
  return d.access_token;
}

// 上传正文内图片（返回微信 CDN url）
export async function uploadContentImage(token, file) {
  const buf = fs.readFileSync(file);
  const fd = new FormData();
  fd.append('media', new Blob([buf], { type: /\.png$/i.test(file) ? 'image/png' : 'image/jpeg' }), path.basename(file));
  const r = await fetch(`${BASE}/cgi-bin/media/uploadimg?access_token=${token}`, { method: 'POST', body: fd });
  const d = await r.json();
  if (!d.url) throw new Error('正文图上传失败: ' + JSON.stringify(d));
  return d.url;
}

// 上传永久素材（封面，type=thumb）
export async function uploadThumb(token, file) {
  const buf = fs.readFileSync(file);
  const fd = new FormData();
  fd.append('media', new Blob([buf], { type: /\.png$/i.test(file) ? 'image/png' : 'image/jpeg' }), path.basename(file));
  const r = await fetch(`${BASE}/cgi-bin/material/add_material?access_token=${token}&type=thumb`, { method: 'POST', body: fd });
  const d = await r.json();
  if (!d.media_id) throw new Error('封面上传失败: ' + JSON.stringify(d));
  return d.media_id;
}

// 新增草稿
export async function addDraft(token, article) {
  const r = await fetch(`${BASE}/cgi-bin/draft/add?access_token=${token}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ articles: [article] }),
  });
  const d = await r.json();
  if (!d.media_id) throw new Error('新增草稿失败: ' + JSON.stringify(d));
  return d.media_id;
}

// 权限自检：能拿到 token 且能读素材总数
export async function checkPermission(token) {
  const d = await jsonGet(`${BASE}/cgi-bin/material/get_materialcount?access_token=${token}`);
  return { ok: !d.errcode, detail: d };
}

// 更新已有草稿（同 media_id，不新建）
export async function updateDraft(token, mediaId, article) {
  const r = await fetch(`${BASE}/cgi-bin/draft/update?access_token=${token}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ media_id: mediaId, index: 0, articles: article }),
  });
  const d = await r.json();
  if (d.errcode) throw new Error('更新草稿失败: ' + JSON.stringify(d));
  return true;
}

// 草稿箱：列表 / 删除
export async function listDrafts(token, { offset = 0, count = 20 } = {}) {
  const r = await fetch(`${BASE}/cgi-bin/draft/batchget?access_token=${token}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ offset, count, no_content: 1 }),
  });
  const d = await r.json();
  if (d.errcode) throw new Error('获取草稿列表失败: ' + JSON.stringify(d));
  return (d.item || []).map(i => ({ media_id: i.media_id, title: i.content.news_item[0].title, update_time: i.update_time }));
}

export async function deleteDraft(token, mediaId) {
  const r = await fetch(`${BASE}/cgi-bin/draft/delete?access_token=${token}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ media_id: mediaId }),
  });
  const d = await r.json();
  if (d.errcode) throw new Error('删除草稿失败: ' + JSON.stringify(d));
  return true;
}
