import { Hono , Context} from 'hono';
import calendar from './routes/calendar';
import ai from './routes/ai'; 
import { configureAuthRoutes } from "./routes/auth";
import { logger } from "hono/logger";
import type { ApiContext } from "./types";
import { requireAuth } from "./middleware/auth";
import { Interactions } from './interactions';
import { configureInteractionRoutes } from "./routes/interactions";
import { handleError } from "./middleware/handleError";
// Create our main Hono app instance with proper typing
const app = new Hono<ApiContext>();


// Create a separate router for API endpoints to keep things organized
const api = new Hono<ApiContext>();

// // Root route
// app.get('/', (c) => {
//   return c.text('Hello Hono!');
// });

// Mount calendar routes under `/calendar`
app.route('/calendar', calendar);
// app.route('./ai', ai)



// Set up global middleware that runs on every request
// - Logger gives us visibility into what is happening
app.use("*", logger());
app.onError(handleError);
// Wire up all our authentication routes (login, etc)
// These will be mounted under /api/v1/auth/
api.route("/auth", configureAuthRoutes());

api.route("/interactions", configureInteractionRoutes());
// Mount all API routes under the version prefix (for example, /api/v1)
// This allows us to make breaking changes in v2 without affecting v1 users
app.route("/api/v1", api);
export { Interactions };

export default app;





