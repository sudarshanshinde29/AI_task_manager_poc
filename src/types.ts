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

  // Defines who sent a message in the interview chat
export type MessageRole = "user" | "assistant" | "system";

// Structure of individual messages exchanged during the session
export interface Message {
  messageId: string; // Unique identifier for the message
  interactionId: string; // Links message to specific interview
  role: MessageRole; // Who sent the message
  content: string; // The actual message content
  timestamp: number; // When the message was sent
}

// Main data structure that holds all information about an interview session.
// This includes metadata, messages exchanged, and the current status.
export interface InteractionData {
  interactionId: string;
//   title: InterviewTitle;
//   skills: InterviewSkill[];
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
// Input format for creating a new interview session.
// Simplified interface that accepts basic parameters needed to start an interview.
// export interface InteractionInput {
//   title: string;
//   skills: string[];
// }


// List of event types that the system can manage
// export enum EventType {
//   Rehearsal = "Rehearsal",
//   Meeting = "Meeting",
//   Tour = "Tour",
//   Performance = "Performance",
//   Task = "Task",
// }

// Status of an event or task in the system
// export enum EventStatus {
//   Pending = "pending", // Event created but not confirmed
//   Scheduled = "scheduled", // Event scheduled successfully
//   Completed = "completed", // Event completed
//   Cancelled = "cancelled", // Event was cancelled
// }


// Structure of individual messages exchanged in the system
export interface Message {
  messageId: string; // Unique identifier for the message
  eventId?: string; // Optional: Links the message to a specific event/task
  role: MessageRole; // Who sent the message
  content: string; // The actual message content
  timestamp: number; // When the message was sent
}

// Main data structure that holds information about an event or task
// export interface EventData {
//   eventId: string; // Unique identifier for the event
//   type: EventType; // Type of event
//   title: string; // Title or name of the event
//   date: string; // Date of the event in ISO format
//   time: string; // Time of the event in 24-hour format
//   location?: string; // Optional location for the event
//   duration?: string; // Optional duration for the event
//   status: EventStatus; // Current status of the event
//   createdAt: number; // Event creation timestamp
//   updatedAt: number; // Last update timestamp
// }

// Input format for creating a new event or task
// export interface EventInput {
//   type: EventType; // Type of event
//   title: string; // Title or name of the event
//   date?: string; // Optional: date of the event
//   time?: string; // Optional: time of the event
//   location?: string; // Optional: location for the event
//   duration?: string; // Optional: duration for the event
// }
