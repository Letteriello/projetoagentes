// src/utils/icon-utils.ts
import {
  LucideIcon, // Type for Lucide icons
  HelpCircle,
  Search,
  Calculator,
  FileText,
  CalendarDays,
  Network,
  Database,
  Code2,
  Terminal,
  Cpu,
  Brain,
  Globe,
  Clock,
  Video,
  Smile,
  ThumbsUp,
  TestTubeDiagonal,
  Mic,
  Volume2,
  Film,
  Cloud,
  FunctionSquare,
  Users, // Added based on mcp-tool-examples needing it for CRM Integrator
  MessageSquare // Added based on old available-tools.ts chat-tool
} from "lucide-react";

// Function to get Lucide icon component by string name
// Originally from src/data/agent-builder/available-tools.ts
export function getIconComponent(name?: string): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    search: Search,
    calculator: Calculator,
    filetext: FileText,
    calendardays: CalendarDays,
    network: Network,
    database: Database,
    code2: Code2,
    terminal: Terminal,
    cpu: Cpu,
    brain: Brain,
    globe: Globe,
    video: Video,
    smile: Smile,
    thumbsup: ThumbsUp,
    testtubediagonal: TestTubeDiagonal,
    mic: Mic,
    volume2: Volume2,
    film: Film,
    cloud: Cloud,
    functionsquare: FunctionSquare,
    users: Users, // Added mapping
    messagesquare: MessageSquare, // Added mapping
    helpcircle: HelpCircle, // Explicitly map helpcircle
    // Add other necessary icons here as string keys
  };
  if (!name) return HelpCircle;
  const normalizedName = name.toLowerCase().replace(/\s+/g, ''); // Normalize name
  return iconMap[normalizedName] || HelpCircle; // Default to HelpCircle if no match
}
