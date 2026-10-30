// 文末引导：全部由配置驱动；未配置则默认不追加
export function buildFooter(theme = { accent: '#2B77BF' }, opts = {}) {
  const A = theme.accent || '#2B77BF';
  const { credit = '', who = '', pathTitle = '', path = '', closing = '', promo = '', account = '', brandLine = '' } = opts;
  if (!who && !path && !closing && !brandLine) return '';

  const p = [];
  // 与正文的分隔线
  // 公众号会过滤 <p> 上的 border 与 background 简写，统一用 section + background-color
  p.push('<section style="margin:34px 0 0;height:0;line-height:0;font-size:0;border-top:1px solid #e6e9ed;">&nbsp;</section>');
  // 浅色卡片：让文末区块和正文在视觉上分开
  p.push('<section style="margin:16px 0 0;padding:18px 16px;background-color:#f7f9fb;background:#f7f9fb;border-radius:10px;border:1px solid #eef2f6;">');
  if (credit) p.push(`<p style="margin:0 0 12px;font-size:13px;line-height:1.7;color:#8b9298;">${credit}</p>`);
  if (who) {
    p.push(`<p style="margin:0 0 6px;"><strong style="color:${A};font-size:15px;">关于我</strong></p>`);
    p.push(`<p style="margin:0 0 14px;">${who}</p>`);
  }
  if (path) {
    p.push(`<p style="margin:0 0 6px;"><strong style="color:${A};">${pathTitle || '这条路径'}</strong></p>`);
    p.push(`<p style="margin:0 0 14px;">${path}</p>`);
  }
  if (closing) p.push(`<p style="margin:0 0 10px;">${closing}</p>`);
  if (promo) p.push(`<p style="margin:0 0 10px;font-size:13px;line-height:1.7;color:#8b9298;">${promo}</p>`);
  if (account) p.push(`<p style="margin:0;color:#666;">有新内容我会发在「${account}」里，留言区随时可以聊。</p>`);
  p.push('</section>');
  if (brandLine) p.push(`<p style="margin:14px 0 0;text-align:center;font-size:13px;color:#9aa0a6;">${brandLine}</p>`);
  return p.join('');
}
