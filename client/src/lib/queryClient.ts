import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  if (typeof window !== 'undefined') {
    const activeOrgId = localStorage.getItem('activeOrgId');
    if (activeOrgId) {
      headers['X-Organization-Id'] = activeOrgId;
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

function buildUrlFromQueryKey(queryKey: readonly unknown[]): string {
  const pathParts: string[] = [];
  const params: Record<string, string> = {};
  
  for (const segment of queryKey) {
    if (typeof segment === "string") {
      if (segment.startsWith("http://") || segment.startsWith("https://")) {
        return segment;
      }
      pathParts.push(segment);
    } else if (typeof segment === "object" && segment !== null) {
      for (const [key, value] of Object.entries(segment)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params[key] = value.map(v => String(v)).join(",");
          } else {
            params[key] = String(value);
          }
        }
      }
    }
  }
  
  let path = pathParts
    .join("/")
    .replace(/\/+/g, "/")
    .replace(/^\/?/, "/");
  
  const sortedKeys = Object.keys(params).sort();
  if (sortedKeys.length > 0) {
    const queryString = sortedKeys
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join("&");
    path += "?" + queryString;
  }
  
  return path;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    
    if (typeof window !== 'undefined') {
      const activeOrgId = localStorage.getItem('activeOrgId');
      if (activeOrgId) {
        headers['X-Organization-Id'] = activeOrgId;
      }
    }

    const url = buildUrlFromQueryKey(queryKey);

    const res = await fetch(url, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
