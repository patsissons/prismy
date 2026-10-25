import type { GraphqlClient } from "@shared/sync/engine";

/** The sync engine's transport: GitHub GraphQL via the Worker proxy. */
export const graphqlClient: GraphqlClient = async (
  query,
  variables,
  signal,
) => {
  const response = await fetch("/api/github/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
    signal,
  });
  const text = await response.text();
  let body: Awaited<ReturnType<GraphqlClient>>["body"];
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  const retryAfter = response.headers.get("retry-after");
  const reset = response.headers.get("x-ratelimit-reset");
  return {
    status: response.status,
    retryAfterSeconds: retryAfter ? Number(retryAfter) : null,
    resetAt: reset ? new Date(Number(reset) * 1000).toISOString() : null,
    body,
  };
};
