import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

function renderApp(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("shows the landing page without a session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 401 })),
    );
    renderApp();
    expect(
      await screen.findByRole("heading", { name: /See your impact/ }),
    ).toBeInTheDocument();
  });

  it("sends a signed-out visitor from a repo page to the landing page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 401 })),
    );
    renderApp("/repo/acme/app");
    expect(
      await screen.findByRole("heading", { name: /See your impact/ }),
    ).toBeInTheDocument();
  });

  it("offers a retry when the server is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 500 })),
    );
    renderApp();
    expect(
      await screen.findByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });
});
