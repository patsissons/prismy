import { describe, expect, it } from "vitest";
import { searchString } from "./queries";

describe("searchString", () => {
  it("builds an authored slice", () => {
    expect(
      searchString({
        author: "pat",
        createdFrom: "2026-01-01",
        createdTo: "2026-03-31",
      }),
    ).toBe("is:pr author:pat created:2026-01-01..2026-03-31 sort:created-desc");
  });

  it("builds an incremental repo slice", () => {
    expect(
      searchString({
        repo: "acme/app",
        createdFrom: "2026-01-01",
        createdTo: "2026-03-31",
        updatedSince: "2026-03-30T12:00:00.000Z",
      }),
    ).toBe(
      "is:pr repo:acme/app created:2026-01-01..2026-03-31 updated:>=2026-03-30T12:00:00.000Z sort:created-desc",
    );
  });
});
