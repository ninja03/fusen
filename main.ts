import { serve, serveDir } from "./deps.ts";
import { websocket } from "./websocket/websocket.ts";

const mainRouter = new Map();
mainRouter.set("/ws", websocket);
serve((req: Request) => {
  const { pathname } = new URL(req.url);
  const handler = mainRouter.get(pathname);
  if (handler) {
    return handler(req);
  }
  return serveDir(req, { fsRoot: "./static/", showIndex: true });
});
