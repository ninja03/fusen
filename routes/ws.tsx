import { Handlers } from "$fresh/server.ts";
import { Fusen, Msg, MsgD, MsgIU } from "@/types.ts";

const allSockets = {} as Record<string, WebSocket>;
let allFusens = {} as Record<string, Fusen>;
const channel = new BroadcastChannel("earth");
channel.onmessage = channelMessage;

function insert(msg: MsgIU) {
  allFusens[msg.id] = {
    id: msg.id,
    txt: "",
    createdAt: new Date().getTime(),
  };
  const sendMsg: MsgIU = {
    act: "insert",
    id: msg.id,
    txt: msg.txt,
    createdAt: allFusens[msg.id].createdAt,
  };
  broadcast(sendMsg);
}

function update(msg: MsgIU) {
  if (!msg.txt) {
    return;
  }
  const fusen = allFusens[msg.id];
  if (!fusen) {
    return;
  }
  allFusens[msg.id].txt = msg.txt;
  const sendMsg: MsgIU = {
    act: "update",
    id: msg.id,
    txt: allFusens[msg.id].txt,
    createdAt: allFusens[msg.id].createdAt,
  };
  broadcast(sendMsg);
}

function deleteFusen(msg: MsgD) {
  delete allFusens[msg.id];
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
