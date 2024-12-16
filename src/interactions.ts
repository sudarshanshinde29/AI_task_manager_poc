import { DurableObject } from "cloudflare:workers";
import { InteractionsDatabaseService } from "./services/InteractionsDatabaseService";
import { InteractionData, Message } from "./types";
import { AIService } from "./services/AIService";

export class Interactions extends DurableObject<CloudflareBindings> {
      // Database service for persistent storage of interview data and messages
  private readonly db: InteractionsDatabaseService
  // We will use it to keep track of all active WebSocket connections for real-time communication
  private sessions: Map<string, { interactionId: string, socket: WebSocket }>;
  private readonly aiService: AIService;
  constructor(state: DurableObjectState, env: CloudflareBindings) {
    super(state, env);

    // Initialize empty sessions map - we will add WebSocket connections as users join
    this.sessions = new Map();
    // Set up our database connection using the DO's built-in SQLite instance
    this.db = new InteractionsDatabaseService(state.storage.sql);
    // First-time setup: ensure our database tables exist
    // This is idempotent so safe to call on every instantiation
    this.db.createTables();
    this.ctx.setWebSocketAutoResponse(
        new WebSocketRequestResponsePair("ping", "pong"),
      );
    this.aiService = new AIService(this.env.AI, env);
  }

  // Creates a new interaction session
  createInteraction(): string {
    console.log("Creating interaction");
    return this.db.createInteraction();
  }

  // Retrieves all interaction sessions
  getAllInteractions(): InteractionData[] {
    return this.db.getAllInteractions();
  }
  


  // Entry point for all HTTP requests to this Durable Object
  // This will handle both initial setup and WebSocket upgrades
//   async fetch(request: Request) {
//     // For now, just confirm the object is working
//     // We'll add WebSocket upgrade logic and request routing later
//     return new Response("Interaction object initialized");
//   }
  async fetch(request: Request): Promise<Response> {
    // Check if this is a WebSocket upgrade request
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader?.toLowerCase().includes("websocket")) {
      return this.handleWebSocketUpgrade(request);
    }

    // If it is not a WebSocket request, we don't handle it
    return new Response("Not found", { status: 404 });
  }

  // Broadcasts a message to all connected WebSocket clients.
  private broadcast(message: string) {
    this.ctx.getWebSockets().forEach((ws) => {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      } catch (error) {
        console.error(
          "Error broadcasting message to a WebSocket client:",
          error,
        );
      }
    });
  }

  addMessage(
    interactionId: string,
    role: "user" | "assistant",
    content: string,
    messageId: string,
  ): Message {
    const newMessage = this.db.addMessage(
      interactionId,
      role,
      content,
      messageId,
    );
    this.broadcast(
      JSON.stringify({
        ...newMessage,
        type: "message",
      }),
    );
    return newMessage;
  }

  private async handleWebSocketUpgrade(request: Request): Promise<Response> {
    // Extract the interaction ID from the URL - it should be the last segment
    const url = new URL(request.url);
    const interactionId = url.pathname.split("/").pop();

    if (!interactionId) {
      return new Response("Missing interactionId parameter", { status: 400 });
    }

    // Create a new WebSocket connection pair - one for the client, one for the server
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    console.log(`Client WebSocket: ${client}`);
    console.log(`Server WebSocket: ${server}`);
    console.log(`Setting session for interactionId: ${interactionId}`);
    // Keep track of which interaction this WebSocket is connected to
    // This is important for routing messages to the right interaction session
      // Generate a unique key for the session
  const sessionKey = crypto.randomUUID();
  const serverSocket = server as WebSocket;
  // Store the session with a unique key and include the WebSocket
  this.sessions.set(sessionKey, { 
    interactionId, 
    socket: serverSocket
  });

  console.log(`WebSocket Pair Created:
    Session Key: ${sessionKey}
    Interaction ID: ${interactionId}
    Server Socket: ${serverSocket}
    Sessions after set: ${JSON.stringify(
      [...this.sessions.entries()].map(([key, session]) => [
        key, 
        { 
          interactionId: session.interactionId, 
          socketExists: !!session.socket 
        }
      ])
    )}`);

    console.log(`Current sessions: ${JSON.stringify([...this.sessions.entries()])}`);
    // Additional logging to verify socket
  console.log(`Server Socket Type: ${typeof serverSocket}`);
  console.log(`Is WebSocket: ${serverSocket instanceof WebSocket}`);
    // Tell the Durable Object to start handling this WebSocket
    this.ctx.acceptWebSocket(server as WebSocket);

    // Send the current interaction state to the client right away
    // This helps initialize their UI with the latest data
    const interactionData = await this.db.getInteraction(interactionId);
    if (interactionData) {
      server.send(
        JSON.stringify({
          type: "interaction_details",
          data: interactionData,
        }),
      );
    }

    // Return the client WebSocket as part of the upgrade response
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    console.log(`WebSocket closed: 
      WebSocket: ${ws}
      Code: ${code}
      Reason: ${reason}
      Clean: ${wasClean}`);
    
    // Remove the session by finding the matching socket
    const sessionToRemove = [...this.sessions.entries()].find(
      ([key, session]) => session.socket === ws
    );
  
    if (sessionToRemove) {
      const [sessionKey] = sessionToRemove;
      this.sessions.delete(sessionKey);
      console.log(`Session removed for key: ${sessionKey}`);
    }
  }

  /**
 * Handles incoming WebSocket messages, both binary audio data and text messages.
 * This is the main entry point for all WebSocket communication.
 */
