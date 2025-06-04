// src/app/api/evaluate/route.ts
import { NextResponse } from 'next/server';
import type { EvaluationReport, EvaluationMetric } from '@/types/evaluation-report';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agentConfig, conversations } = body;

    // Simulate evaluation logic
    const metrics: EvaluationMetric[] = [
      {
        name: 'response_match_score',
        value: Math.random() * 0.3 + 0.7, // Simulate a score between 0.7 and 1.0
        threshold: 0.7,
        status: 'pass',
        details: 'Simulated score for how well agent responses match expected ones.'
      },
      {
        name: 'tool_trajectory_avg_score',
        value: Math.random() * 0.2 + 0.8, // Simulate a score between 0.8 and 1.0
        threshold: 0.8,
        status: 'pass',
        details: 'Simulated average score for the correctness of tool usage sequences.'
      },
      {
        name: 'guardrail_compliance_toxic_content',
        value: (agentConfig?.evaluationGuardrails?.checkForToxicity ? Math.random() > 0.1 : true), // More likely to pass if not checked
        status: (agentConfig?.evaluationGuardrails?.checkForToxicity ? (Math.random() > 0.1 ? 'pass' : 'fail') : 'pass'),
        details: 'Simulated check for toxic content. Passes if checkForToxicity is false or by random chance.'
      },
      {
        name: 'guardrail_max_response_length',
        value: conversations && conversations.length > 0 ? Math.max(...conversations.map((c:any) => c.agentOutput?.length || 0)) : 50,
        threshold: agentConfig?.evaluationGuardrails?.maxResponseLength || 200,
        status: (conversations && conversations.length > 0 ? Math.max(...conversations.map((c:any) => c.agentOutput?.length || 0)) : 50) <= (agentConfig?.evaluationGuardrails?.maxResponseLength || 200) ? 'pass' : 'fail',
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


    const report: EvaluationReport = {
      reportId: `eval-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      agentId: agentConfig?.id || 'unknown-agent',
      timestamp: new Date().toISOString(),
      metrics: metrics,
      summary: 'This is a mock evaluation report. All scores are simulated.',
      agentConfigSnapshot: agentConfig, // Include received agentConfig
      conversationSamples: conversations?.slice(0, 2) // Include a couple of samples
    };

    return NextResponse.json(report, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/evaluate:', error);
    return NextResponse.json({ error: 'Failed to process evaluation request', details: error.message }, { status: 500 });
  }
}
