// src/app/api/evaluate/route.ts
import { NextResponse } from 'next/server';
import type { EvaluationReport, EvaluationMetric } from '@/types/evaluation-report';

// src/app/api/evaluate/route.ts
import { NextResponse } from 'next/server';
import type { EvaluationReport, EvaluationMetric } from '@/types/evaluation-report'; // Assuming types are defined

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e: any) {
      // Log JSON parsing error
      console.error('[API evaluate POST] Invalid JSON payload:', e.message);
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload.", code: "BAD_REQUEST", details: e.message },
        { status: 400 }
      );
    }

    const { agentConfig, conversations } = body;

    // Basic input validation
    if (!agentConfig || typeof agentConfig !== 'object') {
      console.error('[API evaluate POST] Validation Error: agentConfig is required and must be an object.');
      return NextResponse.json(
        { success: false, error: "agentConfig is required and must be an object.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    if (!conversations || !Array.isArray(conversations)) {
      console.error('[API evaluate POST] Validation Error: conversations are required and must be an array.');
      return NextResponse.json(
        { success: false, error: "conversations are required and must be an array.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // --- Simulated evaluation logic (remains the same) ---
    const metrics: EvaluationMetric[] = [
      {
        name: 'response_match_score',
        value: Math.random() * 0.3 + 0.7,
        threshold: 0.7,
        status: 'pass',
        details: 'Simulated score for how well agent responses match expected ones.'
      },
      {
        name: 'tool_trajectory_avg_score',
        value: Math.random() * 0.2 + 0.8,
        threshold: 0.8,
        status: 'pass',
        details: 'Simulated average score for the correctness of tool usage sequences.'
      },
      {
        name: 'guardrail_compliance_toxic_content',
        value: (agentConfig?.evaluationGuardrails?.checkForToxicity ? Math.random() > 0.1 : true),
        status: (agentConfig?.evaluationGuardrails?.checkForToxicity ? (Math.random() > 0.1 ? 'pass' : 'fail') : 'pass'),
        details: 'Simulated check for toxic content. Passes if checkForToxicity is false or by random chance.'
      },
      {
        name: 'guardrail_max_response_length',
        value: conversations && conversations.length > 0 ? Math.max(...conversations.map((c:any) => (c.agentOutput || "").length || 0)) : 50,
        threshold: agentConfig?.evaluationGuardrails?.maxResponseLength || 200,
        status: (conversations && conversations.length > 0 ? Math.max(...conversations.map((c:any) => (c.agentOutput || "").length || 0)) : 50) <= (agentConfig?.evaluationGuardrails?.maxResponseLength || 200) ? 'pass' : 'fail',
        details: 'Checks if any agent response exceeded the configured max length.'
      }
    ];

    if (agentConfig?.evaluationGuardrails?.prohibitedKeywords && agentConfig.evaluationGuardrails.prohibitedKeywords.length > 0) {
      let prohibitedFound = false;
      conversations?.forEach((conv: any) => {
        const agentResponse = conv.agentOutput || "";
        agentConfig.evaluationGuardrails.prohibitedKeywords.forEach((keyword: string) => {
          if (agentResponse.toLowerCase().includes(keyword.toLowerCase())) {
            prohibitedFound = true;
          }
        });
      });
      metrics.push({
        name: 'guardrail_prohibited_keywords',
        value: !prohibitedFound,
        status: !prohibitedFound ? 'pass' : 'fail',
        details: `Simulated check for prohibited keywords. Keywords: ${agentConfig.evaluationGuardrails.prohibitedKeywords.join(', ')}`
      });
    }
    // --- End of simulated evaluation logic ---

    const report: EvaluationReport = {
      reportId: `eval-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      agentId: agentConfig?.id || 'unknown-agent',
      timestamp: new Date().toISOString(),
      metrics: metrics,
      summary: 'This is a mock evaluation report. All scores are simulated.',
      agentConfigSnapshot: agentConfig,
      conversationSamples: conversations?.slice(0, 2)
    };

    // Standardized success response
    return NextResponse.json({ success: true, data: report }, { status: 200 });

  } catch (error: any) {
    // Log the error (consider using a structured logger like Winston if available project-wide)
    console.error('[API evaluate POST] Error processing evaluation request:', error);

    // Standardized error response
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process evaluation request.",
        code: "EVALUATION_ERROR", // Or INTERNAL_SERVER_ERROR if more appropriate
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}
