import { InteractionError, ErrorCodes, AgentError, IntentDeterminationError, ExecutionError, ValidationError } from "../error";
// Ensure this import is correct based on your project structure
import { InteractionData, Message, EventDetails, EventUpdateParams, ScheduleQuery, UpdatedDetails } from "../types";
import { runWithTools , tool} from "@cloudflare/ai-utils";
 // Ensure this import is correct based on your project structure
import { createEvent, updateEvent, deleteEvent, getEvents, getAvailableSlots } from './calendar-service'; // Adjust import path as needed
import { Ai, RoleScopedChatInput, AiTextGenerationOutput } from "@cloudflare/workers-types";
// import { config } from "googleapis/build/src/apis/config";
// import { stream } from "hono/streaming";
// import { exec } from "child_process";
 
// class ExecutorAgent {
//   constructor(private readonly env: CloudflareBindings) {}
  
//   async addEvent(calendarId: string, eventDetails: EventDetails): Promise<string> {
//     try {
//       calendarId = "shindesudarshan2902@gmail.com";
//       const createdEvent = await createEvent(this.env, calendarId, eventDetails);
//       return `Event created successfully. Event ID: ${createdEvent.id}`;
//     } catch (error: any) {
//       throw new ExecutionError(`Failed to add event: ${error.message}`);
//     }
//   }

//   async updateEvent(calendarId: string, eventId: string, updatedDetails: UpdatedDetails): Promise<string> {
//     try {
//       calendarId = "shindesudarshan2902@gmail.com";
//       const updatedEvent = await updateEvent(this.env, calendarId, eventId, updatedDetails);
//       return `Event updated successfully. Event ID: ${updatedEvent.id}`;
//     } catch (error: any) {
//       throw new ExecutionError(`Failed to update event: ${error.message}`);
//     }
//   }

//   async deleteEvent(calendarId: string, eventId: string): Promise<string> {
//     try {
//       calendarId = "shindesudarshan2902@gmail.com";
//       await deleteEvent(this.env, calendarId, eventId);
//       return `Event deleted successfully`;
//     } catch (error: any) {
//       throw new ExecutionError(`Failed to delete event: ${error.message}`);
//     }
//   }

//   async getSchedule(calendarId: string, timeMin: string, timeMax: string): Promise<string> {
//     try {
//       calendarId = "shindesudarshan2902@gmail.com";
//       const events = await getEvents(this.env, calendarId, timeMin, timeMax);
//       return JSON.stringify(events, null, 2);
//     } catch (error: any) {
//       throw new ExecutionError(`Failed to retrieve schedule: ${error.message}`);
//     }
//   }

//   async checkAvailableSlots(calendarId: string, timeMin: string, timeMax: string): Promise<string> {
//     try {
//       calendarId = "shindesudarshan2902@gmail.com";
//       const availableSlots = await getAvailableSlots(this.env, calendarId, timeMin, timeMax);
//       return JSON.stringify(availableSlots, null, 2);
//     } catch (error: any) {
//       throw new ExecutionError(`Failed to retrieve available slots: ${error.message}`);
//     }
//   }
// }


// const tools = (executorAgent: ExecutorAgent) => ;



class MainAgent {
  
  constructor(private readonly AI: Ai, private readonly env: CloudflareBindings) {
    console.log("Enters into MainAgent");
    // console.log("tools", tools);
    // const executor = new ExecutorAgent(this.env);
    // const executor = this.executorAgent;

  }

