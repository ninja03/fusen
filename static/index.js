onload = () => {
  // WebSocket
  const createWebSocket = () => {
    const SCHEME = new Map();
    SCHEME.set("http:", "ws:");
    SCHEME.set("https:", "wss:");
    const sc = SCHEME.get(location.protocol);
    return new WebSocket(sc + "//" + location.host + "/ws");
  };

  const socket = createWebSocket();
  socket.onmessage = (e) => {
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
  };

  // 付箋追加
  const createElement = (id, createdAt) => {
    const fusenWrapper = document.createElement("div");
    fusenWrapper.id = id;
    fusenWrapper.dataset.createdAt = String(createdAt);
    fusenWrapper.className =
      "w-24 h-24 bg-yellow-100 pt-4 m-4 relative float-left";
    fusenWrapper.onclick = (e) => {
      e.stopPropagation();
    };

    const fusenTxt = document.createElement("textarea");
    fusenTxt.className = "w-24 h-20 bg-transparent";
    fusenTxt.onclick = (e) => {
      e.stopPropagation();
    };
    fusenTxt.oninput = (e) => {
      const msg = { act: "update", id, txt: fusenTxt.value };
      socket.send(JSON.stringify(msg));
      console.log("send", msg);
    };
    fusenTxt.focus();
    fusenWrapper.appendChild(fusenTxt);

    const fusenDel = document.createElement("div");
    fusenDel.className = "absolute top-0 right-0 cursor-pointer";
    fusenDel.textContent = "❎";
    fusenDel.onclick = (e) => {
      const msg = { act: "delete", id };
      socket.send(JSON.stringify(msg));
      console.log("send", msg);
      e.stopPropagation();
    };
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
  };

  // クリックイベント
  const board = document.getElementById("board");
  board.onclick = (e) => {
    const id = crypto.randomUUID();
    const msg = { act: "insert", id, txt: "" };
    socket.send(JSON.stringify(msg));
    console.log("send", msg);
  };
};
