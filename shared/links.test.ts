import { describe, expect, it } from "vitest";
import { githubPrSearchUrl } from "./links";

const window = {
  from: "2026-07-01T00:00:00.000Z",
  to: "2026-09-29T00:00:00.000Z",
};

describe("githubPrSearchUrl", () => {
  it("searches across GitHub for an author's merged PRs", () => {
    const url = new URL(githubPrSearchUrl({ author: "pat", mergedIn: window }));
    expect(url.pathname).toBe("/search");
    expect(url.searchParams.get("type")).toBe("pullrequests");
    expect(url.searchParams.get("q")).toBe(
      "is:pr author:pat merged:2026-07-01..2026-09-29",
    );
  });

  it("uses the repo's pull list for a repo", () => {
    const url = new URL(
      githubPrSearchUrl({ repo: "acme/app", state: "open", createdIn: window }),
    );
    expect(url.pathname).toBe("/acme/app/pulls");
    expect(url.searchParams.get("q")).toBe(
      "is:pr is:open created:2026-07-01..2026-09-29",
    );
  });
});
