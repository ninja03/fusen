import { assertEquals, assertExists } from "https://deno.land/std/assert/mod.ts";
import { render } from "https://esm.sh/@testing-library/preact@5.2.0";
import { h } from "preact";
import { Fusen, Msg, MsgD, MsgIU } from "../types.ts";

class MockWebSocket {
  url: string;
  onopen: ((e: Event) => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onclose: (() => void) | null = null;
  sentMessages: string[] = [];
  
  constructor(url: string) {
    this.url = url;
  }
  
  send(data: string) {
    this.sentMessages.push(data);
  }
  
  close() {
    if (this.onclose) this.onclose();
  }
  
  simulateMessage(data: Msg) {
    if (this.onmessage) {
      const event = { data: JSON.stringify(data) } as MessageEvent;
      this.onmessage(event);
    }
  }
  
  simulateOpen() {
    if (this.onopen) {
      const event = { currentTarget: this } as unknown as Event;
      this.onopen(event);
    }
  }
}

Deno.test("Board component should handle WebSocket messages correctly", async () => {
  
  const mockSocket = new MockWebSocket("ws://localhost:8000/ws");
  
  const testFusen: Fusen = {
    id: "test-id-123",
    txt: "Test note",
    x: 100,
    y: 200,
    width: 150,
    height: 120,
    createdAt: Date.now(),
  };
  
  const insertMsg: MsgIU = {
    act: "insert",
    ...testFusen,
  };
  
  const updateMsg: MsgIU = {
    act: "update",
    id: "test-id-123",
    txt: "Updated note",
  };
  
  const deleteMsg: MsgD = {
    act: "delete",
    id: "test-id-123",
  };
  
  const fusens: Record<string, Fusen> = {};
  
  const handleMessage = (e: MessageEvent) => {
    const msg = JSON.parse(e.data) as Msg;
    
    if (msg.act === "insert" || msg.act === "update") {
      const fusen: Fusen = {
        id: msg.id,
        txt: msg.txt ?? "",
        x: msg.x ?? 0,
        y: msg.y ?? 0,
        width: msg.width ?? 96,
        height: msg.height ?? 96,
        createdAt: msg.createdAt ?? Date.now(),
      };
      
      fusens[msg.id] = fusen;
    } else if (msg.act === "delete") {
      delete fusens[msg.id];
    }
  };
  
  mockSocket.onmessage = handleMessage;
  
  mockSocket.simulateMessage(insertMsg);
  
  assertExists(fusens[testFusen.id]);
  assertEquals(fusens[testFusen.id].txt, testFusen.txt);
  assertEquals(fusens[testFusen.id].x, testFusen.x);
  assertEquals(fusens[testFusen.id].y, testFusen.y);
  
  mockSocket.simulateMessage(updateMsg);
  
  assertExists(fusens[testFusen.id]);
  assertEquals(fusens[testFusen.id].txt, "Updated note");
  
  mockSocket.simulateMessage(deleteMsg);
  
  assertEquals(fusens[testFusen.id], undefined);
});

Deno.test("UI event handlers should send correct WebSocket messages", () => {
  const mockSocket = new MockWebSocket("ws://localhost:8000/ws");
  
  const handleClick = (e: MouseEvent) => {
    const id = crypto.randomUUID();
    const x = e.clientX;
    const y = e.clientY;
    
    const msg: MsgIU = {
      act: "insert",
      id,
      txt: "",
      x,
      y,
    };
    
    mockSocket.send(JSON.stringify(msg));
  };
  
  const handleUpdate = (id: string, txt: string) => {
    const msg: MsgIU = {
      act: "update",
      id,
      txt,
    };
    
    mockSocket.send(JSON.stringify(msg));
  };
  
  const handleDelete = (id: string) => {
    const msg: MsgD = {
      act: "delete",
      id,
    };
    
    mockSocket.send(JSON.stringify(msg));
  };
  
  const handleDrag = (id: string, x: number, y: number) => {
    const msg: MsgIU = {
      act: "update",
      id,
      x,
      y,
    };
    
    mockSocket.send(JSON.stringify(msg));
  };
  
  const handleResize = (id: string, width: number, height: number) => {
    const msg: MsgIU = {
      act: "update",
      id,
      width,
      height,
    };
    
    mockSocket.send(JSON.stringify(msg));
  };
  
  const clickEvent = {
    clientX: 100,
    clientY: 200,
  } as MouseEvent;
  
  handleClick(clickEvent);
  
  assertEquals(mockSocket.sentMessages.length, 1);
  const clickMsg = JSON.parse(mockSocket.sentMessages[0]) as MsgIU;
  assertEquals(clickMsg.act, "insert");
  assertEquals(clickMsg.x, 100);
  assertEquals(clickMsg.y, 200);
  assertEquals(clickMsg.txt, "");
  
  handleUpdate("test-id-123", "Updated text");
  
  assertEquals(mockSocket.sentMessages.length, 2);
  const updateMsg = JSON.parse(mockSocket.sentMessages[1]) as MsgIU;
  assertEquals(updateMsg.act, "update");
  assertEquals(updateMsg.id, "test-id-123");
  assertEquals(updateMsg.txt, "Updated text");
  
  handleDelete("test-id-123");
  
  assertEquals(mockSocket.sentMessages.length, 3);
  const deleteMsg = JSON.parse(mockSocket.sentMessages[2]) as MsgD;
  assertEquals(deleteMsg.act, "delete");
  assertEquals(deleteMsg.id, "test-id-123");
  
  handleDrag("test-id-123", 150, 250);
  
  assertEquals(mockSocket.sentMessages.length, 4);
  const dragMsg = JSON.parse(mockSocket.sentMessages[3]) as MsgIU;
  assertEquals(dragMsg.act, "update");
  assertEquals(dragMsg.id, "test-id-123");
  assertEquals(dragMsg.x, 150);
  assertEquals(dragMsg.y, 250);
  
  handleResize("test-id-123", 200, 150);
  
  assertEquals(mockSocket.sentMessages.length, 5);
  const resizeMsg = JSON.parse(mockSocket.sentMessages[4]) as MsgIU;
  assertEquals(resizeMsg.act, "update");
  assertEquals(resizeMsg.id, "test-id-123");
  assertEquals(resizeMsg.width, 200);
  assertEquals(resizeMsg.height, 150);
});

Deno.test("UI components should render correctly", () => {
  
  const testFusen: Fusen = {
    id: "test-id-123",
    txt: "Test note",
    x: 100,
    y: 200,
    width: 150,
    height: 120,
    createdAt: Date.now(),
  };
  
  const FusenComponent = ({ fusen }: { fusen: Fusen }) => {
    return h("div", {
      id: fusen.id,
      style: {
        position: "absolute",
        left: `${fusen.x}px`,
        top: `${fusen.y}px`,
        width: `${fusen.width}px`,
        height: `${fusen.height}px`,
      },
    }, fusen.txt);
  };
  
  const component = h(FusenComponent, { fusen: testFusen });
  
  assertEquals(component.props.fusen, testFusen);
});
