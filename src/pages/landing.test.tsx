import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LandingPage } from "./landing";

function renderAt(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LandingPage />
    </MemoryRouter>,
  );
}

describe("LandingPage", () => {
  it("signs in for public repositories by default", () => {
    renderAt();
    expect(
      screen.getByRole("link", { name: /Continue with GitHub/ }),
    ).toHaveAttribute("href", "/api/auth/login?scope=public");
  });

  it("switches the sign-in link to private scope", async () => {
    renderAt();
    await userEvent.click(
      screen.getByRole("radio", { name: /Include private repositories/ }),
    );
    expect(
      screen.getByRole("link", { name: /Continue with GitHub/ }),
    ).toHaveAttribute("href", "/api/auth/login?scope=private");
  });

  it("explains a failed sign-in", () => {
    renderAt("/?error=state");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The sign-in link expired",
    );
  });
});
