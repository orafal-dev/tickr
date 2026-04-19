import "server-only"

import EmailVerificationEmail from "@workspace/transactional/emails/email-verification"
import { render, toPlainText } from "react-email"

import { sendSmtpMail } from "@/lib/smtp-mail"

import type { SendEmailVerificationMailInput } from "./email-verification-mail.types"

export const sendEmailVerificationMail = async (
  input: SendEmailVerificationMailInput
): Promise<void> => {
  const html = await render(
    <EmailVerificationEmail confirmUrl={input.confirmUrl} />
  )
  const text = toPlainText(html)
  await sendSmtpMail({
    to: input.to,
    subject: input.subject,
    text,
    html,
  })
}
