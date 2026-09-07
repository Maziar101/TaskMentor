import { test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { app } from "../../app.js";
import Users from "../../models/User.js";
import { ChatConversation, ChatMessage } from "./chat.model.js";

test("chat persists in MongoDB, isolates users, and deduplicates retries", async () => {
  const dbName = `taskmentor_chat_test_${randomUUID().replaceAll("-", "")}`;
  const uri = "mongodb://127.0.0.1:27017";
  let listener;
  try {
    await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 5000 });
    await Promise.all([ChatConversation.init(), ChatMessage.init()]);
    const [first, second] = await Users.create([{ username: "chat-test-a" }, { username: "chat-test-b" }]);
    const tokenFor = (user) => jwt.sign({ id: user.id }, process.env.JWT_SECRET || "isolated-test-secret");
    process.env.JWT_SECRET = process.env.JWT_SECRET || "isolated-test-secret";
    listener = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => listener.once("listening", resolve));
    const base = `http://127.0.0.1:${listener.address().port}/api/chat`;
    const request = async (user, path = "", body, method) => {
      const response = await fetch(base + path, {
        method: method || (body ? "POST" : "GET"),
        headers: { "Content-Type": "application/json", ...(user ? { Authorization: `Bearer ${tokenFor(user)}` } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return { status: response.status, data: await response.json() };
    };
    assert.equal((await request(null)).status, 401);
    const visits = await Promise.all([request(first), request(first)]);
    for (const visit of visits) {
      assert.equal(visit.status, 200);
      assert.deepEqual(visit.data.conversations.map((item) => item.id), ["saved"]);
      assert.deepEqual(visit.data.messages, []);
    }
    const payload = { id: randomUUID(), text: "پیام ماندگار", userId: second.id };
    const sends = await Promise.all([
      request(first, "/saved/messages", payload), request(first, "/saved/messages", payload),
    ]);
    assert.ok(sends.every((item) => item.status === 201));
    assert.equal(await ChatMessage.countDocuments({ userId: first._id }), 1);
    const replyPayload = { id: randomUUID(), text: "پاسخ", replyToId: payload.id };
    const reply = await request(first, "/saved/messages", replyPayload);
    assert.equal(reply.status, 201);
    assert.equal(reply.data.message.replyToId, payload.id);
    assert.equal((await request(second, "/saved/messages", { ...replyPayload, id: randomUUID() })).status, 404);
    assert.equal((await request(first, `/saved/messages/${payload.id}`, { text: "پیام ویرایش‌شده" }, "PATCH")).status, 200);
    const pinMessage = await request(first, `/saved/messages/${payload.id}`, { pinned: true }, "PATCH");
    assert.equal(pinMessage.status, 200);
    assert.equal(pinMessage.data.message.pinned, true);
    assert.equal(pinMessage.data.message.edited, true);
    assert.equal((await request(first, `/saved/messages/${payload.id}`, { pinned: "yes" }, "PATCH")).status, 400);
    assert.equal((await request(second, `/saved/messages/${payload.id}`, undefined, "DELETE")).status, 404);
    assert.equal((await request(first, `/saved/messages/${replyPayload.id}`, undefined, "DELETE")).status, 200);
    assert.equal((await request(first, "/saved/messages", { id: randomUUID(), text: "  " })).status, 400);
    assert.equal((await request(first, "/saved/messages", { id: randomUUID(), text: "x".repeat(10001) })).status, 400);
    const conversationId = randomUUID();
    assert.equal((await request(first, "/conversations", { id: conversationId, name: "گفتگوی تست" })).status, 201);
    assert.equal((await request(second, `/${conversationId}/messages`, { id: randomUUID(), text: "denied" })).status, 404);
    const other = await request(second);
    assert.deepEqual(other.data.messages, []);
    assert.deepEqual(other.data.conversations.map((item) => item.id), ["saved"]);
    // Reconnect to prove data survives outside the request/process connection state.
    await mongoose.disconnect();
    await mongoose.connect(uri, { dbName });
    const restored = await request(first);
    assert.equal(restored.data.messages.length, 1);
    assert.equal(restored.data.messages[0].text, "پیام ویرایش‌شده");
    assert.equal(restored.data.messages[0].pinned, true);
    assert.equal(restored.data.conversations.length, 2);
    assert.equal((await request(second, `/${conversationId}`, { pinned: true }, "PATCH")).status, 404);
    assert.equal((await request(first, `/${conversationId}`, { pinned: "yes" }, "PATCH")).status, 400);
    assert.equal((await request(first, `/${conversationId}`, { pinned: true, muted: true, archived: true }, "PATCH")).status, 200);
    const preferences = (await request(first)).data.conversations.find((item) => item.id === conversationId);
    assert.equal(preferences.pinned, true);
    assert.equal(preferences.muted, true);
    assert.equal(preferences.archived, true);
    const conversationMessage = { id: randomUUID(), text: "پیامی برای پاک شدن" };
    assert.equal((await request(first, `/${conversationId}/messages`, conversationMessage)).status, 201);
    const historyClear = await request(first, `/${conversationId}/history`, undefined, "DELETE");
    assert.equal(historyClear.status, 200);
    assert.equal(historyClear.data.cleared, true);
    const afterHistoryClear = await request(first);
    assert.equal(afterHistoryClear.data.conversations.length, 2);
    assert.equal(afterHistoryClear.data.messages.some((item) => item.text === conversationMessage.text), false);
    assert.equal(await ChatMessage.countDocuments({ userId: first._id, conversationKey: conversationId }), 0);
    assert.equal((await request(second, `/${conversationId}`, undefined, "DELETE")).status, 404);
    assert.equal((await request(first, `/${conversationId}`, undefined, "DELETE")).status, 200);
    assert.equal((await request(first)).data.conversations.length, 1);
    assert.equal((await request(first, `/${conversationId}/messages`, { id: randomUUID(), text: "deleted" })).status, 404);
    assert.equal((await request(first, "/saved", undefined, "DELETE")).status, 403);
    const savedClear = await request(first, "/saved/history", undefined, "DELETE");
    assert.equal(savedClear.status, 200);
    assert.equal(savedClear.data.cleared, true);
    assert.equal(await ChatMessage.countDocuments({ userId: first._id, conversationKey: "saved" }), 0);
    const cleared = await request(first);
    assert.deepEqual(cleared.data.messages, []);
    assert.deepEqual(cleared.data.conversations.map((item) => item.id), ["saved"]);
    assert.equal((await request(first, "/saved/messages", { id: randomUUID(), text: "after clearing" })).status, 201);
    assert.equal((await request(first)).data.messages.length, 1);
  } finally {
    if (listener) await new Promise((resolve) => listener.close(resolve));
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) {
      await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
  }
});