  async handleInteraction(interaction: InteractionData): Promise<string> {
    try {
      console.log("Enters into handleInteraction");
      const messages = this.prepareLLMMessages(interaction);
      // console.log("messages", messages);
    
      const result: AiTextGenerationOutput = await runWithTools(this.AI, "@cf/meta/llama-2-7b-chat-int8", {
        messages,
        tools : [
          {
            name: "addEvent",
            description: "Add an event to the calendar.",
            parameters: {
              type: "object",
              properties: {
                summary: { 
                  type: "string", 
                  description: "Title of the event" 
                },
                description: { 
                  type: "string", 
                  description: "Description of the event" 
                },
                startDateTime: { 
                  type: "string", 
                  description: "Event start date and time" 
                },
                startTimeZone: { 
                  type: "string", 
                  description: "Time zone of the event start time" 
                },
                endDateTime: { 
                  type: "string", 
                  description: "Event end date and time" 
                },
                endTimeZone: { 
                  type: "string", 
                  description: "Time zone of the event end time" 
                }
              },
              required: ["summary", "startDateTime", "endDateTime"]
            },
            async function ({ calendarId, eventDetails, env }: { calendarId: string; eventDetails: EventDetails; env: CloudflareBindings }): Promise<string> {
              try {
                calendarId = "shindesudarshan2902@gmail.com";
                console.log("entered addEvent"); 
                console.log("calendarId", calendarId);
                const response = await createEvent(env, calendarId, eventDetails);
                return JSON.stringify({ success: true, data: response });
              } catch (error: any) {
                return JSON.stringify({ success: false, error: error.message });
              }
            },
          },
          {
            name: "updateEvent",
            description: "Update an event in the calendar.",
            parameters: {
              type: "object",
              properties: {
                eventId: { 
                  type: "string", 
                  description: "The event ID to update" 
                },
                summary: { 
                  type: "string", 
                  description: "Title of the event" 
                },
                startDateTime: { 
                  type: "string", 
                  description: "Event start date and time" 
                },
                startTimeZone: { 
                  type: "string", 
                  description: "Time zone of the event start time" 
                },
                endDateTime: { 
                  type: "string", 
                  description: "Event end date and time" 
                },
                endTimeZone: { 
                  type: "string", 
                  description: "Time zone of the event end time" 
                }
              },
              required: ["eventId"]
            },
            function: async ({ calendarId, eventId, updatedDetails, env }: { calendarId: string; eventId: string; updatedDetails: UpdatedDetails; env: CloudflareBindings }): Promise<string> => {
              try {
                calendarId = "shindesudarshan2902@gmail.com";
                console.log("entered updateEvent");
                const response = await updateEvent(env, calendarId, eventId, updatedDetails);
                return JSON.stringify({ success: true, data: response });
              } catch (error: any) {
                return JSON.stringify({ success: false, error: error.message });
              }
            },
          },
          // {
          //   name: "getSchedule",
          //   description: "Retrieve events from the calendar within a time range.",
          //   parameters: {
          //     type: "object",
          //     properties: {
          //       calendarId: { type: "string", description: "The calendar ID" },
          //       timeMin: { type: "string", format: "date-time", description: "Start time for the schedule" },
          //       timeMax: { type: "string", format: "date-time", description: "End time for the schedule" },
          //     },
          //     required: ["calendarId", "timeMin", "timeMax"],
          //   },
          //   function: async ({ calendarId, timeMin, timeMax }: { calendarId: string; timeMin: string; timeMax: string }): Promise<string> => {
          //     try {
          //       const response = await this.executorAgent.getSchedule(calendarId, timeMin, timeMax);
          //       return JSON.stringify({ success: true, data: response });
          //     } catch (error: any) {
          //       return JSON.stringify({ success: false, error: error.message });
          //     }
          //   },
          // },
        ],
      }, { streamFinalResponse: true, verbose: true });
      
      if (result && result instanceof ReadableStream) {
        const reader = result.getReader();
        let responseText = '';
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          responseText += decoder.decode(value, { stream: true });
        }
        responseText += decoder.decode(); // finalize the decoding
        
        // Remove any artifacts like "p" property
        const cleanedResponse = responseText
          .replace(/data: \{"response":"(.*?)","p":".*?"\}/g, '$1')
          .replace(/data: \{"response":"(.*?)"\}/g, '$1')
          .replace(/\n+/g, ' ');
        return cleanedResponse;
      }

      throw new IntentDeterminationError("Unexpected result type: Not a ReadableStream.");
    } catch (error: any) {
      console.error("Error in MainAgent:", error.message);
      throw new AgentError("An unexpected error occurred in MainAgent.");
    }
  }
  

  private prepareLLMMessages(interaction: InteractionData): RoleScopedChatInput[] {
    const messageHistory: RoleScopedChatInput[] = interaction.messages.map((msg: Message) => ({
      role: msg.role as "user" | "assistant" | "system" | "tool", // Type assertion
      content: msg.content,
    }));
  
    return [
      {
        role: "system",
        content: this.createIntentPrompt(interaction),
      },
      ...messageHistory,
    ];
  }

  private createIntentPrompt(interaction: InteractionData): string {
    const basePrompt = "You are a task manager for Band Manager. You are supposed to manage the calendar events.";
    const rolePrompt = "Understand the user's intent and delegate tasks, Consider the tasks a band manager has to keep track of for the band.";
    const instructionsPrompt = "Ask questions if details are missing, specifically for the tools you are using that is the addEvent, updateEvent, etc.";

    return `${basePrompt} ${rolePrompt} ${instructionsPrompt}`;
  }
}


class ValidatorAgent {
  constructor(private readonly AI: Ai) {}

  async validateResponse(response: string): Promise<string> {
    try {
      // Logic to validate the response
      return response;
    } catch (error:any) {
      throw new ValidationError("Error validating response: " + error.message);
    }
  }
}


export class AIService {
  private mainAgent: MainAgent;
  private validatorAgent: ValidatorAgent;

  constructor(private readonly AI: Ai, private readonly env: CloudflareBindings) {
    console.log("Enters into AIService");
    // const executorAgent = new ExecutorAgent(env);
    this.mainAgent = new MainAgent(AI, env);
    this.validatorAgent = new ValidatorAgent(AI);
  }

  async transcribeAudio(audioData: Uint8Array): Promise<string> {
    try {
      // Call the Whisper model to transcribe the audio
      const response = await this.AI.run("@cf/openai/whisper-tiny-en", {
        audio: Array.from(audioData),
      });

      if (!response?.text) {
        throw new Error("Failed to transcribe audio content.");
      }

      return response.text;
    } catch (error) {
      throw new InteractionError(
        "Failed to transcribe audio content",
        ErrorCodes.TRANSCRIPTION_FAILED,
      );
    }
  }
  async processLLMResponse(interaction: InteractionData): Promise<string> {
    try {
      console.log("Enters into processLLMResponse");
      return await this.mainAgent.handleInteraction(interaction);
    } catch (error) {
      if (error instanceof AgentError) {
        // Log the error or handle it as needed
        console.error(error.message);
        throw error;
      } else {
        throw new AgentError("An unexpected error occurred in AIService");
      }
    }
  }
}

