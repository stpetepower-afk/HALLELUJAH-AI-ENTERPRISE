// src/server.ts
// Local dev entrypoint only -- npm run dev. Production (Netlify) uses
// netlify/functions/api.ts instead, which imports the same app from ./app.
import { app } from "./app";
import { log } from "./utils/logger";

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => log(`Server listening on port ${port}`));
