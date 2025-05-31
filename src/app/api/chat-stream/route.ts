<<<<<<< Updated upstream
import { basicChatFlow, BasicChatInput } from "@/ai/flows/chat-flow";
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

// Initialize rate limiter
const ratelimit = new Ratelimit({
  redis: kv,
  // Allow 5 requests from the same IP address within a 10-second window
  limiter: Ratelimit.slidingWindow(5, "10 s"),
});

export async function POST(req: NextRequest) {
  const ip = req.ip ?? "127.0.0.1";
=======
import { basicChatFlow } from '@/ai/flows/chat-flow';
import { ChatInput } from '@/types/chat-types';
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter instead of using @upstash/ratelimit and @vercel/kv
// This avoids TypeScript errors when these packages aren't installed
class SimpleRateLimiter {
  private requests: Record<string, { count: number; resetTime: number }> = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async limit(key: string) {
    const now = Date.now();
    
    if (!this.requests[key] || now > this.requests[key].resetTime) {
      this.requests[key] = {
        count: 1,
        resetTime: now + this.windowMs
      };
      return { 
        success: true, 
        limit: this.maxRequests, 
        remaining: this.maxRequests - 1,
        reset: this.requests[key].resetTime
      };
    }

    if (this.requests[key].count >= this.maxRequests) {
      return { 
        success: false, 
        limit: this.maxRequests, 
        remaining: 0,
        reset: this.requests[key].resetTime
      };
    }

    this.requests[key].count += 1;
    return { 
      success: true, 
      limit: this.maxRequests, 
      remaining: this.maxRequests - this.requests[key].count,
      reset: this.requests[key].resetTime
    };
  }
}

// Initialize simple rate limiter - 5 requests per 10 seconds
const ratelimit = new SimpleRateLimiter(10000, 5);

export async function POST(req: NextRequest) {
  // Extract IP from headers (X-Forwarded-For) or use a default
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';
>>>>>>> Stashed changes
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return new Response("Too many requests. Please try again later.", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
      },
    });
  }

  try {
    const chatInput = (await req.json()) as ChatInput;

    // Validate essential inputs (optional: add more comprehensive validation)
    if (!chatInput.userMessage && !chatInput.fileDataUri) {
      return NextResponse.json(
        { error: "User message or file is required." },
        { status: 400 },
      );
    }

<<<<<<< Updated upstream
    const stream = await basicChatFlow(chatInput);

    // Return the stream directly
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8", // Or 'application/octet-stream' if preferred
        "Transfer-Encoding": "chunked",
      },
    });
=======
    const result = await basicChatFlow(chatInput);
    
    // Check if we have a stream to return
    if (result.stream) {
      // Convert the Node.js ReadableStream to a string to avoid type compatibility issues
      // For a production app, you'd want to properly pipe the stream instead
      let completeText = '';
      try {
        const reader = result.stream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // Assuming value is a chunk of text
          completeText += typeof value === 'string' ? value : new TextDecoder().decode(value);
        }
        // Return the complete text
        return new Response(completeText, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });
      } catch (e) {
        console.error('Error reading stream:', e);
        return NextResponse.json({ error: 'Error processing stream' }, { status: 500 });
      }
    } else if (result.error) {
      // Return the error
      return NextResponse.json({ error: result.error }, { status: 500 });
    } else if (result.outputMessage) {
      // Return the output message as a plain text response
      return new Response(result.outputMessage, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    } else {
      // Fallback for unexpected cases
      return NextResponse.json({ error: 'No response content available' }, { status: 500 });
    }

>>>>>>> Stashed changes
  } catch (error: any) {
    console.error("[API Chat Stream] Error:", error);
    // Ensure a Response object is returned for errors as well
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
