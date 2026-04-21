import "server-only"

import nodemailer from "nodemailer"
import { UseSend } from "usesend-js"
import { z } from "zod"

import type { SendSmtpMailInput } from "./smtp-mail.types"

const smtpConfigSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().positive(),
  user: z.string().optional(),
  password: z.string().optional(),
  from: z.string().min(1),
})

const useSendConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url().optional(),
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
let useSendClient: UseSend | null = null

const getUseSendClient = (): UseSend | null => {
  if (useSendClient) {
    return useSendClient
  }
  const rawApiKey = process.env.USESEND_API_KEY?.trim()
  if (!rawApiKey) {
    return null
  }
  const parsed = useSendConfigSchema.parse({
    apiKey: rawApiKey,
    baseUrl: process.env.USESEND_BASE_URL?.trim() || undefined,
  })
  const { apiKey, baseUrl } = parsed
  useSendClient = new UseSend(apiKey, baseUrl)
  return useSendClient
}

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
  const useSend = getUseSendClient()
  if (useSend) {
    const from = process.env.SMTP_FROM?.trim() || "Tickr <noreply@localhost>"
    await useSend.emails.send({
      to: input.to,
      from,
      subject: input.subject,
      html: input.html,
      text: input.text,
    })
    return
  }
  const smtpConfig = resolveSmtpConfig()
  const transport = getTransporter()
  await transport.sendMail({
    from: smtpConfig.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  })
}
