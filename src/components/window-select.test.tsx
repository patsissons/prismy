import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WindowSelect } from "./window-select";

describe("WindowSelect", () => {
  it("marks the selected window", () => {
    render(<WindowSelect value="90d" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "90d" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "1y" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("reports a new choice", async () => {
    const onChange = vi.fn();
    render(<WindowSelect value="90d" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "30d" }));
    expect(onChange).toHaveBeenCalledWith("30d");
  });
});
