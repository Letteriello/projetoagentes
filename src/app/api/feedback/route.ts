import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger'; // Assuming you have a logger utility

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { feedback, type, timestamp, context } = body; // Assuming body is now parsed safely

    // Validate required fields
    if (!feedback || typeof feedback !== 'string' || feedback.trim() === "") {
      logger.warn('[API feedback POST] Validation Error: Feedback is required and must be a non-empty string.', { receivedFeedback: feedback });
      return NextResponse.json(
        { success: false, error: "Feedback is required and must be a non-empty string.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (!type || typeof type !== 'string' || type.trim() === "") {
      logger.warn('[API feedback POST] Validation Error: Type is required and must be a non-empty string.', { receivedType: type });
      return NextResponse.json(
        { success: false, error: "Type is required and must be a non-empty string.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Log the feedback (replace with actual storage/service call in the future)
    // This part remains conceptually the same.
    logger.info({
      message: 'Feedback Received',
      feedbackType: type,
      feedbackText: feedback, // Already validated as non-empty string
      timestamp: timestamp || new Date().toISOString(), // Default to now if not provided
      context, // Context can be any JSON, so no specific validation here unless required
    }, 'User Feedback');

    // Standardized success response
    return NextResponse.json(
      { success: true, data: { message: "Feedback received successfully." } },
      { status: 200 }
    );

  } catch (error: any) { // Catch block for req.json() parsing or other unexpected errors
    let errorMessage = 'An unexpected error occurred while processing feedback.';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let httpStatus = 500;
    let errorDetails = error.message || String(error);

    if (error.name === 'SyntaxError' && error.message.toLowerCase().includes('json')) {
      errorMessage = "Invalid JSON payload provided.";
      errorCode = 'BAD_REQUEST';
      httpStatus = 400;
      // errorDetails is already set from error.message
      logger.warn('[API feedback POST] Bad Request: Invalid JSON payload.', { detail: errorDetails });
    } else {
      // Log other unexpected errors
      logger.error({
          message: 'Error processing feedback submission',
          error: errorDetails,
          stack: error.stack
      }, 'Feedback API Error');
    }

    // Standardized error response
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: errorCode,
        details: errorDetails
      },
      { status: httpStatus }
    );
  }
}
// Helper to parse JSON safely, to be used at the beginning of the try block.
async function parseRequestBody(request: Request) {
    try {
        return await request.json();
    } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        error.name = 'SyntaxError'; // Mark it to be handled as a JSON parsing error
        throw error;
    }
}

// The main POST function needs to be updated to call parseRequestBody
export async function POST(request: Request) {
  try {
    // Use the safe parsing helper
    const body = await parseRequestBody(request);
    const { feedback, type, timestamp, context } = body;

    // Validate required fields (feedback and type)
    if (!feedback || typeof feedback !== 'string' || feedback.trim() === "") {
      logger.warn('[API feedback POST] Validation Error: Feedback is required and must be a non-empty string.', { receivedFeedback: feedback });
      return NextResponse.json(
        { success: false, error: "Feedback is required and must be a non-empty string.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (!type || typeof type !== 'string' || type.trim() === "") {
      logger.warn('[API feedback POST] Validation Error: Type is required and must be a non-empty string.', { receivedType: type });
      return NextResponse.json(
        { success: false, error: "Type is required and must be a non-empty string.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Log the feedback (replace with actual storage/service call in the future)
    logger.info({
      message: 'Feedback Received',
      feedbackType: type.trim(), // Use trimmed type
      feedbackText: feedback.trim(), // Use trimmed feedback
      timestamp: timestamp || new Date().toISOString(), // Default to now if not provided
      context, // Context can be any JSON
    }, 'User Feedback');

    // Standardized success response
    return NextResponse.json(
      { success: true, data: { message: "Feedback received successfully." } },
      { status: 200 }
    );

  } catch (error: any) {
    let errorMessage = 'An unexpected error occurred while processing feedback.';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let httpStatus = 500;
    let errorDetails = error.message || String(error);

    // Check if it's a SyntaxError from our helper (or directly from a failed req.json() if helper wasn't used)
    if (error.name === 'SyntaxError') {
      errorMessage = "Invalid JSON payload provided.";
      errorCode = 'BAD_REQUEST';
      httpStatus = 400;
      logger.warn('[API feedback POST] Bad Request: Invalid JSON payload.', { detail: errorDetails });
    } else {
      // Log other unexpected errors
      logger.error({
          message: 'Error processing feedback submission',
          originalError: errorDetails, // Keep original error message under a specific key
          stack: error.stack
      }, 'Feedback API Error');
    }

    // Standardized error response
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: errorCode,
        details: errorDetails // Expose original error message for detail
      },
      { status: httpStatus }
    );
  }
}
