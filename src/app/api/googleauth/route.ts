import { NextResponse } from "next/server";

// Importações condicionais somente no servidor
let googleAuth;
let gcpMetadata;

// Verificação de ambiente servidor
if (typeof window === "undefined") {
  try {
    googleAuth = require("google-auth-library");
    gcpMetadata = require("gcp-metadata");
  } catch (error) {
    console.error("Erro ao carregar bibliotecas do Google Auth:", error);
  }
}

/**
 * API para verificar autenticação no GCP
 */
export async function GET() {
  try {
    if (!gcpMetadata) {
      // This indicates a server-side configuration issue where libraries didn't load.
      console.error("[API googleauth GET] GCP Metadata library not available.");
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error: GCP Metadata library not available.",
          code: "SERVER_LIB_UNAVAILABLE"
        },
        { status: 500 }
      );
    }

    const isOnGcp = await gcpMetadata.isAvailable();

    // Standardized success response
    return NextResponse.json({
      success: true,
      data: {
        isOnGcp,
        environment: process.env.NODE_ENV
      }
    }, { status: 200 });

  } catch (error: any) {
    // Log the error (consider using a structured logger if available project-wide)
    console.error("[API googleauth GET] Error checking GCP availability:", error);
    // Standardized error response
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check GCP availability.",
        code: "GCP_METADATA_ERROR",
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * API para inicializar um cliente de autenticação (simulated)
 */
export async function POST(request: Request) {
  try {
    if (!googleAuth) {
      // This indicates a server-side configuration issue.
      console.error("[API googleauth POST] Google Auth library not available.");
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error: Google Auth library not available.",
          code: "SERVER_LIB_UNAVAILABLE"
        },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (e: any) {
      console.error('[API googleauth POST] Invalid JSON payload:', e.message);
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload.", code: "BAD_REQUEST", details: e.message },
        { status: 400 }
      );
    }

    const { GoogleAuth } = googleAuth;

    // Initialize GoogleAuth (actual auth client is not returned for security)
    // This endpoint primarily confirms if the library can be initialized.
    const auth = new GoogleAuth({
        scopes: body.scopes // Scopes from request body, if any
    });
    // To actually use 'auth' for getting a token or client, further calls would be needed.
    // For example: const client = await auth.getClient();
    // Or: const token = await auth.getAccessToken();

    // Standardized success response
    return NextResponse.json({
      success: true,
      data: {
        initialized: true, // Confirms GoogleAuth class could be instantiated
        requestedScopes: body.scopes || [], // Reflect requested scopes
        projectId: process.env.GOOGLE_CLOUD_PROJECT || "unknown" // Provide project ID if available
      }
    }, { status: 200 });

  } catch (error: any) {
    // Log the error (consider using a structured logger)
    console.error("[API googleauth POST] Error during Google Auth initialization check:", error);
    // Standardized error response
    return NextResponse.json(
      {
        success: false,
        error: "Failed during Google Auth initialization check.",
        code: "GOOGLE_AUTH_INIT_ERROR",
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}
