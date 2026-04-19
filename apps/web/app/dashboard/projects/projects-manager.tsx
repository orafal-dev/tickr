"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { pmJson } from "@/lib/pm-browser";
import type { PmProject } from "@/lib/pm.types";
import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { RichTextEditor } from "@workspace/ui/components/rich-text-editor";
import { isStoredRichTextContentEmpty } from "@workspace/ui/lib/rich-text-tiptap";

export const ProjectsManager = () => {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const activeOrganizationId = session?.session.activeOrganizationId ?? "";
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const projectsQuery = useQuery({
    queryKey: ["pm", "projects"],
    queryFn: () => pmJson<PmProject[]>("/projects"),
    enabled: Boolean(activeOrganizationId),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return pmJson<PmProject>("/projects", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: isStoredRichTextContentEmpty(description)
            ? undefined
            : description,
        }),
      });
    },
    onSuccess: async () => {
      setName("");
      setDescription("");
      await queryClient.invalidateQueries({ queryKey: ["pm", "projects"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      status: PmProject['status'];
    }) => {
      return pmJson<PmProject>(`/projects/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: input.status }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pm", "projects"] });
    },
  });

  if (!activeOrganizationId) {
    return (
      <p className="text-muted-foreground text-sm">
        Select a workspace from the header first.
      </p>
    );
  }

  const handleCreate = () => {
    if (!name.trim()) {
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto">
      <div>
        <h1 className="font-heading text-2xl font-medium">Projects</h1>
        <p className="text-muted-foreground text-sm">
          Group issues under a project with a simple lifecycle status.
        </p>
      </div>

      <section
        aria-label="Create project"
        className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-xs/5"
      >
        <Field name="project-name">
          <FieldLabel>Name</FieldLabel>
          <Input
            aria-label="Project name"
            onChange={(event) => {
              setName(event.target.value);
            }}
            value={name}
          />
        </Field>
        <Field name="project-description">
          <FieldLabel>Description</FieldLabel>
          <RichTextEditor
            aria-label="Project description"
            disabled={createMutation.isPending}
            onChange={setDescription}
            value={description}
          />
        </Field>
        <Button
          disabled={createMutation.isPending || !name.trim()}
          onClick={handleCreate}
          type="button"
        >
          Create project
        </Button>
      </section>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {(projectsQuery.data ?? []).map((project) => (
              <tr className="border-t" key={project.id}>
                <td className="px-3 py-2 font-medium">{project.name}</td>
                <td className="px-3 py-2">
                  <select
                    aria-label={`Status for ${project.name}`}
                    className="border-input bg-background h-8 rounded-md border px-2 text-xs capitalize"
                    onChange={(event) => {
                      updateMutation.mutate({
                        id: project.id,
                        status: event.target.value as PmProject['status'],
                      });
                    }}
                    value={project.status}
                  >
                    {['planned', 'active', 'completed', 'paused'].map(
                      (status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ),
                    )}
                  </select>
                </td>
                <td className="text-muted-foreground px-3 py-2 text-xs">
                  {new Date(project.updatedAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {!projectsQuery.isPending &&
            (projectsQuery.data ?? []).length === 0 ? (
              <tr>
                <td className="text-muted-foreground px-3 py-6" colSpan={3}>
                  No projects yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};
