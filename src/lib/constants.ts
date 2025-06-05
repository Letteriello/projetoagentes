// This file contains shared constants used throughout the application.
export const MOBILE_BREAKPOINT = 768;
export const SIDEBAR_COOKIE_NAME = "sidebar_state";
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
export const SIDEBAR_WIDTH = "16rem"; // w-64
export const SIDEBAR_WIDTH_MOBILE = "18rem"; // Tailwind w-72
export const SIDEBAR_WIDTH_ICON = "3.5rem"; // w-14 (56px)

// Tool IDs
export const TOOL_ID_WEB_SEARCH = "webSearch";
export const TOOL_ID_CALCULATOR = "calculator";
export const TOOL_ID_KNOWLEDGE_BASE = "knowledgeBase";
export const TOOL_ID_CALENDAR_ACCESS = "calendarAccess";
export const TOOL_ID_CUSTOM_API_INTEGRATION = "customApiIntegration";
export const TOOL_ID_DATABASE_ACCESS = "databaseAccess";
export const TOOL_ID_CODE_EXECUTOR = "codeExecutor";
export const TOOL_ID_VIDEO_STREAM_MONITOR = "videoStreamMonitor";

// Genkit Tool Names
export const GENKIT_TOOL_NAME_WEB_SEARCH = "performWebSearch";
export const GENKIT_TOOL_NAME_CALCULATOR = "calculator"; // Assuming it's the same for Genkit
export const GENKIT_TOOL_NAME_KNOWLEDGE_BASE_RETRIEVE = "knowledgeBaseRetrieve";
export const GENKIT_TOOL_NAME_CALENDAR_GET_EVENTS = "calendarGetEvents";
export const GENKIT_TOOL_NAME_CUSTOM_API_CALL = "customApiCall"; // Example, might vary
export const GENKIT_TOOL_NAME_DATABASE_QUERY = "databaseQuery"; // Example, might vary
export const GENKIT_TOOL_NAME_CODE_EXECUTE = "codeExecute"; // Example, might vary
export const GENKIT_TOOL_NAME_VIDEO_STREAM_MONITOR = "videoStreamMonitorTool";

// Config Field IDs
export const CONFIG_FIELD_GOOGLE_API_KEY = "googleApiKey";
export const CONFIG_FIELD_GOOGLE_CSE_ID = "googleCseId";
export const CONFIG_FIELD_ALLOWED_DOMAINS = "allowedDomains";
export const CONFIG_FIELD_BLOCKED_DOMAINS = "blockedDomains";
export const CONFIG_FIELD_KNOWLEDGE_BASE_ID = "knowledgeBaseId";
export const CONFIG_FIELD_CALENDAR_API_ENDPOINT = "calendarApiEndpoint";
export const CONFIG_FIELD_OPENAPI_SPEC_URL = "openapiSpecUrl";
export const CONFIG_FIELD_OPENAPI_API_KEY = "openapiApiKey";
export const CONFIG_FIELD_ALLOWED_HTTP_METHODS = "allowedHttpMethods";
export const CONFIG_FIELD_DB_TYPE = "dbType";
export const CONFIG_FIELD_DB_HOST = "dbHost";
export const CONFIG_FIELD_DB_PORT = "dbPort";
export const CONFIG_FIELD_DB_NAME = "dbName";
export const CONFIG_FIELD_DB_USER = "dbUser";
export const CONFIG_FIELD_DB_PASSWORD = "dbPassword";
export const CONFIG_FIELD_DB_DESCRIPTION = "dbDescription";
export const CONFIG_FIELD_ALLOWED_SQL_OPERATIONS = "allowedSqlOperations";
export const CONFIG_FIELD_SANDBOX_ENDPOINT = "sandboxEndpoint";
export const CONFIG_FIELD_AUTHENTICATION_TYPE = "authenticationType";
export const CONFIG_FIELD_API_KEY = "apiKey"; // Generic API key
export const CONFIG_FIELD_OAUTH_CLIENT_ID = "oauthClientId";
export const CONFIG_FIELD_OAUTH_CLIENT_SECRET = "oauthClientSecret";
export const CONFIG_FIELD_OAUTH_TOKEN_URL = "oauthTokenUrl";
export const CONFIG_FIELD_DATABASE_TYPE = "databaseType"; // Duplicate of dbType? Assuming specific use elsewhere.
export const CONFIG_FIELD_CONNECTION_STRING = "connectionString";
export const CONFIG_FIELD_QUERY = "query";
export const CONFIG_FIELD_CODE_LANGUAGE = "codeLanguage";
export const CONFIG_FIELD_CODE_TO_EXECUTE = "codeToExecute";
export const CONFIG_FIELD_MAX_OUTPUT_CHARACTERS = "maxOutputCharacters";

// MCP Server Manager Constants
export const MCP_SERVER_STATUS_CONNECTED = "connected";
export const MCP_SERVER_STATUS_CONNECTING = "connecting";
export const MCP_SERVER_STATUS_ERROR = "error";
export const MCP_SERVER_STATUS_NOT_CONFIGURED = "not_configured";

export const TOAST_TITLE_MCP_SERVER_ADDED = "MCP Server Added";
export const TOAST_DESCRIPTION_MCP_SERVER_ADDED = "Server '{serverName}' was successfully added.";
export const TOAST_TITLE_ERROR_ADDING_SERVER = "Error Adding Server";
export const TOAST_DESCRIPTION_ERROR_ADDING_SERVER = "Failed to add the MCP server. Please try again.";
export const TOAST_TITLE_MCP_SERVER_REMOVED = "MCP Server Removed";
export const TOAST_DESCRIPTION_MCP_SERVER_REMOVED = "Server '{serverName}' was successfully removed.";
export const TOAST_TITLE_ERROR_REMOVING_SERVER = "Error Removing Server";
export const TOAST_DESCRIPTION_ERROR_REMOVING_SERVER = "Failed to remove the MCP server. Please try again.";
export const TOAST_TITLE_MCP_SERVER_UPDATED = "MCP Server Updated";
export const TOAST_DESCRIPTION_MCP_SERVER_UPDATED = "Server '{serverName}' was successfully updated.";
export const TOAST_TITLE_ERROR_UPDATING_SERVER = "Error Updating Server";
export const TOAST_DESCRIPTION_ERROR_UPDATING_SERVER = "Failed to update the MCP server. Please try again.";
export const TOAST_TITLE_ERROR_FETCHING_STATUS = "Error Fetching Status";
export const TOAST_DESCRIPTION_ERROR_FETCHING_STATUS = "Failed to fetch status for server '{serverName}'.";
export const TOAST_TITLE_ERROR_FETCHING_TOOLS = "Error Fetching Tools";
export const TOAST_DESCRIPTION_ERROR_FETCHING_TOOLS = "Failed to fetch tools for server '{serverName}'.";


// Icon Names (Optional, can be added if widely used)
// export const ICON_NAME_SEARCH = "search";
// export const ICON_NAME_CALCULATOR = "calculator";
// export const ICON_NAME_KNOWLEDGE = "book";
// export const ICON_NAME_CALENDAR = "calendar";
// export const ICON_NAME_API = "plug";
// export const ICON_NAME_DATABASE = "database";
// export const ICON_NAME_CODE = "code";
