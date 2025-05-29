import { basicChatFlow, BasicChatInput } from '@/ai/flows/chat-flow';
import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

// Initialize rate limiter
const ratelimit = new Ratelimit({
  redis: kv,
  // Allow 5 requests from the same IP address within a 10-second window
  limiter: Ratelimit.slidingWindow(5, '10 s'),
});

export async function POST(req: NextRequest) {
  const ip = req.ip ?? '127.0.0.1';
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Too many requests. Please try again later.', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    });
  }

  try {
    const chatInput = (await req.json()) as BasicChatInput;

    // Validate essential inputs (optional: add more comprehensive validation)
    if (!chatInput.userMessage && !chatInput.fileDataUri) {
      return NextResponse.json({ error: 'User message or file is required.' }, { status: 400 });
    }

    const stream = await basicChatFlow(chatInput);

    // Return the stream directly
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8', // Or 'application/octet-stream' if preferred
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error: any) {
    console.error('[API Chat Stream] Error:', error);
    // Ensure a Response object is returned for errors as well
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred.' }, 
      { status: 500 }
    );
  }
}
