import { useCallback, useEffect, useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { Fusen, Msg } from "@/types.ts";

export default function Board() {
  const ws = useRef<WebSocket>();
  const fusenList = useSignal<Fusen[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<{ id: string; offX: number; offY: number } | null>(
    null,
  );
  const resizing =
    useRef<{ id: string; startX: number; startY: number; w: number; h: number } | null>(
      null,
    );
  const colors = [
    "bg-yellow-200",
    "bg-pink-200",
    "bg-green-200",
    "bg-blue-200",
    "bg-purple-200",
    "bg-red-200",
    "bg-orange-200",
  ];

  const pickColor = (id: string) => {
    const n = parseInt(id.replaceAll("-", "").slice(0, 8), 16);
    return colors[n % colors.length];
  };

  useEffect(() => {
    const SCHEME = new Map();
    SCHEME.set("http:", "ws:");
    SCHEME.set("https:", "wss:");
    const sc = SCHEME.get(location.protocol);
    ws.current = new WebSocket(sc + "//" + location.host + "/ws");
    console.log("ws.current", ws.current);
    ws.current.onmessage = (e) => {
      const msg = JSON.parse(e.data) as Msg;
      const elem = fusenList.value.find((fusen) => fusen.id == msg.id);
      if (msg.act == "insert" || msg.act == "update") {
        if (!elem) {
          fusenList.value = [...fusenList.value, msg as Fusen];
        } else {
          fusenList.value = fusenList.value.map((fusen) => {
            if (fusen.id == msg.id) {
              return { ...fusen, ...(msg as Fusen) };
            } else {
              return fusen;
            }
          });
        }
      } else if (msg.act == "delete" && elem) {
        fusenList.value = fusenList.value.filter((fusen) =>
          fusen.id != elem.id
        );
      }
    };
    return () => ws.current?.close();
  }, []);

  const clickBoard = useCallback((e: MouseEvent) => {
    if (!ws.current) {
      return;
    }
    const rect = boardRef.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : 0;
    const y = rect ? e.clientY - rect.top : 0;
    const id = crypto.randomUUID();
    const msg = { act: "insert", id, txt: "", x, y, width: 160, height: 100 };
    ws.current.send(JSON.stringify(msg));
    console.log("send", msg);
    
    setTimeout(() => {
      const textarea = document.querySelector(`textarea[data-fusen-id="${id}"]`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
      }
    }, 100);
  }, []);

  const fusenInput = useCallback((fusen: Fusen, txt: string) => {
    if (!ws.current) {
      return;
    }
    const msg = { act: "update", id: fusen.id, txt };
    ws.current.send(JSON.stringify(msg));
    console.log("send", msg);
  }, []);

  const startDrag = useCallback((fusen: Fusen, e: MouseEvent) => {
    const rect = boardRef.current?.getBoundingClientRect();
    const offX = rect ? e.clientX - rect.left - fusen.x : 0;
    const offY = rect ? e.clientY - rect.top - fusen.y : 0;
    dragging.current = { id: fusen.id, offX, offY };
    e.preventDefault();
  }, []);

  const startResize = useCallback((fusen: Fusen, e: MouseEvent) => {
    resizing.current = {
      id: fusen.id,
      startX: e.clientX,
      startY: e.clientY,
      w: fusen.width,
      h: fusen.height,
    };
    e.stopPropagation();
    e.preventDefault();
  }, []);

  const fusenDelClick = useCallback((fusen: Fusen) => {
    if (!ws.current) {
      return;
    }
    const msg: Msg = { act: "delete", id: fusen.id };
    ws.current.send(JSON.stringify(msg));
    console.log("send", msg);
  }, []);

  const boardMouseMove = useCallback((e: MouseEvent) => {
    if (!ws.current) return;
    const rect = boardRef.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : 0;
    const y = rect ? e.clientY - rect.top : 0;
    if (dragging.current) {
      const { id, offX, offY } = dragging.current;
      const nx = x - offX;
      const ny = y - offY;
      fusenList.value = fusenList.value.map((f) =>
        f.id === id ? { ...f, x: nx, y: ny } : f
      );
      ws.current.send(
        JSON.stringify({ act: "update", id, x: nx, y: ny }),
      );
    } else if (resizing.current) {
      const { id, startX, startY, w, h } = resizing.current;
      const nw = Math.max(50, w + e.clientX - startX);
      const nh = Math.max(50, h + e.clientY - startY);
      fusenList.value = fusenList.value.map((f) =>
        f.id === id ? { ...f, width: nw, height: nh } : f
      );
      ws.current.send(
        JSON.stringify({ act: "update", id, width: nw, height: nh }),
      );
    }
  }, []);

  const boardMouseUp = useCallback(() => {
    dragging.current = null;
    resizing.current = null;
  }, []);

  return (
    <div
      ref={boardRef}
      class="relative w-full h-screen overflow-auto p-4 bg-gradient-to-br from-yellow-200 via-pink-200 to-purple-300"
      onClick={clickBoard}
      onMouseMove={boardMouseMove}
      onMouseUp={boardMouseUp}
    >
      {fusenList.value.map((fusen) => {
        const color = pickColor(fusen.id);
        return (
          <div
            style={`left:${fusen.x}px;top:${fusen.y}px;width:${fusen.width}px;height:${fusen.height}px;`}
            class={`absolute pt-4 shadow-xl border border-white transform rotate-2 hover:rotate-0 hover:scale-110 transition duration-300 ${color}`}
            onMouseDown={(e) => {
              if (e.target instanceof HTMLTextAreaElement) return;
              startDrag(fusen, e);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <textarea
              data-fusen-id={fusen.id}
              class="w-full h-full bg-transparent resize-none focus:outline-none"
              onInput={(e) => {
                fusenInput(fusen, e.currentTarget.value);
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.currentTarget.focus();
              }}
              value={fusen.txt}
            />
            <div
              class="absolute top-0 right-0 cursor-pointer"
              onClick={(e) => {
                fusenDelClick(fusen);
                e.stopPropagation();
              }}
            >
              ❎
            </div>
            <div
              class="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
              onMouseDown={(e) => startResize(fusen, e)}
            />
          </div>
        );
      })}
    </div>
  );
}
