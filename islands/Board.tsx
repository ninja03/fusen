import { useCallback, useEffect, useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { Fusen, Msg } from "@/types.ts";

export default function Board() {
  const ws = useRef<WebSocket>();
  const fusenList = useSignal<Fusen[]>([]);

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
          fusenList.value = [...fusenList.value, msg];
        } else {
          fusenList.value = fusenList.value.map((fusen) => {
            if (fusen.id == msg.id) {
              return msg;
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

  const clickBoard = useCallback(() => {
    if (!ws.current) {
      return;
    }
    const id = crypto.randomUUID();
    const msg = { act: "insert", id, txt: "" };
    ws.current.send(JSON.stringify(msg));
    console.log("send", msg);
  }, []);

  const fusenInput = useCallback((fusen: Fusen, txt: string) => {
    if (!ws.current) {
      return;
    }
    const msg = { act: "update", id: fusen.id, txt };
    ws.current.send(JSON.stringify(msg));
    console.log("send", msg);
  }, []);

  const fusenDelClick = useCallback((fusen: Fusen) => {
    if (!ws.current) {
      return;
    }
    const msg: Msg = { act: "delete", id: fusen.id };
    ws.current.send(JSON.stringify(msg));
    console.log("send", msg);
  }, []);

  return (
    <div class="w-full h-screen bg-gray-100" onClick={clickBoard}>
      {fusenList.value.map((fusen) => (
        <div
          class="w-24 h-24 bg-yellow-100 pt-4 m-4 relative float-left shadow-md"
          onClick={(e) => e.stopPropagation()}
        >
          <textarea
            class="w-24 h-20 bg-transparent resize-none"
            onInput={(e) => {
              fusenInput(fusen, e.currentTarget.value);
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {fusen.txt}
          </textarea>
          <div
            class="absolute top-0 right-0 cursor-pointer"
            onClick={(e) => {
              fusenDelClick(fusen);
              e.stopPropagation();
            }}
          >
            ❎
          </div>
        </div>
      ))}
    </div>
  );
}
