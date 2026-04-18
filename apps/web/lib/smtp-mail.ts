import "server-only"

import nodemailer from "nodemailer"
import { z } from "zod"

import type { SendSmtpMailInput } from "./smtp-mail.types"

const smtpConfigSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().positive(),
  user: z.string().optional(),
  password: z.string().optional(),
  from: z.string().min(1),
})

const resolveSmtpConfig = () => {
  const host = process.env.SMTP_HOST?.trim() || "127.0.0.1"
  const portRaw = process.env.SMTP_PORT?.trim() || "1025"
  const user = process.env.SMTP_USER?.trim() || undefined
  const password = process.env.SMTP_PASSWORD?.trim() || undefined
  const from = process.env.SMTP_FROM?.trim() || "Tickr <noreply@localhost>"

  return smtpConfigSchema.parse({
    host,
    port: portRaw,
    user: user || undefined,
    password: password || undefined,
    from,
  })
}

let transporter: nodemailer.Transporter | null = null

const getTransporter = (): nodemailer.Transporter => {
  if (transporter) {
    return transporter
  }
  const config = resolveSmtpConfig()
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: false,
    ...(config.user && config.password
      ? { auth: { user: config.user, pass: config.password } }
      : {}),
  })
  return transporter
}

export const sendSmtpMail = async (input: SendSmtpMailInput): Promise<void> => {
  const config = resolveSmtpConfig()
  const transport = getTransporter()
  await transport.sendMail({
    from: config.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  })
}
