import { serve, serveDir } from "./deps.ts";
import { websocket } from "./websocket/websocket.ts";
import { Index } from "./index/index.ts";
import { Page } from "./common/page.ts";

const router = new Map<string, Page>();
router.set("/", new Index());

serve(async (req: Request) => {
  const { pathname } = new URL(req.url);
  if (pathname == "/ws") {
    return websocket(req);
  }

  const page = router.get(pathname);
  if (page) {
    return await page.render(req);
  }

  return serveDir(req, { fsRoot: "./static/", showIndex: true });
});
