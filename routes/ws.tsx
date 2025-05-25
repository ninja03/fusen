import { Handlers } from "$fresh/server.ts";
import { Fusen, Msg, MsgD, MsgIU } from "@/types.ts";

const allSockets = {} as Record<string, WebSocket>;
let allFusens = {} as Record<string, Fusen>;
const channel = new BroadcastChannel("earth");
channel.onmessage = channelMessage;

const kv = await Deno.openKv();

async function loadFusensFromKV() {
  const entries = kv.list({ prefix: ["fusen"] });
  for await (const entry of entries) {
    const fusen = entry.value as Fusen;
    allFusens[fusen.id] = fusen;
  }
}

await loadFusensFromKV();

async function insert(msg: MsgIU) {
  const fusen: Fusen = {
    id: msg.id,
    txt: msg.txt ?? "",
    x: msg.x ?? 0,
    y: msg.y ?? 0,
    width: msg.width ?? 96,
    height: msg.height ?? 96,
    createdAt: Date.now(),
  };
  allFusens[msg.id] = fusen;
  await kv.set(["fusen", msg.id], fusen);
  const sendMsg: MsgIU = { act: "insert", ...fusen };
  broadcast(sendMsg);
}

async function update(msg: MsgIU) {
  const fusen = allFusens[msg.id];
  if (!fusen) {
    return;
  }
  if (msg.txt !== undefined) fusen.txt = msg.txt;
  if (msg.x !== undefined) fusen.x = msg.x;
  if (msg.y !== undefined) fusen.y = msg.y;
  if (msg.width !== undefined) fusen.width = msg.width;
  if (msg.height !== undefined) fusen.height = msg.height;
  allFusens[msg.id] = fusen;
  await kv.set(["fusen", msg.id], fusen);
  const sendMsg: MsgIU = { act: "update", ...fusen };
  broadcast(sendMsg);
}

async function deleteFusen(msg: MsgD) {
  delete allFusens[msg.id];
  await kv.delete(["fusen", msg.id]);
  const sendMsg: MsgD = {
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
    const msg: MsgIU = { act: "update", ...fusen };
    socket.send(JSON.stringify(msg));
  }
}

async function socketMessage(e: MessageEvent) {
  console.log("recv", e.data);
  const msg = JSON.parse(e.data) as Msg;
  switch (msg.act) {
    case "insert":
      await insert(msg);
      break;
    case "update":
      await update(msg);
      break;
    case "delete": {
      await deleteFusen(msg);
      break;
    }
  }
  channel.postMessage(allFusens);
}

function socketClose(id: string) {
  delete allSockets[id];
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
    const msg: MsgIU = { act: "update", ...allFusens[id] };
    broadcast(msg);
  }
}

export const handler: Handlers = {
  GET(req) {
    const { response, socket } = Deno.upgradeWebSocket(req);
    const id = crypto.randomUUID();

    socket.onopen = (e: Event) => socketOpen(e, id);
    socket.onmessage = socketMessage;
    socket.onclose = () => socketClose(id);

    return response;
  },
};
