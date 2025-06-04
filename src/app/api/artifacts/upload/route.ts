import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // Simulate storing the file
    console.log(`Received file: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`);

    // Simulate a URI for the artifact
    const simulatedUri = `simulated://path/to/artifact/${file.name}`;

    return NextResponse.json({ uri: simulatedUri });
  } catch (error) {
    console.error('Error processing file upload:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: 'Error processing file upload.', details: errorMessage }, { status: 500 });
  }
}
