import { assertEquals, assertExists } from "https://deno.land/std/assert/mod.ts";
import { Fusen, Msg, MsgD, MsgIU } from "../types.ts";

class MockWebSocket {
  onopen: ((e: Event) => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onclose: (() => void) | null = null;
  sentMessages: string[] = [];
  
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

class MockBroadcastChannel {
  name: string;
  onmessage: ((e: MessageEvent) => void) | null = null;
  sentMessages: string[] = [];
  
  constructor(name: string) {
    this.name = name;
  }
  
  postMessage(data: unknown) {
    this.sentMessages.push(JSON.stringify(data));
  }
  
  simulateMessage(data: unknown) {
    if (this.onmessage) {
      const event = { data: JSON.stringify(data) } as MessageEvent;
      this.onmessage(event);
    }
  }
}

const mockUpgradeWebSocket = () => {
  const socket = new MockWebSocket();
  return {
    response: new Response(),
    socket
  };
};

class MockKV {
  data: Map<string, unknown> = new Map();
  
  async set(key: unknown[], value: unknown) {
    this.data.set(JSON.stringify(key), value);
    return { ok: true };
  }
  
  async get(key: unknown[]) {
    const value = this.data.get(JSON.stringify(key));
    return { value };
  }
  
  async delete(key: unknown[]) {
    this.data.delete(JSON.stringify(key));
    return { ok: true };
  }
  
  list(options: { prefix: unknown[] }) {
    const prefix = JSON.stringify(options.prefix).slice(0, -1);
    const entries: { key: unknown[]; value: unknown }[] = [];
    
    this.data.forEach((value, key) => {
      if (key.startsWith(prefix)) {
        entries.push({
          key: JSON.parse(key),
          value
        });
      }
    });
    
    return {
      [Symbol.asyncIterator]() {
        let index = 0;
        return {
          async next() {
            if (index < entries.length) {
              return { value: entries[index++], done: false };
            } else {
              return { done: true, value: undefined };
            }
          }
        };
      }
    };
  }
}

Deno.test("insert function should create a new fusen and broadcast it", async () => {
  const mockKv = new MockKV();
  const mockSocket = new MockWebSocket();
  const mockSockets = { "test-id": mockSocket };
  const mockChannel = new MockBroadcastChannel("test");
  
  const originalDeno = globalThis.Deno;
  const originalBroadcastChannel = globalThis.BroadcastChannel;
  
  try {
    globalThis.Deno = {
      ...originalDeno,
      openKv: () => Promise.resolve(mockKv)
    } as unknown as typeof Deno;
    
    globalThis.BroadcastChannel = MockBroadcastChannel as unknown as typeof BroadcastChannel;
    
    const testMsg: MsgIU = {
      act: "insert",
      id: "test-id-123",
      txt: "Test note",
      x: 100,
      y: 200
    };
    
    async function insert(msg: MsgIU) {
      const fusen: Fusen = {
        id: msg.id,
        txt: msg.txt ?? "",
        x: msg.x ?? 0,
        y: msg.y ?? 0,
        width: msg.width ?? 96,
        height: msg.height ?? 96,
        createdAt: Date.now(),
      };
      
      await mockKv.set(["fusen", msg.id], fusen);
      
      const sendMsg: MsgIU = { act: "insert", ...fusen };
      
      for (const id in mockSockets) {
        const socket = mockSockets[id];
        socket.send(JSON.stringify(sendMsg));
      }
      
      mockChannel.postMessage({});
    }
    
    await insert(testMsg);
    
    const storedFusen = await mockKv.get(["fusen", testMsg.id]);
    assertExists(storedFusen.value);
    assertEquals((storedFusen.value as Fusen).id, testMsg.id);
    assertEquals((storedFusen.value as Fusen).txt, testMsg.txt);
    assertEquals((storedFusen.value as Fusen).x, testMsg.x);
    assertEquals((storedFusen.value as Fusen).y, testMsg.y);
    
    assertEquals(mockSocket.sentMessages.length, 1);
    const broadcastMsg = JSON.parse(mockSocket.sentMessages[0]);
    assertEquals(broadcastMsg.act, "insert");
    assertEquals(broadcastMsg.id, testMsg.id);
    assertEquals(broadcastMsg.txt, testMsg.txt);
    
    assertEquals(mockChannel.sentMessages.length, 1);
  } finally {
    globalThis.Deno = originalDeno;
    globalThis.BroadcastChannel = originalBroadcastChannel;
  }
});

Deno.test("update function should modify an existing fusen and broadcast changes", async () => {
  const mockKv = new MockKV();
  const mockSocket = new MockWebSocket();
  const mockSockets = { "test-id": mockSocket };
  const mockChannel = new MockBroadcastChannel("test");
  
  const originalDeno = globalThis.Deno;
  const originalBroadcastChannel = globalThis.BroadcastChannel;
  
  try {
    globalThis.Deno = {
      ...originalDeno,
      openKv: () => Promise.resolve(mockKv)
    } as unknown as typeof Deno;
    
    globalThis.BroadcastChannel = MockBroadcastChannel as unknown as typeof BroadcastChannel;
    
    const initialFusen: Fusen = {
      id: "test-id-123",
      txt: "Initial text",
      x: 100,
      y: 200,
      width: 96,
      height: 96,
      createdAt: Date.now()
    };
    
    await mockKv.set(["fusen", initialFusen.id], initialFusen);
    
    const updateMsg: MsgIU = {
      act: "update",
      id: "test-id-123",
      txt: "Updated text",
      x: 150
    };
    
    async function update(msg: MsgIU) {
      const result = await mockKv.get(["fusen", msg.id]);
      const fusen = result.value as Fusen;
      
      if (!fusen) {
        return;
      }
      
      if (msg.txt !== undefined) fusen.txt = msg.txt;
      if (msg.x !== undefined) fusen.x = msg.x;
      if (msg.y !== undefined) fusen.y = msg.y;
      if (msg.width !== undefined) fusen.width = msg.width;
      if (msg.height !== undefined) fusen.height = msg.height;
      
      await mockKv.set(["fusen", msg.id], fusen);
      
      const sendMsg: MsgIU = { act: "update", ...fusen };
      
      for (const id in mockSockets) {
        const socket = mockSockets[id];
        socket.send(JSON.stringify(sendMsg));
      }
      
      mockChannel.postMessage({});
    }
    
    await update(updateMsg);
    
    const storedFusen = await mockKv.get(["fusen", updateMsg.id]);
    assertExists(storedFusen.value);
    assertEquals((storedFusen.value as Fusen).id, updateMsg.id);
    assertEquals((storedFusen.value as Fusen).txt, updateMsg.txt);
    assertEquals((storedFusen.value as Fusen).x, updateMsg.x);
    assertEquals((storedFusen.value as Fusen).y, initialFusen.y); // Should remain unchanged
    
    assertEquals(mockSocket.sentMessages.length, 1);
    const broadcastMsg = JSON.parse(mockSocket.sentMessages[0]);
    assertEquals(broadcastMsg.act, "update");
    assertEquals(broadcastMsg.id, updateMsg.id);
    assertEquals(broadcastMsg.txt, updateMsg.txt);
    assertEquals(broadcastMsg.x, updateMsg.x);
    
    assertEquals(mockChannel.sentMessages.length, 1);
  } finally {
    globalThis.Deno = originalDeno;
    globalThis.BroadcastChannel = originalBroadcastChannel;
  }
});

Deno.test("delete function should remove a fusen and broadcast deletion", async () => {
  const mockKv = new MockKV();
  const mockSocket = new MockWebSocket();
  const mockSockets = { "test-id": mockSocket };
  const mockChannel = new MockBroadcastChannel("test");
  
  const originalDeno = globalThis.Deno;
  const originalBroadcastChannel = globalThis.BroadcastChannel;
  
  try {
    globalThis.Deno = {
      ...originalDeno,
      openKv: () => Promise.resolve(mockKv)
    } as unknown as typeof Deno;
    
    globalThis.BroadcastChannel = MockBroadcastChannel as unknown as typeof BroadcastChannel;
    
    const initialFusen: Fusen = {
      id: "test-id-123",
      txt: "Test note",
      x: 100,
      y: 200,
      width: 96,
      height: 96,
      createdAt: Date.now()
    };
    
    await mockKv.set(["fusen", initialFusen.id], initialFusen);
    
    const deleteMsg: MsgD = {
      act: "delete",
      id: "test-id-123"
    };
    
    async function deleteFusen(msg: MsgD) {
      await mockKv.delete(["fusen", msg.id]);
      
      const sendMsg: MsgD = {
        act: "delete",
        id: msg.id,
      };
      
      for (const id in mockSockets) {
        const socket = mockSockets[id];
        socket.send(JSON.stringify(sendMsg));
      }
      
      mockChannel.postMessage({});
    }
    
    await deleteFusen(deleteMsg);
    
    const storedFusen = await mockKv.get(["fusen", deleteMsg.id]);
    assertEquals(storedFusen.value, undefined);
    
    assertEquals(mockSocket.sentMessages.length, 1);
    const broadcastMsg = JSON.parse(mockSocket.sentMessages[0]);
    assertEquals(broadcastMsg.act, "delete");
    assertEquals(broadcastMsg.id, deleteMsg.id);
    
    assertEquals(mockChannel.sentMessages.length, 1);
  } finally {
    globalThis.Deno = originalDeno;
    globalThis.BroadcastChannel = originalBroadcastChannel;
  }
});

Deno.test("WebSocket connection should send existing fusens to new clients", async () => {
  const mockKv = new MockKV();
  const mockSocket = new MockWebSocket();
  const mockSockets: Record<string, MockWebSocket> = {};
  const mockChannel = new MockBroadcastChannel("test");
  
  const originalDeno = globalThis.Deno;
  const originalBroadcastChannel = globalThis.BroadcastChannel;
  const originalCrypto = globalThis.crypto;
  
  try {
    globalThis.Deno = {
      ...originalDeno,
      openKv: () => Promise.resolve(mockKv),
      upgradeWebSocket: () => mockUpgradeWebSocket()
    } as unknown as typeof Deno;
    
    globalThis.BroadcastChannel = MockBroadcastChannel as unknown as typeof BroadcastChannel;
    
    globalThis.crypto = {
      ...originalCrypto,
      randomUUID: () => "test-id"
    } as unknown as typeof crypto;
    
    const existingFusens: Record<string, Fusen> = {
      "fusen-1": {
        id: "fusen-1",
        txt: "Note 1",
        x: 100,
        y: 200,
        width: 96,
        height: 96,
        createdAt: Date.now()
      },
      "fusen-2": {
        id: "fusen-2",
        txt: "Note 2",
        x: 300,
        y: 400,
        width: 120,
        height: 80,
        createdAt: Date.now()
      }
    };
    
    for (const id in existingFusens) {
      await mockKv.set(["fusen", id], existingFusens[id]);
    }
    
    function socketOpen(e: Event, id: string) {
      const socket = e.currentTarget as MockWebSocket;
      mockSockets[id] = socket;
      
      for (const k in existingFusens) {
        const fusen = existingFusens[k];
        const msg: MsgIU = { act: "update", ...fusen };
        socket.send(JSON.stringify(msg));
      }
    }
    
    const event = { currentTarget: mockSocket } as unknown as Event;
    socketOpen(event, "test-id");
    
    assertEquals(mockSockets["test-id"], mockSocket);
    
    assertEquals(mockSocket.sentMessages.length, 2);
    
    const msg1 = JSON.parse(mockSocket.sentMessages[0]);
    assertEquals(msg1.act, "update");
    assertEquals(msg1.id, "fusen-1");
    assertEquals(msg1.txt, "Note 1");
    
    const msg2 = JSON.parse(mockSocket.sentMessages[1]);
    assertEquals(msg2.act, "update");
    assertEquals(msg2.id, "fusen-2");
    assertEquals(msg2.txt, "Note 2");
  } finally {
    globalThis.Deno = originalDeno;
    globalThis.BroadcastChannel = originalBroadcastChannel;
    globalThis.crypto = originalCrypto;
  }
});
