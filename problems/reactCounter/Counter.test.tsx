import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Counter from "./Counter";

describe("Counter component", () => {
  it("renders with initial value and increments", () => {
    const { getByText } = render(<Counter />);

    const countText = getByText("Count: 0");
    const button = getByText("Increment");

    fireEvent.click(button);

    expect(getByText("Count: 1")).toBeTruthy();
  });
});
