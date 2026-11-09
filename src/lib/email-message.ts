// Pure helpers for the text of an email. No network, so they are easy to unit test.

export type EmailContent = { subject: string; text: string; html: string };

export function appUrl(env: Record<string, string | undefined> = process.env): string {
  const explicit = env.APP_URL ?? env.AUTH_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** One line only. Stops a stray line break in a name from ever reaching an email header. */
export function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function shorten(text: string, max: number): string {
  const clean = oneLine(text);
  return clean.length <= max ? clean : `${clean.slice(0, max - 3).trimEnd()}...`;
}

const DISCLAIMER = "Information may change. Always confirm eligibility on the official site.";

function wrap(bodyHtml: string, footerHtml: string): string {
  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:24px;background:#f6f8f7;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#10231c;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dfe6e2;border-radius:12px;padding:24px;">
<p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#0b6b4f;">Gapless</p>
${bodyHtml}
<p style="margin:24px 0 0;font-size:13px;color:#5b6b64;">${escapeHtml(DISCLAIMER)}</p>
</div>
<p style="max-width:560px;margin:12px auto 0;font-size:12px;color:#5b6b64;">${footerHtml}</p>
</body></html>`;
}

function footerText(baseUrl: string): string {
  return `You get this email because you turned on email alerts at Gapless.\nTo stop, turn them off here: ${baseUrl}/profile#email-alerts`;
}

function footerHtml(baseUrl: string): string {
  const link = escapeHtml(`${baseUrl}/profile#email-alerts`);
  return `You get this email because you turned on email alerts at Gapless. <a href="${link}" style="color:#5b6b64;">Turn them off</a>.`;
}

/** The email sent when a new official listing matches someone. */
export function newListingEmail(
  listing: { name: string; summary: string; slug: string },
  baseUrl: string,
): EmailContent {
  const name = oneLine(listing.name);
  const summary = shorten(listing.summary, 280);
  const url = `${baseUrl}/listings/${listing.slug}`;
  const subject = `New program for you: ${shorten(name, 120)}`;

  const text = [
    `New program for you: ${name}`,
    "",
    summary,
    "",
    "See the details and the official link:",
    url,
    "",
    DISCLAIMER,
    "",
    footerText(baseUrl),
  ].join("\n");

  const html = wrap(
    `<h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;">New program for you: ${escapeHtml(name)}</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.5;">${escapeHtml(summary)}</p>
<a href="${escapeHtml(url)}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#0b6b4f;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">See the details</a>`,
    footerHtml(baseUrl),
  );
  return { subject, text, html };
}

/** Sent once when someone turns on email alerts. */
export function confirmationEmail(baseUrl: string): EmailContent {
  const subject = "Email alerts are on";
  const text = [
    "Email alerts are on.",
    "",
    "We will email you when a new program is added for you.",
    "",
    footerText(baseUrl),
  ].join("\n");
  const html = wrap(
    `<h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;">Email alerts are on</h1>
<p style="margin:0;font-size:15px;line-height:1.5;">We will email you when a new program is added for you.</p>`,
    footerHtml(baseUrl),
  );
  return { subject, text, html };
}
