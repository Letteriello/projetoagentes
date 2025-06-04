import React from 'react';
import { Loader2 } from 'lucide-react'; // Import Loader2 icon

interface ChatEventDisplayProps {
  eventTitle: string;
  eventDetails?: string;
  eventType: string;
  isVerboseMode?: boolean; // Added isVerboseMode prop
  // We might receive the whole event object if needed for full raw display
  rawEventData?: Omit<ChatEventDisplayProps, 'isVerboseMode' | 'rawEventData'>;
}

const ChatEventDisplay: React.FC<ChatEventDisplayProps> = (props) => {
  const { eventTitle, eventDetails, eventType, isVerboseMode, rawEventData } = props;

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
      default:
        return { borderColor: '#9ca3af', backgroundColor: '#f3f4f6' }; // gray-400, gray-100
    }
  };

  const specificStyles = getEventSpecificStyles();

  let displayDetails = eventDetails;
  if (isVerboseMode && eventDetails) {
    try {
      const parsed = JSON.parse(eventDetails);
      displayDetails = JSON.stringify(parsed, null, 2);
    } catch (e) {
      // Not a JSON string, display as is
    }
  }

  // Prepare raw event data for verbose display, excluding isVerboseMode itself
  const eventDataForVerboseDisplay = { eventTitle, eventDetails, eventType, ...(rawEventData || {}) };


  return (
    <div style={{ ...eventStyles, ...specificStyles }} className="chat-event">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
        {eventType === 'TOOL_CALL_PENDING' && (
          <Loader2 className="animate-spin h-4 w-4 mr-2 text-blue-500" />
        )}
        <strong style={{ color: '#1f2937' /* gray-800 */ }}>
          {eventType === 'TOOL_CALL_PENDING' ? eventTitle : `${eventType}: ${eventTitle}`}
        </strong>
      </div>
      {displayDetails && (
        <pre style={{
          margin: '0',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          maxHeight: isVerboseMode ? 'none' : '60px', // Limit height if not verbose
          overflowY: isVerboseMode ? 'visible' : 'hidden', // Allow scroll if verbose and content overflows
          textOverflow: isVerboseMode ? 'clip' : 'ellipsis',
          backgroundColor: 'rgba(0,0,0,0.02)', // Slight background for details block
          padding: isVerboseMode ? '4px 6px' : '2px 4px',
          borderRadius: '0.25rem',
          fontSize: '0.8rem',
         }}>
          {displayDetails}
        </pre>
      )}
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

export default ChatEventDisplay;
