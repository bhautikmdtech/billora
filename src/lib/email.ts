import type { ReactElement } from "react";
import { Resend } from "resend";

import { envConfig, env } from "@/lib/env";
import { logger } from "@/lib/logger";

export type EmailTemplateName =
  | "welcome"
  | "invite"
  | "password-reset"
  | "bill-customer"
  | "daily-summary"
  | "payment-failed"
  | "payment-success"
  | "low-stock-alert"
  | "contact-inquiry";

export interface EmailPayload {
  subject: string;
  react: ReactElement;
}

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendEmail(
  to: string | string[],
  template: EmailTemplateName,
  payload: EmailPayload
) {
  if (!resend || !envConfig.notifications.resendFromEmail) {
    logger.warn({ template }, "Skipping email send because Resend is not configured");
    return;
  }

  try {
    await resend.emails.send({
      from: `${envConfig.notifications.resendFromName} <${envConfig.notifications.resendFromEmail}>`,
      to,
      subject: payload.subject,
      react: payload.react,
    });
  } catch (error) {
    logger.error({ error, template }, "Failed to send email");
  }
}

