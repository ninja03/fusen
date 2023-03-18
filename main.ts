import { serve } from "https://deno.land/std@0.179.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.179.0/http/file_server.ts";
import { renderFileToString, Params } from "https://deno.land/x/dejs@0.10.3/mod.ts";

interface Fusen {
  id: string;
  txt: string;
  createdAt: number;
}

interface Msg {
  id: string;
  act: "insert" | "update" | "delete";
  txt?: string;
  createdAt?: number;
}

async function renderPage(tpl: string, params: Params = {}) {
  const body = await renderFileToString(`${Deno.cwd()}/${tpl}`, params);
  return new Response(body, {
    headers: { "content-type": "text/html" },
  });
}

function insert(msg: Msg) {
  allFusens[msg.id] = {
    id: msg.id,
    txt: "",
    createdAt: new Date().getTime(),
  };
  const sendMsg: Msg = {
    act: "insert",
    id: msg.id,
    txt: msg.txt,
    createdAt: allFusens[msg.id].createdAt,
  };
  broadcast(sendMsg);
}

function update(msg: Msg) {
  if (!msg.txt) {
    return;
  }
  const fusen = allFusens[msg.id];
  if (!fusen) {
    return;
  }
  allFusens[msg.id].txt = msg.txt;
  const sendMsg: Msg = {
    act: "update",
    id: msg.id,
    txt: allFusens[msg.id].txt,
    createdAt: allFusens[msg.id].createdAt,
  };
  broadcast(sendMsg);
}

function deleteFusen(msg: Msg) {
  delete allFusens[msg.id];
  const sendMsg: Msg = {
    act: "delete",
    id: msg.id,
  };
  broadcast(sendMsg);
}

function socketOpen(e: Event, id: string) {
  const socket = e.currentTarget as WebSocket;
  allSockets[id] = e.currentTarget as WebSocket;

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
}

function socketMessage(e: MessageEvent) {
  console.log("recv", e.data);
  const msg = JSON.parse(e.data) as Msg;
  switch (msg.act) {
    case "insert":
      insert(msg);
      break;
    case "update":
      update(msg);
      break;
    case "delete": {
      deleteFusen(msg);
      break;
    }
  }
  channel.postMessage(allFusens);
}

function socketClose(id: string) {
  delete allSockets[id];
}

function handleWebSocket(req: Request) {
  const { response, socket } = Deno.upgradeWebSocket(req);
  const id = crypto.randomUUID();

  socket.onopen = (e) => socketOpen(e, id);
  socket.onmessage = socketMessage;
  socket.onclose = () => socketClose(id);

  return response;
}

// エッジ間通信
function broadcast(msg: Msg) {
  for (const id in allSockets) {
    const otherSocket = allSockets[id];
    console.log("send", id, msg);
    otherSocket.send(JSON.stringify(msg));
  }
}

function channelMessage(e: MessageEvent) {
  allFusens = JSON.parse(e.data);
  for (const id in allFusens) {
    const msg: Msg = { act: "update", ...allFusens[id] };
    broadcast(msg);
  }
}

async function handler(req: Request) {
  const { pathname } = new URL(req.url);
  const path = req.method + " " + pathname;
  switch (path) {
    case "GET /": return await renderPage("index.ejs");
    case "GET /ws": return handleWebSocket(req);
  }
  return serveDir(req, { fsRoot: "./static/" });
}

const allSockets = {} as Record<string, WebSocket>;
let allFusens = {} as Record<string, Fusen>;
const channel = new BroadcastChannel("earth");
channel.onmessage = channelMessage;
serve(handler);
