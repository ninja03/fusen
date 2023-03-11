onload = () => {
  const SCHEME = {
    "http:": "ws:",
    "https:": "wss:",
  };

  const sc = SCHEME[location.protocol];
  const socket = new WebSocket(sc + "//" + location.host + "/ws");

  const board = document.getElementById("board");

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

    if (board.children.length == 0) {
      board.appendChild(fusenWrapper);
    } else {
      for (const child of board.children) {
        if (createdAt >= child.dataset.createdAt) {
          child.before(fusenWrapper);
          break;
        }
      }
    }

    return fusenWrapper;
  }

  board.onclick = (e) => {
    const id = crypto.randomUUID();
    const msg = { act: "insert", id, txt: "" };
    socket.send(JSON.stringify(msg));
    console.log("send", msg);
  };
};
