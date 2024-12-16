import {
    InteractionData,
    Message,
    InteractionStatus
  } from "../types";
  import { InteractionError, ErrorCodes} from "../error";
  
  const CONFIG = {
    database: {
      tables: {
        interactions: "interactions",
        messages: "messages",
      },
      indexes: {
        messagesByInteraction: "idx_messages_interactionId",
      },
    },
  } as const;
  
  export class InteractionsDatabaseService {
    constructor(private sql: SqlStorage) {}
      /**
     * Sets up the database schema by creating tables and indexes if they do not exist.
     * This is called when initializing a new Durable Object instance to ensure
     * we have the required database structure.
     *
     * The schema consists of:
     * - interactions table: Stores session metadata like  status
     * - messages table: Stores the conversation history between user and AI
     * - messages index: Helps optimize queries when fetching messages for a specific interaction
     */
      createTables() {
        try {
          // Get list of existing tables to avoid recreating them
          const cursor = this.sql.exec(`PRAGMA table_list`);
          const existingTables = new Set([...cursor].map((table) => table.name));
    
          // The interactions table is our main table storing interactions sessions.
          // We only create it if it does not exist yet.
          if (!existingTables.has(CONFIG.database.tables.interactions)) {
            this.sql.exec(InteractionsDatabaseService.QUERIES.CREATE_INTERACTIONS_TABLE);
          }
    
          // The messages table stores the actual conversation history.
          // It references interactions table via foreign key for data integrity.
          if (!existingTables.has(CONFIG.database.tables.messages)) {
            this.sql.exec(InteractionsDatabaseService.QUERIES.CREATE_MESSAGES_TABLE);
          }
    
          // Add an index on interactionId to speed up message retrieval.
          // This is important since we will frequently query messages by interaction.
          this.sql.exec(InteractionsDatabaseService.QUERIES.CREATE_MESSAGE_INDEX);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          throw new InteractionError(
            `Failed to initialize database: ${message}`,
            ErrorCodes.DATABASE_ERROR,
          );
        }
      }  
    /**
   * Creates a new interaction session in the database.
   *
   * This is the main entry point for starting a new interaction. It handles all the
   * initial setup like:
   * - Generating a unique ID using crypto.randomUUID() for reliable uniqueness
   * - Recording the interaction title and required skills
   * - Setting up timestamps for tracking interaction lifecycle
   * - Setting the initial status to "Created"
   *
   */

    createInteraction(): string {
        try {
          const interactionId = crypto.randomUUID();
          const currentTime = Date.now();
          // Insert interaction into the database
          this.sql.exec(
            InteractionsDatabaseService.QUERIES.INSERT_INTERACTION,
            interactionId,
            InteractionStatus.Created,
            currentTime,
            currentTime,
          );
          // Log all rows in the interactions table
            const cursor = this.sql.exec("SELECT * FROM interactions");
            console.log("All interactions in the database:", [...cursor]);
    
          return interactionId;
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          throw new InteractionError(
            `Failed to create interaction: ${message}`,
            ErrorCodes.DATABASE_ERROR,
          );
        }
      }
    
    /**
     * Fetches all interactions from the database, ordered by creation date.
     *
     * This is useful for displaying interaction history and letting 
     * resume previous sessions. We order by descending creation date 
     *
     * Returns an array of InteractionData objects with full interaction details
     * including metadata and message history.
     */
    getAllInteractions(): InteractionData[] {
        try {
          const cursor = this.sql.exec(
            InteractionsDatabaseService.QUERIES.GET_ALL_INTERACTIONS,
          );
    
          return [...cursor].map(this.parseInteractionRecord);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          throw new InteractionError(
            `Failed to retrieve interactions: ${message}`,
            ErrorCodes.DATABASE_ERROR,
          );
        }
      }
    
      // Retrieves an interaction and its messages by ID
    getInteraction(interactionId: string): InteractionData | null {
        try {
        const cursor = this.sql.exec(
            InteractionsDatabaseService.QUERIES.GET_INTERACTION,
            interactionId,
        );

        const record = [...cursor][0];
        if (!record) return null;

        return this.parseInteractionRecord(record);
        } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new InteractionError(
            `Failed to retrieve interaction: ${message}`,
            ErrorCodes.DATABASE_ERROR,
        );
        }
    }

    
    addMessage(
        interactionId: string,
        role: Message["role"],
        content: string,
        messageId: string,
      ): Message {
        try {
          const timestamp = Date.now();
    
          this.sql.exec(
            InteractionsDatabaseService.QUERIES.INSERT_MESSAGE,
            messageId,
            interactionId,
            role,
            content,
            timestamp,
          );
    
          return {
            messageId,
            interactionId,
            role,
            content,
            timestamp,
          };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          throw new InteractionError(
            `Failed to add message: ${message}`,
            ErrorCodes.DATABASE_ERROR,
          );
        }
      }

