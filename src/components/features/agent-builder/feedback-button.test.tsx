import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FeedbackButton } from "./feedback-button";

describe("FeedbackButton", () => {
  it("renders the button with text and icon", () => {
    const handleClick = jest.fn();
    render(<FeedbackButton onClick={handleClick} />);

    expect(screen.getByRole("button", { name: /Feedback/i })).toBeInTheDocument();
    expect(screen.getByText("Feedback")).toBeInTheDocument();
    // Check for icon if it's identifiable, e.g., by class or title if added
  });

  it("calls onClick prop when clicked", () => {
    const handleClick = jest.fn();
    render(<FeedbackButton onClick={handleClick} />);

    fireEvent.click(screen.getByRole("button", { name: /Feedback/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
