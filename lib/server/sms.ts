import 'server-only';

export function appUrl(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');
  return u.replace(/\/$/, '');
}

/** GSM-safe, ≤ 160 chars: good spread: {name}, {change text}. Confirm: {APP_URL}/p/{token} */
export function smsText(name: string, change: string, token: string): string {
  const gsm = (s: string) => s.replace(/→/g, '->').replace(/[–—]/g, '-').normalize('NFD').replace(/[̀-ͯ]/g, '');
  const head = `good spread: ${gsm(name)}, `;
  const tail = ` Confirm: ${appUrl()}/p/${token}`;
  let body = gsm(change.charAt(0).toLowerCase() + change.slice(1));
  const room = 160 - head.length - tail.length;
  if (body.length > room) body = body.slice(0, Math.max(0, room - 3)).trimEnd() + '...';
  return head + body + tail;
}

export type SmsResult = { ok: true; sid: string } | { ok: false; reason: string };

/** Never throws. Skips when Twilio env is missing. */
export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) return { ok: false, reason: 'twilio_not_configured' };
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
    return res.ok && json.sid ? { ok: true, sid: json.sid } : { ok: false, reason: json.message ?? `http_${res.status}` };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'send_failed' };
  }
}