async webSocketMessage(ws: WebSocket, eventData: ArrayBuffer | string): Promise<void> {
    try {
      console.log(`Received WebSocket message for WebSocket: ${ws}`);
      
      // More robust session finding
    const sessionEntries = [...this.sessions.entries()];
    console.log(`Total sessions: ${sessionEntries.length}`);
    
    const sessionEntry = sessionEntries.find(
      ([key, session]) => {
        console.log(`Comparing session socket: ${session.socket} with incoming: ${ws}`);
        return session.socket === ws;
      }
    );

    if (!sessionEntry) {
      console.error('No session found for WebSocket', {
        incomingSocket: ws,
        sessions: sessionEntries.map(([key, session]) => ({
          key, 
          socketRef: session.socket,
          interactionId: session.interactionId
        }))
      });
      throw new Error("No interaction session found");
    }
    const [sessionKey, session] = sessionEntry;
    console.log(`Found session: 
      Key: ${sessionKey}
      Interaction ID: ${session.interactionId}`);

    if (eventData instanceof ArrayBuffer) {
      await this.handleBinaryAudio(ws, eventData);
      return;
    }
  } catch (error) {
    this.handleWebSocketError(ws, error);
  }
}



/**
 * Processes binary audio data received from the client.
 * Converts audio to text using Whisper and broadcasts processing status.
 */
private async handleBinaryAudio(ws: WebSocket, audioData: ArrayBuffer): Promise<void> {
    try {
      const uint8Array = new Uint8Array(audioData);
      console.log(`Handling binary audio for WebSocket: ${ws}`);
      const sessionEntry = [...this.sessions.entries()].find(
        ([key, session]) => session.socket === ws
      );
  
      // Detailed logging for session tracking
      console.log('Session search details:', {
        totalSessions: this.sessions.size,
        sessionsDetails: [...this.sessions.entries()].map(([key, session]) => ({
          key,
          interactionId: session.interactionId,
          socketReference: session.socket === ws
        }))
      });
  
  
      if (!sessionEntry) {
        throw new Error("No interaction session found");
      }
  
      const [sessionKey, session] = sessionEntry;
      const { interactionId } = session;
  
      console.log(`Retrieved session details:`, {
        sessionKey,
        interactionId,
        socketMatches: session.socket === ws
      });
      // Retrieve the associated interaction session

      if (!interactionId) {
        throw new Error("Invalid interaction session: Missing interaction ID");
      }
  
      // Generate unique ID to track this message through the system
      const messageId = crypto.randomUUID();
  
      // Let the client know we're processing their audio
      this.broadcast(
        JSON.stringify({
          type: "message",
          status: "processing",
          role: "user",
          messageId,
          interactionId: session.interactionId,
        }),
      );
  
      // TODO: Implement Whisper transcription in next section
      // Convert the audio to text using our AI transcription service
      const transcribedText = await this.aiService.transcribeAudio(uint8Array);
      // Save the user's message to our database so we maintain chat history
      await this.addMessage(session.interactionId, "user", transcribedText, messageId);
      // Look up the full interaction context - we need this to generate a good response
      const interaction = await this.db.getInteraction(session.interactionId);
      if (!interaction) {
        throw new Error(`Interaction not found: ${session.interactionId}`);
      }

    // Now it's the AI's turn to respond
    // First generate an ID for the assistant's message
    const assistantMessageId = crypto.randomUUID();
    // Let the client know we're working on the AI response
    this.broadcast(
        JSON.stringify({
          type: "message",
          status: "processing",
          role: "assistant",
          messageId: assistantMessageId,
          interactionId: session.interactionId,
        }),
      );

      // Generate the AI assistant's response based on the conversation history
      const llmResponse = await this.aiService.processLLMResponse(interaction);
       await this.addMessage(session.interactionId, "assistant", llmResponse, assistantMessageId);
      // For now, just log the received audio data size
      console.log(`Received audio data of length: ${uint8Array.length}`);
    } catch (error) {
      console.error("Audio processing failed:", error);
      this.handleWebSocketError(ws, error);
    }
  }
  
  /**
   * Handles WebSocket errors by logging them and notifying the client.
   * Ensures errors are properly communicated back to the user.
   */
  private handleWebSocketError(ws: WebSocket, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("WebSocket error:", errorMessage);
  
    // More detailed error logging
    console.error('Error context:', {
      websocket: ws,
      sessions: [...this.sessions.entries()].map(([key, session]) => ({
        key,
        socketRef: session.socket,
        interactionId: session.interactionId
      }))
    });
  
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: errorMessage,
        })
      );
    }
  
    // Remove the session by finding the matching socket
    const sessionToRemove = [...this.sessions.entries()].find(
      ([key, session]) => session.socket === ws
    );
  
    if (sessionToRemove) {
      const [sessionKey] = sessionToRemove;
      this.sessions.delete(sessionKey);
      console.log(`Session removed for key: ${sessionKey}`);
    }
  }
}
