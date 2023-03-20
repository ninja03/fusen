const allSockets = {};
let allFusens = {};
const channel = new BroadcastChannel("earth");
channel.onmessage = channelMessage;

function insert(msg) {
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
}

function update(msg) {
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
}

function deleteFusen(msg) {
  delete allFusens[msg.id];
  const sendMsg = {
    act: "delete",
    id: msg.id,
  };
  broadcast(sendMsg);
}

function socketOpen(e, id) {
  const socket = e.currentTarget;
  allSockets[id] = e.currentTarget;

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

function socketMessage(e) {
  console.log("recv", e.data);
  const msg = JSON.parse(e.data);
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

function socketClose(id) {
  delete allSockets[id];
}

// エッジ間通信
function broadcast(msg) {
  for (const id in allSockets) {
    const otherSocket = allSockets[id];
    console.log("send", id, msg);
    otherSocket.send(JSON.stringify(msg));
  }
}

function channelMessage(e) {
  allFusens = JSON.parse(e.data);
  for (const id in allFusens) {
    const msg = { act: "update", ...allFusens[id] };
    broadcast(msg);
  }
}


export const handler = {
  GET(req, ctx) {
    const { response, socket } = Deno.upgradeWebSocket(req);
    const id = crypto.randomUUID();
  
    socket.onopen = (e) => socketOpen(e, id);
    socket.onmessage = socketMessage;
    socket.onclose = () => socketClose(id);
  
    return response;
  }
}
