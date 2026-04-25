// Lumen email service — Resend-backed, Svelte-rendered templates.
//
// In dev (no RESEND_API_KEY), every send is logged to stderr with the
// rendered HTML and plaintext, then returns success. In production a
// missing key is a startup error.

import { Resend } from 'resend';
import type { Component } from 'svelte';
import { render } from 'svelte/server';

const apiKey = process.env['RESEND_API_KEY'];
const fromAddress = process.env['EMAIL_FROM'] ?? 'Lumen <no-reply@lumen.so>';
const replyTo = process.env['EMAIL_REPLY_TO'] ?? 'support@lumen.so';
const isProduction = process.env['NODE_ENV'] === 'production';

if (isProduction && !apiKey) {
  throw new Error('RESEND_API_KEY is required in production.');
}

const client = apiKey ? new Resend(apiKey) : null;

export interface SendEmailInput<P extends Record<string, unknown>> {
  to: string | string[];
  subject: string;
  /** Svelte component (server-rendered) producing the HTML body. */
  template: Component<P>;
  /** Props passed to the template. */
  props: P;
  /** Optional plain-text version. If omitted, derived from HTML. */
  text?: string;
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
}

export async function sendEmail<P extends Record<string, unknown>>(
  input: SendEmailInput<P>,
): Promise<{ id: string | null }> {
  const rendered = render(input.template, { props: input.props });
  const html = wrapShell(rendered.body);
  const text = input.text ?? stripHtml(rendered.body);

  if (!client) {
    console.info(
      JSON.stringify({
        level: 'info',
        event: 'email.send.dev',
        to: input.to,
        subject: input.subject,
        text,
      }),
    );
    return { id: null };
  }

  const result = await client.emails.send({
    from: fromAddress,
    to: input.to,
    replyTo,
    subject: input.subject,
    html,
    text,
    ...(input.headers ? { headers: input.headers } : {}),
    ...(input.tags ? { tags: input.tags } : {}),
  });

  if (result.error) {
    throw new Error(`Resend send failed: ${result.error.message}`);
  }
  return { id: result.data?.id ?? null };
}

const wrapShell = (body: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <title>Lumen</title>
    <style>
      body { margin:0; padding:0; background:#fafafa; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#1a1a1a; }
      .shell { max-width: 560px; margin: 0 auto; padding: 32px 20px; }
      .card { background:#fff; border:1px solid #ececec; border-radius:14px; padding:32px; }
      h1 { font-size:22px; font-weight:600; letter-spacing:-0.02em; margin:0 0 8px; }
      p { line-height:1.55; margin:0 0 16px; color:#333; }
      a.button { display:inline-block; padding:10px 18px; background:#2c3ce0; color:#fff; text-decoration:none; border-radius:8px; }
      .muted { color:#888; font-size:13px; }
      footer { margin-top: 24px; text-align:center; }
      footer a { color:#888; text-decoration:underline; }
    </style>
  </head>
  <body>
    <div class="shell">
      <div class="card">${body}</div>
      <footer class="muted">
        <p>You're receiving this because you have an account at <a href="https://lumen.so">lumen.so</a>.</p>
      </footer>
    </div>
  </body>
</html>`;

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
