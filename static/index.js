function createWebSocket() {
  const SCHEME = new Map();
  SCHEME.set("http:", "ws:");
  SCHEME.set("https:", "wss:");
  const sc = SCHEME.get(location.protocol);
  return new WebSocket(sc + "//" + location.host + "/ws");
}

function socketMessage(e) {
  const msg = JSON.parse(e.data);
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
}

function fusenTxtClick(e) {
  e.stopPropagation();
}

function fusenWrapperClick(e) {
  e.stopPropagation();
}

function fusenInput(e, id) {
  const fusenTxt = e.target;
  console.log(fusenTxt);
  const msg = { act: "update", id, txt: fusenTxt.value };
  socket.send(JSON.stringify(msg));
  console.log("send", msg);
}

function fusenDelClick(e, id) {
  const msg = { act: "delete", id };
  socket.send(JSON.stringify(msg));
  console.log("send", msg);
  e.stopPropagation();
}

function createElement(id, createdAt) {
  const fusenWrapper = document.createElement("div");
  fusenWrapper.id = id;
  fusenWrapper.dataset.createdAt = String(createdAt);
  fusenWrapper.className =
    "w-24 h-24 bg-yellow-100 pt-4 m-4 relative float-left shadow-md";
  fusenWrapper.onclick = fusenWrapperClick;

  const fusenTxt = document.createElement("textarea");
  fusenTxt.className = "w-24 h-20 bg-transparent resize-none";
  fusenTxt.onclick = fusenTxtClick;
  fusenTxt.oninput = (e) => fusenInput(e, id);
  fusenTxt.focus();
  fusenWrapper.appendChild(fusenTxt);

  const fusenDel = document.createElement("div");
  fusenDel.className = "absolute top-0 right-0 cursor-pointer";
  fusenDel.textContent = "❎";
  fusenDel.onclick = (e) => fusenDelClick(e, id);
  fusenWrapper.appendChild(fusenDel);

  if (board.children.length == 0) {
    board.appendChild(fusenWrapper);
  } else {
    const children = Array.from(board.children);
    for (const child of children) {
      if (createdAt >= Number(child.dataset.createdAt)) {
        child.before(fusenWrapper);
        break;
      }
    }
  }

  return fusenWrapper;
}

function clickBoard() {
  const id = crypto.randomUUID();
  const msg = { act: "insert", id, txt: "" };
  socket.send(JSON.stringify(msg));
  console.log("send", msg);
}

const socket = createWebSocket();
socket.onmessage = socketMessage;
const board = document.getElementById("board");
board.onclick = clickBoard;
