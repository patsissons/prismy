/**
 * GraphQL documents and search strings. Every document includes `rateLimit`
 * (free) so the client always knows its budget.
 */

export const PR_FIELDS = /* GraphQL */ `
  id
  number
  title
  url
  isDraft
  state
  createdAt
  updatedAt
  mergedAt
  closedAt
  additions
  deletions
  changedFiles
  baseRefName
  reviewDecision
  totalCommentsCount
  repository {
    nameWithOwner
    isPrivate
  }
  author {
    login
    avatarUrl
  }
  mergedBy {
    login
  }
  labels(first: 5) {
    nodes {
      name
    }
  }
  commits(first: 1) {
    totalCount
  }
  reviewThreads(first: 1) {
    totalCount
  }
  reviews(first: 10) {
    totalCount
    nodes {
      state
      submittedAt
      author {
        login
      }
    }
  }
`;

export const RATE_LIMIT_FIELDS = /* GraphQL */ `
  rateLimit {
    cost
    remaining
    resetAt
  }
`;

export const VIEWER_QUERY = /* GraphQL */ `
  query Viewer {
    viewer {
      login
      name
      avatarUrl
    }
    ${RATE_LIMIT_FIELDS}
  }
`;

export const SEARCH_COUNT_QUERY = /* GraphQL */ `
  query SearchCount($q: String!) {
    search(type: ISSUE, query: $q, first: 1) {
      issueCount
    }
    ${RATE_LIMIT_FIELDS}
  }
`;

export const SEARCH_PRS_QUERY = /* GraphQL */ `
  query SearchPRs($q: String!, $first: Int!, $after: String) {
    search(type: ISSUE, query: $q, first: $first, after: $after) {
      issueCount
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on PullRequest {
          ${PR_FIELDS}
        }
      }
    }
    ${RATE_LIMIT_FIELDS}
  }
`;

export const PRS_BY_IDS_QUERY = /* GraphQL */ `
  query PRsByIds($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on PullRequest {
        ${PR_FIELDS}
      }
    }
    ${RATE_LIMIT_FIELDS}
  }
`;

export interface SearchTerms {
  /** PRs authored by this login. */
  author?: string;
  /** PRs in this `owner/name` repo. */
  repo?: string;
  /** Inclusive creation-date range, YYYY-MM-DD. */
  createdFrom: string;
  createdTo: string;
  /** Only PRs updated at or after this ISO instant. */
  updatedSince?: string;
}

/** The GitHub search string for a slice of one source. */
export function searchString(terms: SearchTerms): string {
  const parts = ["is:pr"];
  if (terms.author) parts.push(`author:${terms.author}`);
  if (terms.repo) parts.push(`repo:${terms.repo}`);
  parts.push(`created:${terms.createdFrom}..${terms.createdTo}`);
  if (terms.updatedSince) parts.push(`updated:>=${terms.updatedSince}`);
  parts.push("sort:created-desc");
  return parts.join(" ");
}
