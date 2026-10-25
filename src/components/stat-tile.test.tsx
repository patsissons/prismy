import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatTile } from "./stat-tile";

describe("StatTile", () => {
  it("shows the value with an improving delta", () => {
    render(
      <StatTile
        label="Merged pull requests"
        value="42"
        delta={{ text: "+20%", direction: "up" }}
      />,
    );
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("+20%")).toHaveClass("text-(--status-good-text)");
  });

  it("treats a drop in cycle time as good and links to GitHub", () => {
    render(
      <StatTile
        label="Median cycle time"
        value="18h"
        delta={{ text: "−5%", direction: "down" }}
        higherIsBetter={false}
        href="https://github.com/search?q=is%3Apr"
      />,
    );
    expect(screen.getByText("−5%")).toHaveClass("text-(--status-good-text)");
    expect(
      screen.getByRole("link", { name: /Median cycle time: 18h/ }),
    ).toHaveAttribute("href", "https://github.com/search?q=is%3Apr");
  });
});
