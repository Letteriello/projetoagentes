// src/app/api/feedback/route.test.ts
import { POST } from "./route"; // Adjust path as necessary
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe("POST /api/feedback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if feedback or type is missing", async () => {
    const reqMissingFeedback = {
      json: async () => ({ type: "bug", timestamp: "now", context: {} }),
    } as unknown as Request;
    let response = await POST(reqMissingFeedback);
    expect(response.status).toBe(400);
    let responseBody = await response.json();
    expect(responseBody.message).toBe("Feedback and type are required");

    const reqMissingType = {
      json: async () => ({ feedback: "test", timestamp: "now", context: {} }),
    } as unknown as Request;
    response = await POST(reqMissingType);
    expect(response.status).toBe(400);
    responseBody = await response.json();
    expect(responseBody.message).toBe("Feedback and type are required");
  });

  it("should return 200 and log feedback on success", async () => {
    const mockFeedback = {
      feedback: "This is a test feedback",
      type: "suggestion",
      timestamp: new Date().toISOString(),
      context: { page: "/agent-builder" },
    };
    const req = {
      json: async () => mockFeedback,
    } as unknown as Request;

    const response = await POST(req);
    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.message).toBe("Feedback received successfully");

    expect(logger.info).toHaveBeenCalledWith(
      {
        message: 'Feedback Received',
        feedbackType: mockFeedback.type,
        feedbackText: mockFeedback.feedback,
        timestamp: mockFeedback.timestamp,
        context: mockFeedback.context,
      },
      'User Feedback'
    );
  });

  it("should return 500 if an error occurs during processing", async () => {
    const req = {
      json: async () => {
        throw new Error("Test processing error");
      },
    } as unknown as Request;

    const response = await POST(req);
    expect(response.status).toBe(500);
    const responseBody = await response.json();
    expect(responseBody.message).toBe("Internal Server Error");
    expect(responseBody.error).toBe("Test processing error");
    expect(logger.error).toHaveBeenCalled();
  });
});
