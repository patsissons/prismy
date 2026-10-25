// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  cookieHeader,
  openSession,
  parseCookies,
  sealSession,
} from "./session";

const SECRET = "test-secret";

describe("session cookie", () => {
  it("round-trips a payload", async () => {
    const sealed = await sealSession(SECRET, {
      token: "gho_abc",
      scope: "private",
    });
    expect(sealed).not.toContain("gho_abc");
    expect(await openSession(SECRET, sealed)).toEqual({
      token: "gho_abc",
      scope: "private",
    });
  });

  it("rejects tampering, other keys and garbage", async () => {
    const sealed = await sealSession(SECRET, {
      token: "gho_abc",
      scope: "public",
    });
    expect(await openSession("other", sealed)).toBeNull();
    expect(await openSession(SECRET, sealed.slice(0, -2) + "zz")).toBeNull();
    expect(await openSession(SECRET, "not base64!")).toBeNull();
    expect(await openSession(SECRET, undefined)).toBeNull();
  });

  it("parses and serializes cookies", () => {
    expect(parseCookies("a=1; prismy_session=x.y; b=")).toEqual({
      a: "1",
      prismy_session: "x.y",
      b: "",
    });
    expect(parseCookies(null)).toEqual({});
    expect(cookieHeader("s", "v", { maxAge: 10, secure: true })).toBe(
      "s=v; Path=/; HttpOnly; SameSite=Lax; Max-Age=10; Secure",
    );
    expect(cookieHeader("s", "v", { maxAge: 10, secure: false })).not.toContain(
      "Secure",
    );
  });
});
