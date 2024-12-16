import { Hono } from "hono";
import { BadRequestError } from "../error";
import {
    ApiContext,
    HonoCtx
  } from "../types";
  import { requireAuth } from "../middleware/auth";

/**
 * Gets the Interaction Durable Object instance
 * We use the username as a stable identifier to ensure each user
 * gets their own dedicated DO instance that persists across requests.
 */
const getInteractionDO = (ctx: HonoCtx) => {
    const username = ctx.get("username");
    console.log("Retrieved username:", username);
    const id = ctx.env.INTERACTIONS.idFromName(username);
    console.log("Generated DO ID:", id);
    return ctx.env.INTERACTIONS.get(id);
  };

/**
 * GET /interactions
 * Retrieves all interactions for the authenticated user.
 * The interactions are stored and managed by the user's DO instance.
 */
const getAllInteractions = async (ctx: HonoCtx) => {
    console.log("Entering getAllInteractions route");
    const interactionDO = getInteractionDO(ctx);
    console.log("Interaction DO retrieved:", interactionDO);

    // try {
    //     const interactions = await interactionDO.getAllInteractions();
    //     console.log("Retrieved interactions:", interactions);
    //     return ctx.json(interactions);
    //   } catch (error) {
    //     console.error("Error fetching interactions:", error);
    //     throw error; // Re-throw to return an appropriate error response
    //   }

    const interactions = await interactionDO.getAllInteractions();
    return ctx.json(interactions);
  };
  

/**
 * POST /inteactions
 * Creates a new interaction session 
 * Each interaction gets a unique ID that can be used to reference it later.
 * Returns the newly created interaction ID on success.
 */
const createInteraction = async (ctx: HonoCtx) => {
    // const body = await ctx.req.json<InteractionInput>();
    // validateInteractionInput(body);
  
    const interactionDO = getInteractionDO(ctx);
    const interactionId = await interactionDO.createInteraction(
    //   body.title as InterviewTitle,
    //   body.skills as InterviewSkill[],
    );
  
    return ctx.json({ success: true, interactionId });
  };
  const streamInteractionProcess = async (ctx: HonoCtx) => {
    const interactionDO = getInteractionDO(ctx);
    return await interactionDO.fetch(ctx.req.raw);
  };

  /**
 * Sets up all interaction-related routes.
 * Currently supports:
 * - GET / : List all interactions
 * - POST / : Create a new interaction
 */
export const configureInteractionRoutes = () => {
    const router = new Hono<ApiContext>();
    router.use("*", requireAuth);
    router.get("/", getAllInteractions);
    router.post("/", createInteraction);
    router.get("/:interactionId", streamInteractionProcess);
    return router;
    // router.post("/", async (ctx: HonoCtx) => {
    //     return ctx.json({ message: "Interaction received!" });
    //   });
    
    //   return router;
    
  };