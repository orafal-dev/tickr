"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import { authClient } from "@/lib/auth-client"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

export const DashboardOrganizationSwitcher = () => {
  const router = useRouter()
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const organizations = authClient.useListOrganizations()
  const [isSaving, setIsSaving] = useState(false)

  const activeOrganizationId = session?.session.activeOrganizationId ?? ""

  const organizationOptions = useMemo(() => {
    if (!organizations.data || organizations.error) {
      return []
    }
    return organizations.data.map((organization) => ({
      id: organization.id,
      name: organization.name,
    }))
  }, [organizations.data, organizations.error])

  useEffect(() => {
    if (sessionPending || organizations.isPending) {
      return
    }
    if (!session?.user) {
      return
    }
    if (session.session.activeOrganizationId) {
      return
    }
    const firstId = organizations.data?.[0]?.id
    if (!firstId) {
      return
    }
    let cancelled = false
    void (async () => {
      const result = await authClient.organization.setActive({
        organizationId: firstId,
      })
      if (!cancelled && !result.error) {
        router.refresh()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    organizations.data,
    organizations.isPending,
    organizations.error,
    router,
    session,
    sessionPending,
  ])

  const handleOrganizationChange = useCallback(
    async (nextId: string) => {
      if (!nextId || nextId === activeOrganizationId) {
        return
      }
      setIsSaving(true)
      try {
        const result = await authClient.organization.setActive({
          organizationId: nextId,
        })
        if (!result.error) {
          router.refresh()
        }
      } finally {
        setIsSaving(false)
      }
    },
    [activeOrganizationId, router]
  )

  const selectValue = activeOrganizationId || organizationOptions[0]?.id || ""

  const workspaceLabel = useMemo(() => {
    const match = organizationOptions.find(
      (organization) => organization.id === selectValue
    )
    return match?.name ?? "Workspace"
  }, [organizationOptions, selectValue])

  if (sessionPending || organizations.isPending) {
    return (
      <span className="text-xs text-muted-foreground">Loading workspaces…</span>
    )
  }

  if (!organizations.data || organizations.data.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        Create a workspace from onboarding to use issues.
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className="shrink-0 text-muted-foreground"
        id="dashboard-workspace-field-label"
      >
        Workspace
      </span>
      <Select
        onValueChange={(next) => {
          void handleOrganizationChange(next as string)
        }}
        value={selectValue}
      >
        <SelectTrigger
          aria-labelledby="dashboard-workspace-field-label"
          className="w-[min(100%,14rem)] max-w-[14rem] min-w-0"
          disabled={isSaving}
          size="sm"
        >
          <SelectValue>{workspaceLabel}</SelectValue>
        </SelectTrigger>
        <SelectPopup>
          {organizationOptions.map((organization) => (
            <SelectItem key={organization.id} value={organization.id}>
              {organization.name}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    </div>
  )
}
