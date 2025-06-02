import { NextResponse } from 'next/server';
import {
  getAgentUsageFrequency,
  getFlowUsageFrequency,
  getToolUsageFrequency,
  getErrorRates,
  GetErrorRatesFilters,
  getAverageResponseTimes,
  GetAverageResponseTimesFilters,
  getRawLogs, // For traceDetails
  RawLogFilters,
  DateRangeFilter
} from '@/lib/logService'; // Assuming @ points to src

// Helper function to parse date range filters
function parseDateRangeFilters(searchParams: URLSearchParams): DateRangeFilter {
  const filters: DateRangeFilter = {};
  const startTime = searchParams.get('startTime');
  if (startTime) filters.startTime = new Date(startTime);

  const endTime = searchParams.get('endTime');
  if (endTime) filters.endTime = new Date(endTime);

  return filters;
}

// Helper function to validate date objects
function isValidDate(date?: Date): boolean {
  return date ? !isNaN(date.getTime()) : true;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    const dateFilters = parseDateRangeFilters(searchParams);

    if (!isValidDate(dateFilters.startTime)) {
      return NextResponse.json({ error: 'Invalid startTime format. Please use ISO 8601 format.' }, { status: 400 });
    }
    if (!isValidDate(dateFilters.endTime)) {
      return NextResponse.json({ error: 'Invalid endTime format. Please use ISO 8601 format.' }, { status: 400 });
    }

    switch (type) {
      case 'agentUsage':
        const agentUsage = await getAgentUsageFrequency(dateFilters);
        return NextResponse.json(agentUsage);

      case 'flowUsage':
        const flowUsage = await getFlowUsageFrequency(dateFilters);
        return NextResponse.json(flowUsage);

      case 'toolUsage':
        const toolUsage = await getToolUsageFrequency(dateFilters);
        return NextResponse.json(toolUsage);

      case 'errorRates':
        const groupByErrorRates = searchParams.get('groupBy') as GetErrorRatesFilters['groupBy'];
        if (groupByErrorRates && !['agentId', 'flowName'].includes(groupByErrorRates)) {
          return NextResponse.json({ error: "Invalid groupBy value. Must be 'agentId' or 'flowName'." }, { status: 400 });
        }
        const errorRatesFilters: GetErrorRatesFilters = { ...dateFilters, groupBy: groupByErrorRates };
        const errorRates = await getErrorRates(errorRatesFilters);
        return NextResponse.json(errorRates);

      case 'averageResponseTimes':
        const groupByAvgResp = searchParams.get('groupBy') as GetAverageResponseTimesFilters['groupBy'];
        if (groupByAvgResp && !['agentId', 'flowName'].includes(groupByAvgResp)) {
          return NextResponse.json({ error: "Invalid groupBy value. Must be 'agentId' or 'flowName'." }, { status: 400 });
        }
        const avgRespFilters: GetAverageResponseTimesFilters = { ...dateFilters, groupBy: groupByAvgResp };
        const avgRespTimes = await getAverageResponseTimes(avgRespFilters);
        return NextResponse.json(avgRespTimes);
      
      case 'traceDetails':
        const traceId = searchParams.get('traceId');
        if (!traceId) {
          return NextResponse.json({ error: 'traceId query parameter is required for traceDetails' }, { status: 400 });
        }
        // getRawLogs expects RawLogFilters. We are only filtering by traceId here.
        // It also orders by timestamp desc by default, which is good.
        const traceDetailFilters: RawLogFilters = { traceId: traceId };
        const traceLogs = await getRawLogs(traceDetailFilters);
        // Sort by timestamp ascending for trace details display
        traceLogs.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
        return NextResponse.json(traceLogs);

      default:
        return NextResponse.json({ error: 'Invalid type query parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error(`Error fetching stats for type "${type}":`, error);
    let errorMessage = 'Failed to fetch stats';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
