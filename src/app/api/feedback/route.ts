import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger'; // Assuming you have a logger utility

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { feedback, type, timestamp, context } = body;

    if (!feedback || !type) {
      return NextResponse.json({ message: 'Feedback and type are required' }, { status: 400 });
    }

    // Log the feedback (replace with actual storage/service call in the future)
    logger.info({
      message: 'Feedback Received',
      feedbackType: type,
      feedbackText: feedback,
      timestamp,
      context,
    }, 'User Feedback');

    // console.log('Feedback Received:', { type, feedback, timestamp, context });

    return NextResponse.json({ message: 'Feedback received successfully' }, { status: 200 });
  } catch (error) {
    let errorMessage = 'Failed to process feedback';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    logger.error({
        message: 'Error processing feedback submission',
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
    }, 'Feedback API Error');
    // console.error('Error processing feedback:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}
