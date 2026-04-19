const buildUrl = (path: string): string => {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `/api/pm${normalized}`
}

export const pmJson = async <T>(
  path: string,
  init?: RequestInit
): Promise<T> => {
  const res = await fetch(buildUrl(path), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(text || res.statusText)
  }
  if (!text) {
    return undefined as T
  }
  return JSON.parse(text) as T
}
