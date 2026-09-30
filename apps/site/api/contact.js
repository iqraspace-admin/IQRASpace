// IqraSpace Site — /contact form submission endpoint.
//
// Vercel Node.js Serverless Function (no framework — matches apps/site's
// "no build tooling for the pages themselves" design; this is the one
// small piece of real server code the contact form needs). Validates the
// submission, stores it in apps/site's own Supabase project (service-role
// key only, never exposed to the browser — see ../supabase/migrations/
// 0001_contact_messages.sql for why there's no public RLS policy), then
// best-effort emails an alert to iqraspaceorg@gmail.com over Gmail SMTP.
//
// Required environment variables (set in Vercel project settings, and in
// apps/site/.env.local for local testing — see .env.local.example):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GMAIL_USER, GMAIL_APP_PASSWORD
// CONTACT_ALERT_EMAIL is optional and defaults to iqraspaceorg@gmail.com.
// TURNSTILE_SECRET_KEY enables Cloudflare Turnstile verification (see
// ../ADMIN.md) — if unset, the captcha check is skipped so the form still
// works before that's configured; set it to actually block bots.

const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = { name: 200, email: 254, subject: 300, message: 5000 };
// Forms submitted faster than this after the page told us it rendered
// are almost certainly a bot filling the form programmatically, not a
// person reading it first.
const MIN_FILL_TIME_MS = 3000;

function field(body, key) {
  const value = body && body[key];
  return typeof value === 'string' ? value.trim() : '';
}

function validate(body) {
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

async function verifyTurnstile(token, remoteIp) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Not configured yet — don't block real users before setup is done
    // (see ADMIN.md). Once TURNSTILE_SECRET_KEY is set, this always runs.
    return true;
  }
  if (!token) return false;

  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', token);
  if (remoteIp) params.append('remoteip', remoteIp);

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const data = await response.json();
    return data.success === true;
  } catch (verifyError) {
    console.error('contact.js: Turnstile verification request failed', verifyError);
    // Fail closed: if we can't reach Cloudflare to check, don't let the
    // submission through unverified.
    return false;
  }
}

async function sendAlertEmail({ name, email, subject, message }) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const to = process.env.CONTACT_ALERT_EMAIL || 'iqraspaceorg@gmail.com';

  await transporter.sendMail({
    from: `IqraSpace Contact Form <${process.env.GMAIL_USER}>`,
    to,
    replyTo: email,
    subject: `[IqraSpace contact] ${subject}`,
    text: `New message from the IqraSpace contact form.\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, error: 'Method not allowed.' });
    return;
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};

  // Honeypot: a real visitor never fills this hidden field. A bot
  // usually fills every field it finds. Pretend success either way so
  // the bot has no signal to adapt to.
  if (field(body, 'company')) {
    res.status(200).json({ ok: true });
    return;
  }

  const startedAt = Number(body.startedAt);
  if (Number.isFinite(startedAt) && Date.now() - startedAt < MIN_FILL_TIME_MS) {
    res.status(200).json({ ok: true });
    return;
  }

  const { name, email, subject, message, errors } = validate(body);
  if (Object.keys(errors).length > 0) {
    res.status(400).json({ ok: false, errors });
    return;
  }

  const forwardedFor = (req.headers || {})['x-forwarded-for'];
  const remoteIp = Array.isArray(forwardedFor) ? forwardedFor[0] : (forwardedFor || '').split(',')[0].trim();
  const captchaOk = await verifyTurnstile(field(body, 'turnstileToken'), remoteIp);
  if (!captchaOk) {
    res.status(400).json({ ok: false, errors: { captcha: 'Verification failed. Please try again.' } });
    return;
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('contact.js: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured');
    res.status(500).json({ ok: false, error: 'Contact form is not configured yet. Please email iqraspaceorg@gmail.com directly.' });
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { error: insertError } = await supabase
    .from('contact_messages')
    .insert({ name, email, subject, message });

  if (insertError) {
    console.error('contact.js: failed to store message', insertError);
    res.status(500).json({ ok: false, error: 'Could not save your message. Please try again or email iqraspaceorg@gmail.com directly.' });
    return;
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      await sendAlertEmail({ name, email, subject, message });
    } catch (emailError) {
      // The message is already safely stored — a failed alert email is
      // logged, not fatal. It'll still be visible in Supabase's Table
      // Editor even if this particular alert didn't arrive.
      console.error('contact.js: failed to send alert email', emailError);
    }
  }

  res.status(200).json({ ok: true });
};
