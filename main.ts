import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const mainRouter = {
  "/": index,
  "/ws": websocket
};

serve((req) => {
  const { pathname } = new URL(req.url);
  const handler = mainRouter[pathname];
  if (handler) {
    return handler(req);
  }
});

function index() {
  const body = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>付箋共有</title>
        <style>
          html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            background-color: white;
          }
          
          .fusen-wrapper {
            background-color: beige;
            width: 100px;
            height: 100px;
            position: relative;
            margin: 10px;
            float: left;
          }
          
          .fusen-txt {
            background-color: transparent;
            width: 90%;
            height: 70%;
            margin-top: 25px;
            resize: none;
            border: none;
          }
          
          .fusen-del {
            position: absolute;
            top: 0px;
            right: 0px;
            cursor: pointer;
          }
        </style>
        <script type="module">
          onload = () => {
            const SCHEME = {
              "http:": "ws:",
              "https:": "wss:"
            };
          
            const sc = SCHEME[location.protocol];
            const socket = new WebSocket(sc + "//" + location.host + "/ws");
            
            socket.onmessage = (e) => {
              const msg = JSON.parse(event.data);
              console.log("recv", msg);
              let elem = document.getElementById(msg.id);
              if (msg.act == "insert" || msg.act == "update") {
                if (!elem) {
                  elem = createElement(msg.id, msg.createdAt);
                }
                elem.getElementsByTagName("textarea")[0].value = msg.txt;
              } else if (msg.act == "delete") {
                if (elem) {
                  elem.remove();
                }
              }
            };
          
            function createElement(id, createdAt) {
              const fusenWrapper = document.createElement("div");
              fusenWrapper.id = id;
              fusenWrapper.dataset.createdAt = createdAt;
              fusenWrapper.className = "fusen-wrapper";
              fusenWrapper.onclick = (e) => {
                e.stopPropagation();
              };
          
              const fusenTxt = document.createElement("textarea");
              fusenTxt.className = "fusen-txt";
              fusenTxt.onclick = (e) => {
                e.stopPropagation();
              };
              fusenTxt.oninput = (e) => {
                const msg = { act: "update", id, txt: e.target.value };
                socket.send(JSON.stringify(msg));
                console.log("send", msg);
              };
              fusenTxt.focus();
              fusenWrapper.appendChild(fusenTxt);
          
              const fusenDel = document.createElement("div");
              fusenDel.className = "fusen-del";
              fusenDel.textContent = "❎";
              fusenDel.onclick = (e) => {
                const msg = { act: "delete", id };
                socket.send(JSON.stringify(msg));
                console.log("send", msg);
                e.stopPropagation();
              };
              fusenWrapper.appendChild(fusenDel);
          
              if (document.body.children.length == 0) {
                document.body.appendChild(fusenWrapper);
              } else {
                for (const child of document.body.children) {
                  if (createdAt >= child.dataset.createdAt) {
                    child.before(fusenWrapper);
                    break;
                  }
                }
              }
          
              return fusenWrapper;
            }
          
            document.body.onclick = (e) => {
              const id = crypto.randomUUID();
              const msg = { act: "insert", id, txt: "" };
              socket.send(JSON.stringify(msg));
              console.log("send", msg);
            }
          };
        </script>
      </head>
      <body/>
    </html>
  `;
  return new HTMLResponse(body);
}

class HTMLResponse extends Response {
  constructor(body) {
    const init = { headers: { "content-type": "text/html" } };
    super(body, init);
  }
}

const channel = new BroadcastChannel("earth");

channel.onmessage = (e) => {
  allFusens = JSON.parse(e.data);
  for (const fusen of allFusens) {
    broadcast(fusen);
  }
};


const wsRouter = {
  "insert": recvInsert,
  "update": recvUpdate,
  "delete": recvDelete
};

const allSockets = {};
let allFusens = {};

function websocket(req) {
  const { response, socket } = Deno.upgradeWebSocket(req);
  const id = crypto.randomUUID();

  socket.onopen = (e) => {
    allSockets[id] = socket;

    for (const k in allFusens) {
      const fusen = allFusens[k];
      const msg = {
        act: "update",
        id: fusen.id,
        txt: fusen.txt,
        createdAt: fusen.createdAt
      };
      socket.send(JSON.stringify(msg));
    }
  };

  socket.onmessage = (e) => {
    console.log("recv", e.data);
    const msg = JSON.parse(e.data);
    const handler = wsRouter[msg.act];
    if (handler) {
      handler(msg);
      channel.postMessage(allFusens);
    }
  };

  socket.onclose = () => {
    delete allSockets[id];
  }

  return response;
}

function recvInsert(msg) {
  allFusens[msg.id] = {
    id: msg.id,
    txt: msg.txt,
    createdAt: new Date().getTime()
  };
  const sendMsg = {
    act: "insert",
    id: msg.id,
    txt: msg.txt,
    createdAt: allFusens[msg.id].createdAt
  };
  broadcast(sendMsg);
}

function recvUpdate(msg) {
  allFusens[msg.id].txt = msg.txt;
  const sendMsg = {
    act: "update",
    id: msg.id,
    txt: allFusens[msg.id].txt,
    createdAt: allFusens[msg.id].createdAt
  };
  broadcast(sendMsg);
}

function recvDelete(msg) {
  delete allFusens[msg.id];
  const sendMsg = {
    act: "delete",
    id: msg.id
  };
  broadcast(sendMsg);
}

function broadcast(msg) {
  for (const id in allSockets) {
    const otherSocket = allSockets[id];
    console.log("send", id, msg);
    otherSocket.send(JSON.stringify(msg));
  }
}