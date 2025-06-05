import { NextResponse } from 'next/server';

// Standard health check endpoint.
export async function GET() {
  try {
    // The primary purpose is to check if the server/runtime is responsive.
    // More advanced health checks could involve checking database connections,
    // external service availability, etc., but this is a basic liveness probe.

    // Standardized success response
    return NextResponse.json(
      {
        success: true,
        data: {
          status: 'ok',
          timestamp: new Date().toISOString()
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    // Log any unexpected error during the health check.
    // This should ideally never happen for a simple health check like this,
    // but it's good practice to have a catch-all.
    // Consider using a structured logger (e.g., Winston) if available project-wide.
    console.error('[API healthz GET] Unexpected error during health check:', error);

    // Standardized error response
    return NextResponse.json(
      {
        success: false,
        error: "Health check endpoint failed unexpectedly.",
        code: "HEALTH_CHECK_ERROR",
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}
