import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { Fusen, Msg } from "@/types.ts";

export default function Board() {
  const ws = useRef<WebSocket>();
  const [fusenList, setFusenList] = useState<Fusen[]>([]);

  useEffect(() => {
    const SCHEME = new Map();
    SCHEME.set("http:", "ws:");
    SCHEME.set("https:", "wss:");
    const sc = SCHEME.get(location.protocol);
    ws.current = new WebSocket(sc + "//" + location.host + "/ws");
    return () => ws.current?.close();
  }, []);

  useEffect(() => {
    if (!ws.current) {
      return;
    }
    ws.current.onmessage = (e) => {
      const msg = JSON.parse(e.data) as Msg;
      const elem = fusenList.find((fusen) => fusen.id == msg.id);
      if (msg.act == "insert" || msg.act == "update") {
        if (!elem) {
          const fusen = {
            id: msg.id,
            createdAt: msg.createdAt!,
            txt: msg.txt!,
          };
          setFusenList((prev) => [...prev, fusen]);
        } else {
          setFusenList((prev) =>
            prev.map((fusen) => {
              if (fusen.id == msg.id) {
                return {
                  ...fusen,
                  txt: msg.txt!,
                };
              } else {
                return fusen;
              }
            })
          );
        }
      } else if (msg.act == "delete" && elem) {
        setFusenList((prev) => prev.filter((fusen) => fusen.id != elem.id));
      }
    };
  }, [fusenList]);

  const clickBoard = useCallback(() => {
    const id = crypto.randomUUID();
    const msg = { act: "insert", id, txt: "" };
    ws.current!.send(JSON.stringify(msg));
    console.log("send", msg);
  }, []);

  const fusenInput = useCallback((fusen: Fusen, txt: string) => {
    const msg = { act: "update", id: fusen.id, txt };
    ws.current!.send(JSON.stringify(msg));
    console.log("send", msg);
  }, []);

  const fusenDelClick = useCallback((fusen: Fusen) => {
    const msg: Msg = { act: "delete", id: fusen.id };
    ws.current!.send(JSON.stringify(msg));
    console.log("send", msg);
  }, []);

  return (
    <div class="w-full h-screen bg-gray-100" onClick={clickBoard}>
      {fusenList.map((fusen) => (
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
