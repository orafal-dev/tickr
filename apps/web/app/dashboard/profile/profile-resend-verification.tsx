"use client"

import { useCallback, useState, type KeyboardEvent } from "react"

import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"

type ProfileResendVerificationProps = {
  email: string
  callbackURL: string
}

export const ProfileResendVerification = ({
  email,
  callbackURL,
}: ProfileResendVerificationProps) => {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const handleResendClick = useCallback(async () => {
    setMessage(null)
    setError(null)
    setIsSending(true)
    try {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL,
      })
      if (result.error) {
        if (result.error.status === 429) {
          setError(
            "You can request another confirmation email in a few minutes."
          )
          return
        }
        setError(result.error.message ?? "Could not send the email.")
        return
      }
      setMessage("Confirmation email sent. Check your inbox.")
    } catch (err) {
      const text =
        err instanceof Error ? err.message : "Could not send the email."
      setError(text)
    } finally {
      setIsSending(false)
    }
  }, [callbackURL, email])

  const handleResendKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return
      }
      event.preventDefault()
      void handleResendClick()
    },
    [handleResendClick]
  )

  return (
    <div className="flex flex-col gap-2 border-t pt-3">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Did not get the email? We can send another confirmation link. You can do
        this at most once every five minutes.
      </p>
      <Button
        aria-label="Resend confirmation email"
        loading={isSending}
        onClick={() => {
          void handleResendClick()
        }}
        onKeyDown={handleResendKeyDown}
        type="button"
        variant="secondary"
      >
        Resend confirmation email
      </Button>
      {message ? (
        <p
          className="text-sm text-emerald-600 dark:text-emerald-400"
          role="status"
        >
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
