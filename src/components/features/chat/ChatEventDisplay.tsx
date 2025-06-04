import React from 'react';
import { Loader2, Wand2 } from 'lucide-react'; // Import Loader2 and Wand2 icons

interface ChatEventDisplayProps {
  eventTitle: string;
  eventDetails?: string;
  eventType: string;
  isVerboseMode?: boolean; // Added isVerboseMode prop
  // We might receive the whole event object if needed for full raw display
  // Let's make rawEventData more specific to the event structure from chat-flow
  rawEventData?: Partial<{
    id: string;
    timestamp: Date;
    eventType: string; // Keep this general for the raw display
    eventTitle: string;
    eventDetails?: string;
    toolName?: string;
    callbackType?: 'beforeModel' | 'afterModel' | 'beforeTool' | 'afterTool';
    callbackAction?: string;
    originalData?: string;
    modifiedData?: string;
  }>;
}

const ChatEventDisplay: React.FC<ChatEventDisplayProps> = (props) => {
  const { eventTitle, eventDetails, eventType, isVerboseMode, rawEventData } = props;
  // Destructure callback-specific fields from rawEventData for easier use if needed
  const { callbackType, callbackAction, originalData, modifiedData } = rawEventData || {};

  const eventStyles: React.CSSProperties = {
    padding: '8px 12px', // Adjusted padding
    fontSize: '0.875rem', // text-sm
    margin: '8px 0', // Adjusted margin
    borderRadius: '0.375rem', // rounded-md
    backgroundColor: '#f9fafb', // bg-gray-50
    borderLeft: '4px solid', // border-l-4
    fontFamily: 'sans-serif',
  };

  const getEventSpecificStyles = (): React.CSSProperties => {
    switch (eventType) {
      case 'TOOL_CALL_PENDING':
        return { borderColor: '#60a5fa', backgroundColor: '#eff6ff' }; // blue-400, blue-50
      case 'TOOL_CALL':
        // Tailwind green-500, green-50
        return { borderColor: '#22c55e', backgroundColor: '#f0fdf4' };
      case 'TOOL_ERROR':
        return { borderColor: '#ef4444', backgroundColor: '#fef2f2' }; // red-500, red-50
      case 'AGENT_CONTROL':
        return { borderColor: '#a855f7', backgroundColor: '#faf5ff' }; // purple-500, purple-50
      case 'CALLBACK_SIMULATION':
        return { borderColor: '#f97316', backgroundColor: '#fff7ed' }; // orange-500, orange-50
      default:
        return { borderColor: '#9ca3af', backgroundColor: '#f3f4f6' }; // gray-400, gray-100
    }
  };

  const specificStyles = getEventSpecificStyles();

  // For CALLBACK_SIMULATION, eventDetails might already be well-formatted.
  // If originalData and modifiedData are present, we can build a more structured display.
  let structuredCallbackDetails: React.ReactNode = null;
  if (eventType === 'CALLBACK_SIMULATION' && (originalData || modifiedData)) {
    structuredCallbackDetails = (
      <>
        {eventDetails && <p style={{ margin: '0 0 4px 0' }}>{eventDetails}</p>}
        {originalData && (
          <div style={{ marginTop: '4px' }}>
            <strong style={{ fontSize: '0.75rem', color: '#4b5563' }}>Original Data:</strong>
            <pre style={codeBlockStyle}>{originalData}</pre>
          </div>
        )}
        {modifiedData && (
          <div style={{ marginTop: '4px' }}>
            <strong style={{ fontSize: '0.75rem', color: '#4b5563' }}>Modified Data:</strong>
            <pre style={codeBlockStyle}>{modifiedData}</pre>
          </div>
        )}
      </>
    );
  }


  let displayContent = structuredCallbackDetails || eventDetails;
  if (isVerboseMode && !structuredCallbackDetails && eventDetails) { // If verbose and not already structured, try to parse/pretty-print
    try {
      const parsed = JSON.parse(eventDetails);
      displayContent = JSON.stringify(parsed, null, 2);
    } catch (e) {
      // Not a JSON string, display as is
      displayContent = eventDetails;
    }
  } else if (!structuredCallbackDetails && eventDetails) {
    displayContent = eventDetails;
  }


  // Prepare raw event data for verbose display
  const eventDataForVerboseDisplay = { ...rawEventData }; // rawEventData should be the full event from chat-flow


  return (
    <div style={{ ...eventStyles, ...specificStyles }} className="chat-event">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
        {eventType === 'TOOL_CALL_PENDING' && (
          <Loader2 className="animate-spin h-4 w-4 mr-2 text-blue-500" />
        )}
        {eventType === 'CALLBACK_SIMULATION' && (
          <Wand2 className="h-4 w-4 mr-2 text-orange-500" />
        )}
        <strong style={{ color: '#1f2937' /* gray-800 */ }}>
          {/* For CALLBACK_SIMULATION, eventTitle from flow is already descriptive */}
          {eventType === 'TOOL_CALL_PENDING' || eventType === 'CALLBACK_SIMULATION'
            ? eventTitle
            : `${eventType}: ${eventTitle}`}
        </strong>
      </div>
      {displayContent && (typeof displayContent === 'string' ? (
        <pre style={detailsPreStyle(isVerboseMode)}>
          {displayContent}
        </pre>
      ) : (
        displayContent // This will be the JSX for structuredCallbackDetails
      ))}
      {isVerboseMode && (
        <details className="mt-2 text-xs" open>
          <summary className="cursor-pointer italic text-gray-500">Raw Event Data</summary>
          <pre className="bg-muted p-2 mt-1 rounded-md overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(eventDataForVerboseDisplay, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

// Helper for styling the details <pre> tag
const detailsPreStyle = (isVerbose: boolean): React.CSSProperties => ({
  margin: '0',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  maxHeight: isVerbose ? 'none' : '60px',
  overflowY: isVerbose ? 'visible' : 'hidden',
  textOverflow: isVerbose ? 'clip' : 'ellipsis',
  backgroundColor: 'rgba(0,0,0,0.02)',
  padding: isVerbose ? '4px 6px' : '2px 4px',
  borderRadius: '0.25rem',
  fontSize: '0.8rem',
});

// Style for code blocks within structured callback details
const codeBlockStyle: React.CSSProperties = {
  margin: '2px 0 0 0',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  backgroundColor: 'rgba(0,0,0,0.03)',
  padding: '2px 4px',
  borderRadius: '0.25rem',
  fontSize: '0.75rem',
};
};

export default ChatEventDisplay;
