import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Define the chat history table schema
export const chatHistory = sqliteTable("chat_history", {
  id: integer("id").primaryKey({autoIncrement: true}),
  user_query: text("user_query").notNull(),
  ai_response: text("ai_response").notNull(),
  timestamp: text("timestamp").default("CURRENT_TIMESTAMP"),
});
