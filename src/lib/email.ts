import "server-only";
import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import type { EmailContent } from "@/lib/email-message";

// Amazon SES sender. Locally the AWS SDK finds your CLI credentials by itself.
// On Vercel, set SES_AWS_ACCESS_KEY_ID and SES_AWS_SECRET_ACCESS_KEY, because Vercel reserves AWS_* names.

export type EmailResult =
  { ok: true; messageId: string } | { ok: false; error: string; retryable: boolean };

const dryRun = () => process.env.EMAIL_DRY_RUN === "true";

/** True when email can go out: a sender address is set, or EMAIL_DRY_RUN is on for local demos. */
export function isEmailConfigured(): boolean {
  return dryRun() || Boolean(process.env.SES_FROM_ADDRESS);
}

/** SES allows a set number of emails a second. A new account gets 1, so that is the default. */
export function sendIntervalMs(): number {
  const rate = Number(process.env.SES_MAX_SEND_RATE);
  return dryRun() ? 0 : Math.ceil(1000 / (Number.isFinite(rate) && rate > 0 ? rate : 1));
}

let client: SESv2Client | null = null;
function getClient(): SESv2Client {
  const accessKeyId = process.env.SES_AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SES_AWS_SECRET_ACCESS_KEY;
  client ??= new SESv2Client({
    region: process.env.SES_AWS_REGION ?? "us-west-2",
    ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
  });
  return client;
}

const RETRYABLE = new Set(["TooManyRequestsException", "ThrottlingException", "Throttling"]);

/** Sends one email. Never throws, so one bad address cannot break a batch. */
export async function sendEmail(to: string, content: EmailContent): Promise<EmailResult> {
  if (dryRun()) {
    const [local, domain = ""] = to.split("@");
    console.info(`[email dry run] to ${local.slice(0, 1)}•••@${domain}: ${content.subject}`);
    return { ok: true, messageId: "dry-run" };
  }
  const from = process.env.SES_FROM_ADDRESS;
  if (!from) return { ok: false, error: "Email is not set up.", retryable: false };

  try {
    const out = await getClient().send(
      new SendEmailCommand({
        FromEmailAddress: from,
        Destination: { ToAddresses: [to] },
        Content: {
          Simple: {
            Subject: { Data: content.subject, Charset: "UTF-8" },
            Body: {
              Text: { Data: content.text, Charset: "UTF-8" },
              Html: { Data: content.html, Charset: "UTF-8" },
            },
          },
        },
      }),
    );
    return { ok: true, messageId: out.MessageId ?? "" };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    const text = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `${name}: ${text}`.slice(0, 300), retryable: RETRYABLE.has(name) };
  }
}
