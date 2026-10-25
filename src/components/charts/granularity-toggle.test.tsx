import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GranularityToggle } from "./granularity-toggle";

describe("GranularityToggle", () => {
  it("marks the selected granularity", () => {
    render(<GranularityToggle value="week" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Week" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Day" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("reports a new choice", async () => {
    const onChange = vi.fn();
    render(<GranularityToggle value="week" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Day" }));
    expect(onChange).toHaveBeenCalledWith("day");
  });
});
