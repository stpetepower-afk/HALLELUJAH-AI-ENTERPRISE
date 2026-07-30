// netlify/functions/api.ts
// Wraps the shared Express app (src/app.ts) so it runs as a single Netlify
// Function. netlify.toml redirects every API path to this function; static
// files (public/coach-console.html) are served directly by Netlify, never
// reaching this function.
import serverless from "serverless-http";
import { app } from "../../src/app";

// basePath strips the Netlify Function's own URL prefix before Express sees
// the path, so app.use("/auth", ...) etc. keep working unchanged regardless
// of exactly how Netlify's redirect rewriting presents the path.
export const handler = serverless(app, { basePath: "/.netlify/functions/api" });
