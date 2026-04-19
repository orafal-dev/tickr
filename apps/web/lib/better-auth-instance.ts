import { dash, sentinel } from "@better-auth/infra"
import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { organization } from "better-auth/plugins"

import {
  authDatabasePool,
  resolveAuthBaseURL,
  resolveAuthSecret,
  resolveBetterAuthInfraApiKey,
} from "@/lib/better-auth-env"
import { sendEmailVerificationMail } from "@/lib/email-verification-mail"
import { resolvePublicEmailVerificationUrl } from "@/lib/email-verification-url"
import { sendOrganizationInvitationMail } from "@/lib/organization-invitation-mail"
import { resolveSocialProvidersConfig } from "@/lib/oauth-providers"

const baseURL = resolveAuthBaseURL()
const betterAuthInfraApiKey = resolveBetterAuthInfraApiKey()

export const auth = betterAuth({
  baseURL,
  secret: resolveAuthSecret(),
  database: authDatabasePool,
  rateLimit: {
    enabled: true,
    customRules: {
      "/send-verification-email": {
        window: 300,
        max: 1,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 3600 * 24,
    sendVerificationEmail: async ({ user, url }) => {
      const confirmUrl = resolvePublicEmailVerificationUrl(url)
      await sendEmailVerificationMail({
        to: user.email,
        subject: "Confirm your email for Tickr",
        confirmUrl,
      })
    },
  },
  socialProviders: resolveSocialProvidersConfig(),
  plugins: [
    nextCookies(),
    dash({
      apiKey: betterAuthInfraApiKey,
    }),
    sentinel({
      apiKey: betterAuthInfraApiKey,
    }),
    organization({
      async sendInvitationEmail(data) {
        const inviteUrl = `${baseURL}/accept-invitation?invitationId=${encodeURIComponent(data.id)}`
        const inviterLabel =
          data.inviter.user.name?.trim() || data.inviter.user.email || "Someone"
        const subject = `Invitation to join ${data.organization.name}`
        await sendOrganizationInvitationMail({
          to: data.email,
          subject,
          inviterLabel,
          organizationName: data.organization.name,
          inviteUrl,
        })
      },
    }),
  ],
})

export type Session = typeof auth.$Infer.Session
