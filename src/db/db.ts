import { drizzle } from "drizzle-orm/d1";
interface Env {
  DB: D1Database;
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_ACCOUNT_ID: string;
}

import { chatHistory } from "./schema"; // Import the table schema

export class ChatDatabase {
  private db;

  constructor(env: Env) {
    // Initialize the Drizzle ORM with the D1 database binding
    this.db = drizzle(env.DB);
  }

  // Method to save a user query and AI response to the database
  async saveChat(userQuery: string, aiResponse: string): Promise<void> {
    await this.db.insert(chatHistory).values({
      user_query: userQuery,
      ai_response: aiResponse,
    });
  }

  // Method to retrieve all chat history, ordered by timestamp
  async getChatHistory(): Promise<any[]> {
    return await this.db
      .select({
        id: chatHistory.id,
        user_query: chatHistory.user_query,
        ai_response: chatHistory.ai_response,
        timestamp: chatHistory.timestamp,
      })
      .from(chatHistory)
      .orderBy(chatHistory.timestamp)
      .all();
  }
  
}

