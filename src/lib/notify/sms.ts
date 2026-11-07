import "server-only";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";

// AWS SNS text messages. In the SNS sandbox, texts only reach phone numbers verified in the
// AWS console, which is fine for a demo with the team's own phones.

let client: SNSClient | null = null;

export function smsConfigured(): boolean {
  return Boolean(
    process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY,
  );
}

export type SmsResult = { ok: true; messageId: string | null } | { ok: false; error: string };

export async function sendSms(phone: string, message: string): Promise<SmsResult> {
  // The SDK reads AWS_REGION, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from the environment.
  client ??= new SNSClient({});
  try {
    const result = await client.send(
      new PublishCommand({
        PhoneNumber: phone,
        Message: message,
        MessageAttributes: {
          "AWS.SNS.SMS.SMSType": { DataType: "String", StringValue: "Transactional" },
        },
      }),
    );
    return { ok: true, messageId: result.MessageId ?? null };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** The site's public address, for links inside texts. */
export function appUrl(): string {
  const explicit = process.env.APP_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}
