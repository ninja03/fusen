import { assertEquals, assertExists } from "https://deno.land/std/assert/mod.ts";
import { Fusen, Msg, MsgD, MsgIU } from "../types.ts";

Deno.test("Fusen object should be created with correct properties", () => {
  const id = "test-id-123";
  const txt = "Test note";
  const x = 100;
  const y = 200;
  const width = 150;
  const height = 120;
  const createdAt = Date.now();
  
  const fusen: Fusen = {
    id,
    txt,
    x,
    y,
    width,
    height,
    createdAt,
  };
  
  assertEquals(fusen.id, id);
  assertEquals(fusen.txt, txt);
  assertEquals(fusen.x, x);
  assertEquals(fusen.y, y);
  assertEquals(fusen.width, width);
  assertEquals(fusen.height, height);
  assertEquals(fusen.createdAt, createdAt);
});

Deno.test("Insert message should be parsed correctly", () => {
  const msg: MsgIU = {
    act: "insert",
    id: "test-id-123",
    txt: "Test note",
    x: 100,
    y: 200,
    width: 150,
    height: 120,
  };
  
  assertEquals(msg.act, "insert");
  assertEquals(msg.id, "test-id-123");
  assertEquals(msg.txt, "Test note");
  assertEquals(msg.x, 100);
  assertEquals(msg.y, 200);
  assertEquals(msg.width, 150);
  assertEquals(msg.height, 120);
});

Deno.test("Update message should be parsed correctly", () => {
  const msg: MsgIU = {
    act: "update",
    id: "test-id-123",
    txt: "Updated note",
    x: 150,
    y: 250,
  };
  
  assertEquals(msg.act, "update");
  assertEquals(msg.id, "test-id-123");
  assertEquals(msg.txt, "Updated note");
  assertEquals(msg.x, 150);
  assertEquals(msg.y, 250);
  assertEquals(msg.width, undefined);
  assertEquals(msg.height, undefined);
});

Deno.test("Delete message should be parsed correctly", () => {
  const msg: MsgD = {
    act: "delete",
    id: "test-id-123",
  };
  
  assertEquals(msg.act, "delete");
  assertEquals(msg.id, "test-id-123");
});

Deno.test("Message type should be correctly discriminated", () => {
  const insertMsg: Msg = {
    act: "insert",
    id: "test-id-123",
    txt: "Test note",
    x: 100,
    y: 200,
  };
  
  const updateMsg: Msg = {
    act: "update",
    id: "test-id-123",
    txt: "Updated note",
  };
  
  const deleteMsg: Msg = {
    act: "delete",
    id: "test-id-123",
  };
  
  if (insertMsg.act === "insert") {
    assertEquals(insertMsg.txt, "Test note");
    assertEquals(insertMsg.x, 100);
    assertEquals(insertMsg.y, 200);
  } else {
    assertEquals(true, false, "Insert message not recognized correctly");
  }
  
  if (updateMsg.act === "update") {
    assertEquals(updateMsg.txt, "Updated note");
  } else {
    assertEquals(true, false, "Update message not recognized correctly");
  }
  
  if (deleteMsg.act === "delete") {
    assertEquals(deleteMsg.id, "test-id-123");
  } else {
    assertEquals(true, false, "Delete message not recognized correctly");
  }
});

Deno.test("Fusen object should be correctly serialized and deserialized", () => {
  const fusen: Fusen = {
    id: "test-id-123",
    txt: "Test note",
    x: 100,
    y: 200,
    width: 150,
    height: 120,
    createdAt: 1620000000000,
  };
  
  const json = JSON.stringify(fusen);
  
  const deserializedFusen = JSON.parse(json) as Fusen;
  
  assertEquals(deserializedFusen.id, fusen.id);
  assertEquals(deserializedFusen.txt, fusen.txt);
  assertEquals(deserializedFusen.x, fusen.x);
  assertEquals(deserializedFusen.y, fusen.y);
  assertEquals(deserializedFusen.width, fusen.width);
  assertEquals(deserializedFusen.height, fusen.height);
  assertEquals(deserializedFusen.createdAt, fusen.createdAt);
});

Deno.test("Message should be correctly serialized and deserialized", () => {
  const insertMsg: MsgIU = {
    act: "insert",
    id: "test-id-123",
    txt: "Test note",
    x: 100,
    y: 200,
    width: 150,
    height: 120,
  };
  
  const json = JSON.stringify(insertMsg);
  
  const deserializedMsg = JSON.parse(json) as MsgIU;
  
  assertEquals(deserializedMsg.act, insertMsg.act);
  assertEquals(deserializedMsg.id, insertMsg.id);
  assertEquals(deserializedMsg.txt, insertMsg.txt);
  assertEquals(deserializedMsg.x, insertMsg.x);
  assertEquals(deserializedMsg.y, insertMsg.y);
  assertEquals(deserializedMsg.width, insertMsg.width);
  assertEquals(deserializedMsg.height, insertMsg.height);
});

Deno.test("Partial updates should only modify specified properties", () => {
  const fusen: Fusen = {
    id: "test-id-123",
    txt: "Initial text",
    x: 100,
    y: 200,
    width: 150,
    height: 120,
    createdAt: Date.now(),
  };
  
  const updateMsg: MsgIU = {
    act: "update",
    id: "test-id-123",
    txt: "Updated text",
    x: 150,
  };
  
  if (updateMsg.txt !== undefined) fusen.txt = updateMsg.txt;
  if (updateMsg.x !== undefined) fusen.x = updateMsg.x;
  if (updateMsg.y !== undefined) fusen.y = updateMsg.y;
  if (updateMsg.width !== undefined) fusen.width = updateMsg.width;
  if (updateMsg.height !== undefined) fusen.height = updateMsg.height;
  
  assertEquals(fusen.txt, "Updated text");
  assertEquals(fusen.x, 150);
  assertEquals(fusen.y, 200); // Should remain unchanged
  assertEquals(fusen.width, 150); // Should remain unchanged
  assertEquals(fusen.height, 120); // Should remain unchanged
});
