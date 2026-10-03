// Pure logic for POST /api/contact (ported from the old Vercel function).
// No Cloudflare-specific globals are used directly so it is unit-testable
// with fakes: pass `fetchImpl`, `env.DB`, `now`, `uuid`.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_LEN = { name: 200, email: 254, subject: 300, message: 5000 };
// Submissions faster than this after the page rendered are bot-like.
export const MIN_FILL_TIME_MS = 3000;
const TURNSTILE_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const FALLBACK_EMAIL = 'iqraspaceorg@gmail.com';

export function field(body, key) {
  const value = body && body[key];
  return typeof value === 'string' ? value.trim() : '';
}

export function validate(body) {
  const errors = {};
  const name = field(body, 'name');
  const email = field(body, 'email');
  const subject = field(body, 'subject');
  const message = field(body, 'message');

  if (!name || name.length > MAX_LEN.name) errors.name = 'Please enter your name.';
  if (!email || email.length > MAX_LEN.email || !EMAIL_RE.test(email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!subject || subject.length > MAX_LEN.subject) errors.subject = 'Please add a subject.';
  if (!message || message.length > MAX_LEN.message) errors.message = 'Please write a message.';

  return { name, email, subject, message, errors };
}

// D1 bind params in column order: id, name, email, subject, message, created_at
// (status uses the column default 'new').
export function buildInsert({ name, email, subject, message }, id, nowMs) {
  return {
    sql: 'INSERT INTO contact_messages (id, name, email, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    params: [id, name, email, subject, message, new Date(nowMs).toISOString()],
  };
}

export async function verifyTurnstile(token, remoteIp, secret, fetchImpl = fetch) {
  // Not configured yet: do not block real users (see ADMIN.md).
  if (!secret) return true;
  if (!token) return false;

  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', token);
  if (remoteIp) params.append('remoteip', remoteIp);

  try {
    const response = await fetchImpl(TURNSTILE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const data = await response.json();
    return data.success === true;
  } catch (err) {
    console.error('contact: Turnstile verification request failed', err);
    return false; // fail closed
  }
}

// Optional best-effort alert through the Resend HTTPS API. Throws on failure
// (caller swallows). Returns false when not configured.
export async function sendAlert({ name, email, subject, message }, env, fetchImpl = fetch) {
  if (!env.RESEND_API_KEY || !env.CONTACT_FROM_EMAIL) return false;
  const res = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `IqraSpace Contact Form <${env.CONTACT_FROM_EMAIL}>`,
      to: [env.CONTACT_ALERT_EMAIL || FALLBACK_EMAIL],
      reply_to: email,
      subject: `[IqraSpace contact] ${subject}`,
      text: `New message from the IqraSpace contact form.\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
    }),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}`);
  return true;
}

// Core handler. Returns { status, json, headers? }.
// opts: { method, body, remoteIp, env, fetchImpl, now, uuid, waitUntil }
export async function handleContact(opts) {
  const { method, body: rawBody, remoteIp, env = {} } = opts;
  const fetchImpl = opts.fetchImpl || fetch;
  const now = opts.now || Date.now();
  const uuid = opts.uuid || (() => crypto.randomUUID());
  const waitUntil = opts.waitUntil || ((p) => p);

  if (method !== 'POST') {
    return { status: 405, headers: { Allow: 'POST' }, json: { ok: false, error: 'Method not allowed.' } };
  }

  const body = rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody) ? rawBody : {};

  // Honeypot: pretend success so bots get no signal.
  if (field(body, 'company')) return { status: 200, json: { ok: true } };

  const startedAt = Number(body.startedAt);
  if (Number.isFinite(startedAt) && now - startedAt < MIN_FILL_TIME_MS) {
    return { status: 200, json: { ok: true } };
  }

  const { name, email, subject, message, errors } = validate(body);
  if (Object.keys(errors).length > 0) return { status: 400, json: { ok: false, errors } };

  const captchaOk = await verifyTurnstile(field(body, 'turnstileToken'), remoteIp, env.TURNSTILE_SECRET_KEY, fetchImpl);
  if (!captchaOk) {
    return { status: 400, json: { ok: false, errors: { captcha: 'Verification failed. Please try again.' } } };
  }

  if (!env.DB) {
    console.error('contact: D1 binding DB not configured');
    return { status: 500, json: { ok: false, error: 'Contact form is not configured yet. Please email iqraspaceorg@gmail.com directly.' } };
  }

  try {
    const { sql, params } = buildInsert({ name, email, subject, message }, uuid(), now);
    await env.DB.prepare(sql).bind(...params).run();
  } catch (err) {
    console.error('contact: failed to store message', err);
    return { status: 500, json: { ok: false, error: 'Could not save your message. Please try again or email iqraspaceorg@gmail.com directly.' } };
  }

  // Message is stored; alert is best-effort and never affects the response.
  const alertPromise = Promise.resolve()
    .then(() => sendAlert({ name, email, subject, message }, env, fetchImpl))
    .catch((err) => console.error('contact: failed to send alert email', err));
  waitUntil(alertPromise);

  return { status: 200, json: { ok: true } };
}
