import "server-only";
import { Resend } from "resend";
import { serverEnv } from "@/lib/env/server";
import { InviteEmail } from "@/emails/InviteEmail";
import React from "react";

const resend = new Resend(serverEnv.RESEND_API_KEY);

const FROM = serverEnv.RESEND_FROM_EMAIL
  ? `${serverEnv.RESEND_FROM_NAME} <${serverEnv.RESEND_FROM_EMAIL}>`
  : "Billora ERP <noreply@billora.app>";

async function send(to: string | string[], subject: string, react: React.ReactElement) {
  if (!serverEnv.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping email to", to);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, react });
  } catch (err) {
    console.error("[email] send failed:", err);
  }
}

export async function sendInviteEmail(opts: {
  to: string;
  orgName: string;
  role: string;
  inviterName: string;
  token: string;
}) {
  await send(
    opts.to,
    `You've been invited to join ${opts.orgName} on Billora ERP`,
    React.createElement(InviteEmail, {
      orgName: opts.orgName,
      role: opts.role,
      inviterName: opts.inviterName,
      token: opts.token,
    })
  );
}
