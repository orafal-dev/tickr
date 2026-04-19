import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { apiFetch } from "@/lib/api"
import { getSession } from "@/lib/auth"

type RouteContext = Readonly<{
  params: Promise<{ path?: string[] }>
}>

const buildPmPath = (pathSegments: string[] | undefined): string => {
  if (!pathSegments || pathSegments.length === 0) {
    return "/pm"
  }
  return `/pm/${pathSegments.join("/")}`
}

const handlePmProxy = async (
  request: NextRequest,
  pathSegments: string[] | undefined
): Promise<Response> => {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
  const sessionModel = session.session as
    | { activeOrganizationId?: string | null }
    | undefined
  if (!sessionModel?.activeOrganizationId) {
    return NextResponse.json(
      {
        message:
          "Choose an active organization to use issues, projects, and labels.",
      },
      { status: 400 }
    )
  }
  const url = new URL(request.url)
  const search = url.searchParams.toString()
  const pmPath = `${buildPmPath(pathSegments)}${search ? `?${search}` : ""}`
  const method = request.method
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.text()
  let upstream: Response
  try {
    upstream = await apiFetch(pmPath, {
      method,
      body: body && body.length > 0 ? body : undefined,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "API error"
    if (message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    throw error
  }
  const responseBody = await upstream.text()
  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/json",
    },
  })
}

export const GET = async (
  request: NextRequest,
  context: RouteContext
): Promise<Response> => {
  const { path } = await context.params
  return handlePmProxy(request, path)
}

export const POST = async (
  request: NextRequest,
  context: RouteContext
): Promise<Response> => {
  const { path } = await context.params
  return handlePmProxy(request, path)
}

export const PATCH = async (
  request: NextRequest,
  context: RouteContext
): Promise<Response> => {
  const { path } = await context.params
  return handlePmProxy(request, path)
}

export const DELETE = async (
  request: NextRequest,
  context: RouteContext
): Promise<Response> => {
  const { path } = await context.params
  return handlePmProxy(request, path)
}
