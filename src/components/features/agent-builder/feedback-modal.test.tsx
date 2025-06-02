import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FeedbackModal } from "./feedback-modal";
import { useToast } from "@/hooks/use-toast"; // Mock this

// Mock the useToast hook
jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ message: "Success" }),
  })
) as jest.Mock;

describe("FeedbackModal", () => {
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly when open", () => {
    render(<FeedbackModal isOpen={true} onOpenChange={mockOnOpenChange} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Enviar Feedback")).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
    expect(screen.getByLabelText("Feedback")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar Feedback" })).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<FeedbackModal isOpen={false} onOpenChange={mockOnOpenChange} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onOpenChange with false when cancel button is clicked", () => {
    render(<FeedbackModal isOpen={true} onOpenChange={mockOnOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("submits feedback successfully", async () => {
    const mockToast = jest.fn();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    render(<FeedbackModal isOpen={true} onOpenChange={mockOnOpenChange} />);

    fireEvent.change(screen.getByLabelText("Feedback"), {
      target: { value: "Test feedback message" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar Feedback" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/feedback", expect.any(Object));
    });
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Feedback Enviado!" })
    );
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows error if feedback text is empty", async () => {
     const mockToast = jest.fn();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    render(<FeedbackModal isOpen={true} onOpenChange={mockOnOpenChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Enviar Feedback" }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Feedback Vazio",
          variant: "destructive",
        })
      );
    });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
  });
});
