import "server-only"

import OrganizationInvitationEmail from "@workspace/transactional/emails/organization-invitation"
import { render, toPlainText } from "react-email"

import { sendSmtpMail } from "@/lib/smtp-mail"

import type { SendOrganizationInvitationMailInput } from "./organization-invitation-mail.types"

export const sendOrganizationInvitationMail = async (
  input: SendOrganizationInvitationMailInput
): Promise<void> => {
  const html = await render(
    <OrganizationInvitationEmail
      inviterLabel={input.inviterLabel}
      organizationName={input.organizationName}
      inviteUrl={input.inviteUrl}
    />
  )
  const text = toPlainText(html)
  await sendSmtpMail({
    to: input.to,
    subject: input.subject,
    text,
    html,
  })
}
