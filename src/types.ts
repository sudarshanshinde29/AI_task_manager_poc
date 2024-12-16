import { Context } from "hono";

// Context type for API endpoints, including environment bindings
export interface ApiContext {
  Bindings: CloudflareBindings; // Environment bindings specific to Cloudflare Workers
  Variables: {
    username: string;
  };
}

export type HonoCtx = Context<ApiContext>;

 
// Tracks the current state of an  session.
// This will help you to manage the session flow and show appropriate UI/actions
// at each stage of the process.
export enum InteractionStatus {
    Created = "created", // Session is created but not started
    Pending = "pending", // Waiting for agent/system
    InProgress = "in_progress", // Active  session
    Completed = "completed", // session finished successfully
    Cancelled = "cancelled", // session terminated early
  } 

  // Defines who sent a message in the interaction chat
export type MessageRole = "user" | "assistant" | "system";

// Structure of individual messages exchanged during the session
export interface Message {
  messageId: string; // Unique identifier for the message
  interactionId: string; // Links message to specific interaction
  role: MessageRole; // Who sent the message
  content: string; // The actual message content
  timestamp: number; // When the message was sent
}

// Main data structure that holds all information about an interaction session.
// This includes metadata, messages exchanged, and the current status.
export interface InteractionData {
  interactionId: string;
  messages: Message[];
  status: InteractionStatus;
  createdAt: number;
  updatedAt: number;
}

export interface EventDetails {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: { email: string }[];
  location?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: { method: string; minutes: number }[];
  };
  recurrence?: string[];
  colorId?: string;
  visibility?: string;
}

export interface UpdatedDetails {
  summary?: string;
  description?: string;
  start?: { dateTime: string; timeZone: string };
  end?: { dateTime: string; timeZone: string };
  attendees?: { email: string }[];
  location?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: { method: string; minutes: number }[];
  };
  recurrence?: string[];
  colorId?: string;
  visibility?: string;
}

export interface ScheduleQuery {
  calendarId: string;
  timeMin: string; // ISO 8601
  timeMax: string; // ISO 8601
}

export interface EventUpdateParams {
  calendarId: string;
  eventId: string;
  updatedDetails: UpdatedDetails;
}

// Structure of individual messages exchanged in the system
export interface Message {
  messageId: string; // Unique identifier for the message
  eventId?: string; // Optional: Links the message to a specific event/task
  role: MessageRole; // Who sent the message
  content: string; // The actual message content
  timestamp: number; // When the message was sent
}

