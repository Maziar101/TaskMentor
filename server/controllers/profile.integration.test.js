import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { app } from "../app.js";
import Users from "../models/User.js";
import { ChatContact, ChatConversation, ChatMessage } from "../modules/chat/chat.model.js";

test("profile avatars persist and are visible to chat contacts", async () => {
  const dbName = `taskmentor_profile_test_${randomUUID().replaceAll("-", "")}`;
  const uri = "mongodb://127.0.0.1:27017";
  let listener;
  let uploadedAvatarPath;

  try {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "isolated-test-secret";
    await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 5000 });
    await Promise.all([ChatConversation.init(), ChatMessage.init(), ChatContact.init()]);
    const [first, second] = await Users.create([
      { username: "profile-test-a", phone: "09120000011" },
      { username: "profile-test-b", phone: "09120000012" },
    ]);
    const tokenFor = (user) => jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    listener = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => listener.once("listening", resolve));
    const origin = `http://127.0.0.1:${listener.address().port}`;
    const request = async (user, route, { body, method = body ? "POST" : "GET", headers } = {}) => {
      const response = await fetch(`${origin}${route}`, {
        method,
        headers: {
          ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
          Authorization: `Bearer ${tokenFor(user)}`,
          ...headers,
        },
        ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}),
      });
      return { status: response.status, data: await response.json() };
    };

    const avatars = await request(first, "/api/profile/avatars");
    assert.equal(avatars.status, 200);
    assert.equal(avatars.data.data.length, 12);
    assert.ok(avatars.data.data.every((avatar) => avatar.url.startsWith("/profiles/") && avatar.url.endsWith(".webp")));

    const selectedAvatar = avatars.data.data[0].url;
    const selected = await request(second, "/api/profile", {
      method: "PATCH",
      body: { avatarUrl: selectedAvatar },
    });
    assert.equal(selected.status, 200);
    assert.equal(selected.data.data.avatarUrl, selectedAvatar);
    assert.equal((await request(second, "/api/profile", {
      method: "PATCH",
      body: { avatarUrl: "/profiles/not-found.webp" },
    })).status, 400);

    const addedContact = await request(first, "/api/chat/contacts", {
      body: { phone: second.phone },
    });
    assert.equal(addedContact.status, 201);
    assert.equal(addedContact.data.contact.avatarUrl, selectedAvatar);

    const opened = await request(first, `/api/chat/contacts/${second.id}/conversation`, { body: {} });
    assert.equal(opened.status, 201);
    assert.equal(opened.data.conversation.avatarUrl, selectedAvatar);
    const chat = await request(first, "/api/chat");
    assert.equal(chat.status, 200);
    assert.equal(chat.data.contacts.find((contact) => contact.id === second.id).avatarUrl, selectedAvatar);
    assert.equal(chat.data.conversations.find((conversation) => conversation.id === opened.data.conversation.id).avatarUrl, selectedAvatar);

    const uploadForm = new FormData();
    uploadForm.append("avatar", new Blob([Buffer.from([0xff, 0xd8, 0xff, 0xd9])], { type: "image/jpeg" }), "avatar.jpg");
    const uploaded = await request(second, "/api/profile/avatar", { body: uploadForm });
    assert.equal(uploaded.status, 200);
    assert.match(uploaded.data.data.avatarUrl, /^\/uploads\/profiles\/[a-f0-9-]+\.jpg$/);
    uploadedAvatarPath = path.resolve("uploads/profiles", path.basename(uploaded.data.data.avatarUrl));

    const publicAvatar = await fetch(new URL(uploaded.data.data.avatarUrl, origin));
    assert.equal(publicAvatar.status, 200);
    assert.equal(publicAvatar.headers.get("content-type"), "image/jpeg");

    const refreshedChat = await request(first, "/api/chat");
    assert.equal(refreshedChat.data.contacts.find((contact) => contact.id === second.id).avatarUrl, uploaded.data.data.avatarUrl);
    assert.equal(refreshedChat.data.conversations.find((conversation) => conversation.id === opened.data.conversation.id).avatarUrl, uploaded.data.data.avatarUrl);
  } finally {
    if (listener) await new Promise((resolve) => listener.close(resolve));
    if (uploadedAvatarPath) await unlink(uploadedAvatarPath).catch(() => {});
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) {
      await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
  }
});
