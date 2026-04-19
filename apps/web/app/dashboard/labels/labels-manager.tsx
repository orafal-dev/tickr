"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { authClient } from "@/lib/auth-client"
import { pmJson } from "@/lib/pm-browser"
import type { PmLabel } from "@/lib/pm.types"
import { LabelColorPicker } from "@/components/label-color-picker"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

export const LabelsManager = () => {
  const queryClient = useQueryClient()
  const { data: session } = authClient.useSession()
  const activeOrganizationId = session?.session.activeOrganizationId ?? ""
  const [name, setName] = useState("")
  const [color, setColor] = useState("#6366F1")

  const labelsQuery = useQuery({
    queryKey: ["pm", "labels"],
    queryFn: () => pmJson<PmLabel[]>("/labels"),
    enabled: Boolean(activeOrganizationId),
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      return pmJson<PmLabel>("/labels", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), color }),
      })
    },
    onSuccess: async () => {
      setName("")
      setColor("#6366F1")
      await queryClient.invalidateQueries({ queryKey: ["pm", "labels"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await pmJson<undefined>(`/labels/${id}`, { method: "DELETE" })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pm", "labels"] })
    },
  })

  if (!activeOrganizationId) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a workspace from the header first.
      </p>
    )
  }

  const handleCreate = () => {
    if (!name.trim()) {
      return
    }
    createMutation.mutate()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto">
      <div>
        <h1 className="font-heading text-2xl font-medium">Labels</h1>
        <p className="text-sm text-muted-foreground">
          Tag issues with colored labels.
        </p>
      </div>

      <section
        aria-label="Create label"
        className="grid gap-3 rounded-lg border bg-card p-4 shadow-xs/5 sm:grid-cols-3"
      >
        <Field className="sm:col-span-2" name="label-name">
          <FieldLabel>Name</FieldLabel>
          <Input
            aria-label="Label name"
            onChange={(event) => {
              setName(event.target.value)
            }}
            value={name}
          />
        </Field>
        <Field name="label-color">
          <FieldLabel>Color</FieldLabel>
          <div className="flex items-center gap-3">
            <LabelColorPicker
              aria-label="Label color"
              onChange={setColor}
              value={color}
            />
            <span className="font-mono text-xs text-muted-foreground">
              {color}
            </span>
          </div>
        </Field>
        <div className="sm:col-span-3">
          <Button
            disabled={createMutation.isPending || !name.trim()}
            onClick={handleCreate}
            type="button"
          >
            Create label
          </Button>
        </div>
      </section>

      <ul className="flex flex-col gap-2">
        {(labelsQuery.data ?? []).map((label) => (
          <li
            className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 text-sm shadow-xs/5"
            key={label.id}
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="inline-block size-3.5 shrink-0 rounded-full border border-border shadow-xs/5 ring-2 ring-background"
                style={{ backgroundColor: label.color }}
              />
              <span className="font-medium">{label.name}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {label.color}
              </span>
            </div>
            <Button
              disabled={deleteMutation.isPending}
              onClick={() => {
                deleteMutation.mutate(label.id)
              }}
              size="sm"
              type="button"
              variant="destructive-outline"
            >
              Delete
            </Button>
          </li>
        ))}
        {!labelsQuery.isPending && (labelsQuery.data ?? []).length === 0 ? (
          <li className="text-sm text-muted-foreground">No labels yet.</li>
        ) : null}
      </ul>
    </div>
  )
}
