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
  DateRangeFilter,
  writeLogEntry // MODIFIED: Ensure writeLogEntry is imported
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

    // Validate date filters
    if (!isValidDate(dateFilters.startTime)) {
      return NextResponse.json(
        { success: false, error: 'Invalid startTime format. Please use ISO 8601 format.', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    if (!isValidDate(dateFilters.endTime)) {
      return NextResponse.json(
        { success: false, error: 'Invalid endTime format. Please use ISO 8601 format.', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    let data;
    switch (type) {
      case 'agentUsage':
        data = await getAgentUsageFrequency(dateFilters);
        break;
      case 'flowUsage':
        data = await getFlowUsageFrequency(dateFilters);
        break;
      case 'toolUsage':
        data = await getToolUsageFrequency(dateFilters);
        break;
      case 'errorRates':
        const groupByErrorRates = searchParams.get('groupBy') as GetErrorRatesFilters['groupBy'];
        if (groupByErrorRates && !['agentId', 'flowName'].includes(groupByErrorRates)) {
          return NextResponse.json(
            { success: false, error: "Invalid groupBy value. Must be 'agentId' or 'flowName'.", code: 'VALIDATION_ERROR' },
            { status: 400 }
          );
        }
        const errorRatesFilters: GetErrorRatesFilters = { ...dateFilters, groupBy: groupByErrorRates };
        data = await getErrorRates(errorRatesFilters);
        break;
      case 'averageResponseTimes':
        const groupByAvgResp = searchParams.get('groupBy') as GetAverageResponseTimesFilters['groupBy'];
        if (groupByAvgResp && !['agentId', 'flowName'].includes(groupByAvgResp)) {
          return NextResponse.json(
            { success: false, error: "Invalid groupBy value. Must be 'agentId' or 'flowName'.", code: 'VALIDATION_ERROR' },
            { status: 400 }
          );
        }
        const avgRespFilters: GetAverageResponseTimesFilters = { ...dateFilters, groupBy: groupByAvgResp };
        data = await getAverageResponseTimes(avgRespFilters);
        break;
      case 'traceDetails':
        const traceId = searchParams.get('traceId');
        if (!traceId) {
          return NextResponse.json(
            { success: false, error: 'traceId query parameter is required for traceDetails type.', code: 'VALIDATION_ERROR' },
            { status: 400 }
          );
        }
        const traceDetailFilters: RawLogFilters = { traceId: traceId };
        const traceLogs = await getRawLogs(traceDetailFilters);
        // Sort by timestamp ascending for trace details display
        traceLogs.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
        data = traceLogs;
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type query parameter. Valid types are: agentUsage, flowUsage, toolUsage, errorRates, averageResponseTimes, traceDetails.', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
    }
    // For successful GET, directly return the data. Standardizing to { success: true, data: ... } is also an option.
    return NextResponse.json(data, { status: 200 });

  } catch (error: unknown) { // Catch unknown for better type safety
    // MODIFIED: Use writeLogEntry for internal logging
    const errorDetailsForLogging = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { message: String(error) };
    await writeLogEntry({
      type: 'API_ERROR',
      severity: 'ERROR',
      flowName: 'agent-monitor/stats', // Identifies the API route
      message: `Error fetching stats for type "${type}" via API.`,
      details: {
        requestedType: type,
        errorMessage: errorDetailsForLogging.message,
        errorStack: errorDetailsForLogging.stack,
        errorName: errorDetailsForLogging.name,
        // originalError: error, // Could be verbose
      }
    });

    let errorMessage = 'An unexpected error occurred while fetching statistics.';
    // Client-facing error details should be generic or carefully chosen
    let clientErrorDetails;
    if (error instanceof Error) {
      // if (error.name === 'SpecificClientSafeError') clientErrorDetails = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: 'INTERNAL_SERVER_ERROR',
        details: clientErrorDetails // Only send if specifically intended for client
      },
      { status: 500 }
    );
  }
}
