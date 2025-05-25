import { useCallback, useEffect, useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { Fusen, Msg } from "@/types.ts";

const COLORS = [
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
  return COLORS[n % COLORS.length];
};

function send(ws: WebSocket | undefined, msg: Msg) {
  if (!ws) return;
  ws.send(JSON.stringify(msg));
  console.log("send", msg);
}

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

  const handleMessage = useCallback(
    (msg: Msg) => {
      const elem = fusenList.value.find((fusen) => fusen.id === msg.id);
      if (msg.act === "insert" || msg.act === "update") {
        if (!elem) {
          fusenList.value = [...fusenList.value, msg as Fusen];
        } else {
          fusenList.value = fusenList.value.map((fusen) =>
            fusen.id === msg.id ? { ...fusen, ...(msg as Fusen) } : fusen
          );
        }
      } else if (msg.act === "delete" && elem) {
        fusenList.value = fusenList.value.filter((fusen) => fusen.id !== elem.id);
      }
    },
    [],
  );

  useEffect(() => {
    const scheme = location.protocol === "https:" ? "wss" : "ws";
    ws.current = new WebSocket(`${scheme}://${location.host}/ws`);
    ws.current.onmessage = (e) => handleMessage(JSON.parse(e.data));
    return () => ws.current?.close();
  }, [handleMessage]);

  const clickBoard = useCallback((e: MouseEvent) => {
    if (!ws.current) {
      return;
    }
    const rect = boardRef.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : 0;
    const y = rect ? e.clientY - rect.top : 0;
    const id = crypto.randomUUID();
    const msg = { act: "insert", id, txt: "", x, y, width: 160, height: 100 };
    send(ws.current, msg);
    
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
    send(ws.current, msg);
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
    send(ws.current, msg);
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
      send(ws.current, { act: "update", id, x: nx, y: ny });
    } else if (resizing.current) {
      const { id, startX, startY, w, h } = resizing.current;
      const nw = Math.max(50, w + e.clientX - startX);
      const nh = Math.max(50, h + e.clientY - startY);
      fusenList.value = fusenList.value.map((f) =>
        f.id === id ? { ...f, width: nw, height: nh } : f
      );
      send(ws.current, { act: "update", id, width: nw, height: nh });
    }
  }, []);

  const boardMouseUp = useCallback(() => {
    dragging.current = null;
    resizing.current = null;
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textareas = Array.from(document.querySelectorAll('textarea[data-fusen-id]')) as HTMLTextAreaElement[];
      const currentIndex = textareas.findIndex(textarea => textarea === document.activeElement);
      
      if (textareas.length > 0) {
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % textareas.length;
        textareas[nextIndex].focus();
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      ref={boardRef}
      class="relative w-full overflow-auto p-4 bg-gradient-to-br from-yellow-200 via-pink-200 to-purple-300"
      style="height: calc(100vh - 64px);"
      onClick={clickBoard}
      onMouseMove={boardMouseMove}
      onMouseUp={boardMouseUp}
    >
      {fusenList.value.length === 0 && (
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="bg-white bg-opacity-90 rounded-2xl p-8 shadow-2xl text-center max-w-md">
            <div class="text-6xl mb-4">📝</div>
            <h2 class="text-2xl font-bold text-gray-800 mb-4">ようこそ！</h2>
            <p class="text-gray-600 mb-6">
              ボード上の好きな場所をクリックして<br />
              付箋を作成してみましょう！
            </p>
            <div class="text-sm text-gray-500">
              <p class="mb-2">💡 付箋はドラッグで移動できます</p>
              <p class="mb-2">📏 右下角でサイズ変更可能</p>
              <p>🌐 変更はリアルタイムで共有されます</p>
            </div>
          </div>
        </div>
      )}
      
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
              class="w-full h-full bg-transparent resize-none focus:outline-none p-2 text-sm"
              placeholder="ここに入力..."
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
              class="absolute top-1 right-1 cursor-pointer text-gray-600 hover:text-red-600 transition-colors"
              onClick={(e) => {
                fusenDelClick(fusen);
                e.stopPropagation();
              }}
            >
              ❎
            </div>
            <div
              class="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-400 bg-opacity-50 hover:bg-opacity-75 transition-all"
              onMouseDown={(e) => startResize(fusen, e)}
            />
          </div>
        );
      })}
      
      <div class="fixed bottom-6 right-6 z-50">
        <a 
          href="/help"
          class="bg-gradient-to-r from-yellow-400 to-pink-400 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center"
          title="ヘルプを見る"
        >
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path>
          </svg>
        </a>
      </div>
    </div>
  );
}
