import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.177.0/http/file_server.ts";
import { renderFileToString } from "https://deno.land/x/dejs@0.10.3/mod.ts";

const renderPage = async (tpl, params) => {
  const body = await renderFileToString(`${Deno.cwd()}/${tpl}`, params);
  return new Response(body, {
    headers: { "content-type": "text/html" },
  });
}

const main = async () => {
  const router = new Map();

  // HTML
  router.set("/", async () => {
    return await renderPage("index.ejs");
  });

  // WebSocket
  const allSockets  = {};
  let allFusens = {};

  router.set("/ws", async ({ req }) => {
    const { response, socket } = Deno.upgradeWebSocket(req);
    const id = crypto.randomUUID();
  
    const router = new Map();
    router.set("insert", (msg) => {
      allFusens[msg.id] = {
        id: msg.id,
        txt: "",
        createdAt: new Date().getTime(),
      };
      const sendMsg = {
        act: "insert",
        id: msg.id,
        txt: msg.txt,
        createdAt: allFusens[msg.id].createdAt,
      };
      broadcast(sendMsg);
    });

    router.set("update", (msg) => {
      if (!msg.txt) {
        return;
      }
      const fusen = allFusens[msg.id];
      if (!fusen) {
        return;
      }
      allFusens[msg.id].txt = msg.txt;
      const sendMsg = {
        act: "update",
        id: msg.id,
        txt: allFusens[msg.id].txt,
        createdAt: allFusens[msg.id].createdAt,
      };
      broadcast(sendMsg);
    });

    router.set("delete", (msg) => {
      delete allFusens[msg.id];
      const sendMsg = {
        act: "delete",
        id: msg.id,
      };
      broadcast(sendMsg);
    });
  
    socket.onopen = (e) => {
      allSockets[id] = socket;
  
      for (const k in allFusens) {
        const fusen = allFusens[k];
        const msg = {
          act: "update",
          id: fusen.id,
          txt: fusen.txt,
          createdAt: fusen.createdAt,
        };
        socket.send(JSON.stringify(msg));
      }
    };
  
    socket.onmessage = (e) => {
      console.log("recv", e.data);
      const msg = JSON.parse(e.data);
      const handler = router.get(msg.act);
      if (handler) {
        handler(msg);
        channel.postMessage(allFusens);
      }
    };
  
    socket.onclose = () => {
      delete allSockets[id];
    };
  
    return response;
  });

  // エッジ間通信
  const channel = new BroadcastChannel("earth");
  const broadcast = (msg) => {
    for (const id in allSockets) {
      const otherSocket = allSockets[id];
      console.log("send", id, msg);
      otherSocket.send(JSON.stringify(msg));
    }
  };
  channel.onmessage = (e) => {
    allFusens = JSON.parse(e.data);
    for (const id in allFusens) {
      const msg = { act: "update", ...allFusens[id] };
      broadcast(msg);
    }
  };

  // サーバを立てる
  serve(async (req) => {
    const { pathname } = new URL(req.url);
    const handler = router.get(pathname);
    if (handler) {
      return await handler({ req });
    }
    return serveDir(req, { fsRoot: "./static/", showIndex: true });
  });
};

await main();