/**
   * Transforms raw database records into structured interactionData objects.
   *
   * This helper does the heavy lifting of:
   * - Type checking critical fields to catch database corruption early
   * - Converting stored JSON strings back into proper objects
   * - Filtering out any null messages that might have snuck in
   * - Ensuring timestamps are proper numbers
   *
   * If any required data is missing or malformed, it throws an error
   * rather than returning partially valid data that could cause issues
   * downstream.
   */
private parseInteractionRecord(record: any): InteractionData {
    const interactionId = record.interactionId as string;
    const createdAt = Number(record.createdAt);
    const updatedAt = Number(record.updatedAt);

    if (!interactionId || !createdAt || !updatedAt) {
      throw new InteractionError(
        "Invalid interaction data in database",
        ErrorCodes.DATABASE_ERROR,
      );
    }

    return {
      interactionId,
      messages: record.messages
        ? JSON.parse(record.messages)
            .filter((m: any) => m !== null)
            .map((m: any) => ({
              messageId: m.messageId,
              role: m.role,
              content: m.content,
              timestamp: m.timestamp,
            }))
        : [],
      status: record.status as InteractionStatus,
      createdAt,
      updatedAt,
    };
  }
  
    private static readonly QUERIES = {
        CREATE_INTERACTIONS_TABLE: `
        CREATE TABLE IF NOT EXISTS interactions (
          interactionId TEXT PRIMARY KEY,
          createdAt INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
          updatedAt INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
          status TEXT NOT NULL DEFAULT 'pending'
        )
      `,
      CREATE_MESSAGES_TABLE: `
        CREATE TABLE IF NOT EXISTS messages (
          messageId TEXT PRIMARY KEY,
          interactionId TEXT NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          FOREIGN KEY (interactionId) REFERENCES interactions(interactionId)
        )
      `,
      CREATE_MESSAGE_INDEX: `
        CREATE INDEX IF NOT EXISTS idx_messages_interaction ON messages(interactionId)
      `,
      INSERT_INTERACTION: `
      INSERT INTO ${CONFIG.database.tables.interactions}
      (interactionId, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
    `,
        
    GET_ALL_INTERACTIONS: `
      SELECT
        interactionId,
        createdAt,
        updatedAt,
        status
      FROM ${CONFIG.database.tables.interactions}
      ORDER BY createdAt DESC
    `,

    INSERT_MESSAGE: `
      INSERT INTO ${CONFIG.database.tables.messages}
      (messageId, interactionId, role, content, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `,

    GET_INTERACTION: `
      SELECT
        i.interactionId,
        i.status,
        i.createdAt,
        i.updatedAt,
        COALESCE(
          json_group_array(
            CASE WHEN m.messageId IS NOT NULL THEN
              json_object(
                'messageId', m.messageId,
                'role', m.role,
                'content', m.content,
                'timestamp', m.timestamp
              )
            END
          ),
          '[]'
        ) as messages
      FROM ${CONFIG.database.tables.interactions} i
      LEFT JOIN ${CONFIG.database.tables.messages} m ON i.interactionId = m.interactionId
      WHERE i.interactionId = ?
      GROUP BY i.interactionId
    `,
    };
  }