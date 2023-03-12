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

const router = new Map<string, (msg: Msg) => void>();
router.set("insert", recvInsert);
router.set("update", recvUpdate);
router.set("delete", recvDelete);

const allSockets: Record<string, WebSocket> = {};
let allFusens: Record<string, Fusen> = {};

export function websocket(req: Request) {
  const { response, socket } = Deno.upgradeWebSocket(req);
  const id = crypto.randomUUID();

  socket.onopen = (_e) => {
    allSockets[id] = socket;

    for (const k in allFusens) {
      const fusen = allFusens[k];
      const msg: Msg = {
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
}

function recvInsert(msg: Msg) {
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

function recvUpdate(msg: Msg) {
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

function recvDelete(msg: Msg) {
  delete allFusens[msg.id];
  const sendMsg: Msg = {
    act: "delete",
    id: msg.id,
  };
  broadcast(sendMsg);
}

function broadcast(msg: Msg) {
  for (const id in allSockets) {
    const otherSocket = allSockets[id];
    console.log("send", id, msg);
    otherSocket.send(JSON.stringify(msg));
  }
}

const channel = new BroadcastChannel("earth");

channel.onmessage = (e) => {
  allFusens = JSON.parse(e.data);
  for (const id in allFusens) {
    const msg: Msg = { act: "update", ...allFusens[id] };
    broadcast(msg);
  }
};
