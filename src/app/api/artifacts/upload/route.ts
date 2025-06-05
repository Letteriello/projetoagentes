import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validate that a file was provided
    if (!file) {
      // Log this specific validation error
      console.error('[API artifacts/upload POST] Validation Error: No file provided in form data.');
      return NextResponse.json(
        { success: false, error: 'No file provided. Please include a file in the "file" field of your form data.', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Simulate storing the file (actual implementation would involve cloud storage, etc.)
    // For now, just log information about the received file.
    // In a real scenario, this is where you'd use a service to upload the file bytes (file.arrayBuffer()).
    console.log(`[API artifacts/upload POST] Received file: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`);

    // Simulate a URI for the artifact after "upload"
    const simulatedUri = `simulated://path/to/artifact/${Date.now()}-${file.name}`;

    // Standardized success response
    return NextResponse.json({ success: true, data: { uri: simulatedUri } }, { status: 200 });

  } catch (error: any) {
    // Log the error (consider using a structured logger like Winston if available project-wide)
    console.error('[API artifacts/upload POST] Error processing file upload:', error);

    let errorMessage = 'An unexpected error occurred during file upload.';
    let errorCode = 'INTERNAL_SERVER_ERROR'; // Default to 500
    let httpStatus = 500;

    // Check if the error is likely due to formData parsing issues (e.g., malformed request)
    // This is a heuristic; specific environments might throw typed errors for this.
    if (error.message && (error.message.toLowerCase().includes('formdata') || error.message.toLowerCase().includes('multipart'))) {
        errorMessage = 'Error parsing form data. Ensure the request is a valid multipart/form-data request.';
        errorCode = 'BAD_REQUEST';
        httpStatus = 400;
    }
    // For other errors, keep it as a generic server error.
    // Specific file processing errors (e.g., storage service failure) could be given more specific codes.

    // Standardized error response
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: errorCode,
        details: error.message || String(error) // Provide original error message for details
      },
      { status: httpStatus }
    );
  }
}
