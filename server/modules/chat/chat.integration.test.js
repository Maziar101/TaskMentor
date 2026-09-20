import { test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { app } from "../../app.js";
import Users from "../../models/User.js";
import ScheduledItem from "../../models/ScheduledItem.js";
import { ChatBlock, ChatContact, ChatConversation, ChatGroup, ChatMessage, TaskForward } from "./chat.model.js";

test("chat persists in MongoDB, isolates users, and deduplicates retries", async () => {
  const dbName = `taskmentor_chat_test_${randomUUID().replaceAll("-", "")}`;
  const uri = "mongodb://127.0.0.1:27017";
  let listener;
  let uploadedImagePath;
  let uploadedGroupImagePath;
  try {
    await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 5000 });
    await Promise.all([
      ChatConversation.init(),
      ChatMessage.init(),
      ChatContact.init(),
      ChatBlock.init(),
      ChatGroup.init(),
      TaskForward.init(),
      ScheduledItem.init(),
    ]);
    const [first, second, third] = await Users.create([
      { username: "chat-test-a", phone: "09120000001" },
      { username: "chat-test-b", phone: "09120000002" },
      { username: "chat-test-c", phone: "09120000003" },
    ]);
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
    const savedReaction = await request(first, `/saved/messages/${payload.id}`, { reaction: "🔥" }, "PATCH");
    assert.equal(savedReaction.status, 200);
    assert.equal(savedReaction.data.message.myReaction, "🔥");
    assert.deepEqual(savedReaction.data.message.reactions, [{ emoji: "🔥", count: 1 }]);
    assert.equal((await request(first, `/saved/messages/${payload.id}`, { reaction: "invalid" }, "PATCH")).status, 400);
    const removedReaction = await request(first, `/saved/messages/${payload.id}`, { reaction: null }, "PATCH");
    assert.equal(removedReaction.status, 200);
    assert.equal(removedReaction.data.message.myReaction, null);
    assert.deepEqual(removedReaction.data.message.reactions, []);
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
    const imageForm = new FormData();
    imageForm.append("image", new Blob([Buffer.from([0xff, 0xd8, 0xff, 0xd9])], { type: "image/jpeg" }), "preview.jpg");
    const imageUpload = await fetch(`${base}/uploads/images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenFor(first)}` },
      body: imageForm,
    });
    assert.equal(imageUpload.status, 201);
    const uploaded = await imageUpload.json();
    uploadedImagePath = path.resolve("uploads/chat", path.basename(uploaded.image.url));
    const publicImage = await fetch(new URL(uploaded.image.url, base));
    assert.equal(publicImage.status, 200);
    assert.equal(publicImage.headers.get("content-type"), "image/jpeg");
    const imageMessage = await request(first, "/saved/messages", {
      id: randomUUID(),
      type: "file",
      fileName: "preview.jpg",
      fileMeta: "4 KB",
      imageUrl: uploaded.image.url,
      imageMime: uploaded.image.mime,
    });
    assert.equal(imageMessage.status, 201);
    assert.equal(imageMessage.data.message.imageUrl, uploaded.image.url);
    assert.equal(imageMessage.data.message.imageMime, "image/jpeg");
    assert.equal((await request(first, "/contacts", { phone: "0912" })).status, 400);
    assert.equal((await request(first, "/contacts", { phone: "09129999999" })).status, 404);
    assert.equal((await request(first, "/contacts", { phone: first.phone })).status, 400);
    const addedContact = await request(first, "/contacts", { phone: "۰۹۱۲۰۰۰۰۰۰۲" });
    assert.equal(addedContact.status, 201);
    assert.equal(addedContact.data.contact.id, second.id);
    assert.equal((await request(first, "/contacts", { phone: second.phone })).status, 409);
    assert.equal((await request(first, "/groups", {
      name: "گروه نامعتبر",
      memberIds: [third.id],
    })).status, 403);
    const groupForm = new FormData();
    groupForm.append("name", "گروه پروژه");
    groupForm.append("memberIds", JSON.stringify([second.id]));
    groupForm.append("image", new Blob([Buffer.from([0xff, 0xd8, 0xff, 0xd9])], {
      type: "image/jpeg",
    }), "group.jpg");
    const groupResponse = await fetch(`${base}/groups`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenFor(first)}` },
      body: groupForm,
    });
    const createdGroup = await groupResponse.json();
    assert.equal(groupResponse.status, 201);
    assert.equal(createdGroup.conversation.isGroup, true);
    assert.equal(createdGroup.conversation.memberCount, 2);
    assert.match(createdGroup.conversation.avatarUrl, /^\/uploads\/chat\/[a-f0-9-]+\.jpg$/);
    uploadedGroupImagePath = path.resolve("uploads/chat", path.basename(createdGroup.conversation.avatarUrl));
    assert.equal((await fetch(new URL(createdGroup.conversation.avatarUrl, base))).status, 200);
    const groupConversationId = createdGroup.conversation.id;
    assert.ok(groupConversationId.startsWith("group-"));
    assert.equal((await request(second)).data.conversations.some((item) =>
      item.id === groupConversationId && item.name === "گروه پروژه" && item.memberCount === 2), true);
    assert.equal((await request(third)).data.conversations.some((item) => item.id === groupConversationId), false);
    const groupMessage = { id: randomUUID(), text: "سلام به اعضای گروه" };
    assert.equal((await request(first, `/${groupConversationId}/messages`, groupMessage)).status, 201);
    const secondGroupInbox = await request(second);
    assert.equal(secondGroupInbox.data.messages.some((item) => item.id === groupMessage.id
      && item.side === "theirs" && item.senderName === first.username), true);
    const groupRead = await request(second, `/${groupConversationId}/read`, undefined, "PATCH");
    assert.equal(groupRead.status, 200);
    assert.equal(groupRead.data.read, 1);
    assert.equal((await request(third, `/${groupConversationId}/messages`, {
      id: randomUUID(), text: "بدون دسترسی",
    })).status, 404);
    const groupReply = { id: randomUUID(), text: "پاسخ عضو گروه" };
    assert.equal((await request(second, `/${groupConversationId}/messages`, groupReply)).status, 201);
    assert.equal((await request(first)).data.messages.some((item) => item.id === groupReply.id
      && item.senderName === second.username && item.side === "theirs"), true);
    const directConversation = await request(first, `/contacts/${second.id}/conversation`, {});
    assert.equal(directConversation.status, 201);
    const directId = directConversation.data.conversation.id;
    assert.ok(directId.startsWith("dm-"));
    const directMessage = { id: randomUUID(), text: "سلام از کاربر اول" };
    assert.equal((await request(first, `/${directId}/messages`, directMessage)).status, 201);
    const secondDirectMessage = { id: randomUUID(), text: "پیام خوانده‌نشده دوم" };
    assert.equal((await request(first, `/${directId}/messages`, secondDirectMessage)).status, 201);
    assert.equal((await request(first, `/${directId}/messages/${directMessage.id}`, { reaction: "👍" }, "PATCH")).status, 200);
    const secondInbox = await request(second);
    assert.equal(secondInbox.data.conversations.some((item) => item.id === directId && item.name === first.username), true);
    assert.equal(secondInbox.data.conversations.find((item) => item.id === directId).unread, 2);
    assert.equal(secondInbox.data.messages.some((item) => item.id === directMessage.id
      && item.text === directMessage.text && item.side === "theirs"), true);
    assert.equal(secondInbox.data.messages.find((item) => item.id === directMessage.id).seen, false);
    assert.deepEqual(secondInbox.data.messages.find((item) => item.id === directMessage.id).reactions, [{ emoji: "👍", count: 1 }]);
    assert.equal(secondInbox.data.messages.find((item) => item.id === directMessage.id).myReaction, null);
    const unreadSummary = await request(second, "/unread-summary");
    assert.equal(unreadSummary.status, 200);
    assert.deepEqual(unreadSummary.data, { conversationCount: 1, totalUnread: 2 });
    const secondReaction = await request(second, `/${directId}/messages/${directMessage.id}`, { reaction: "❤️" }, "PATCH");
    assert.equal(secondReaction.status, 200);
    assert.equal(secondReaction.data.message.myReaction, "❤️");
    assert.deepEqual(secondReaction.data.message.reactions, [{ emoji: "👍", count: 1 }, { emoji: "❤️", count: 1 }]);
    const readReceipt = await request(second, `/${directId}/read`, undefined, "PATCH");
    assert.equal(readReceipt.status, 200);
    assert.equal(readReceipt.data.read, 2);
    assert.deepEqual((await request(second, "/unread-summary")).data, { conversationCount: 0, totalUnread: 0 });
    const seenByFirst = await request(first);
    assert.equal(seenByFirst.data.messages.find((item) => item.id === directMessage.id).seen, true);
    const directReply = { id: randomUUID(), text: "سلام، پیام رسید" };
    assert.equal((await request(second, `/${directId}/messages`, directReply)).status, 201);
    const firstInbox = await request(first);
    assert.equal(firstInbox.data.contacts.some((item) => item.id === second.id), true);
    assert.equal(firstInbox.data.messages.some((item) => item.id === directReply.id
      && item.text === directReply.text && item.side === "theirs"), true);
    assert.equal(firstInbox.data.conversations.find((item) => item.id === directId).phone, second.phone);

    const blockResponse = await request(first, `/${directId}/block`, undefined, "PUT");
    assert.equal(blockResponse.status, 200);
    assert.equal(blockResponse.data.blocked, true);
    assert.equal(await ChatBlock.countDocuments({ blockerId: first._id, blockedUserId: second._id }), 1);
    assert.equal((await request(first, `/${directId}/block`, undefined, "PUT")).status, 200);
    assert.equal(await ChatBlock.countDocuments({ blockerId: first._id, blockedUserId: second._id }), 1);
    const blockerView = await request(first);
    assert.equal(blockerView.data.conversations.find((item) => item.id === directId).blockedByMe, true);
    assert.equal(blockerView.data.conversations.find((item) => item.id === directId).blockedMe, false);
    const blockedView = await request(second);
    assert.equal(blockedView.data.conversations.find((item) => item.id === directId).blockedByMe, false);
    assert.equal(blockedView.data.conversations.find((item) => item.id === directId).blockedMe, true);
    const deniedMessage = await request(second, `/${directId}/messages`, {
      id: randomUUID(),
      text: "این پیام نباید ارسال شود",
    });
    assert.equal(deniedMessage.status, 403);
    assert.equal(deniedMessage.data.message, "این کاربر شما را بلاک کرده است و امکان ارسال پیام ندارید");
    assert.equal((await request(first, `/${directId}/messages`, {
      id: randomUUID(),
      text: "ارسال از سمت بلاک‌کننده مجاز است",
    })).status, 201);

    const sourceTask = await ScheduledItem.create({
      user: first._id,
      title: "مرور برنامه پروژه",
      tag: "focus",
      priority: "high",
      day: "2026-09-14",
      hour: 14,
      duration: 2,
      done: false,
    });
    const groupRecipients = await request(first, "/task-recipients");
    assert.equal(groupRecipients.data.recipients.some((item) =>
      item.id === groupConversationId && item.kind === "group"), true);
    const groupForward = await request(first, "/task-forwards", {
      groupId: groupConversationId,
      sourceTaskId: sourceTask.id,
      hour: 14,
      duration: 2,
    });
    assert.equal(groupForward.status, 201);
    const receivedGroupForward = (await request(second)).data.messages.find((item) =>
      item.conversationId === groupConversationId && item.type === "task-forward");
    assert.equal(receivedGroupForward.taskForward.canRespond, true);
    assert.equal((await request(second, `/task-forwards/${receivedGroupForward.taskForward.id}`, {
      decision: "accept",
    }, "PATCH")).status, 200);
    const nameSearch = await request(first, "/task-recipients?q=chat-test-b");
    assert.equal(nameSearch.status, 200);
    assert.equal(nameSearch.data.recipients.some((item) => item.id === second.id), true);
    const phoneSearch = await request(first, "/task-recipients?q=۰۹۱۲۰۰۰۰۰۰۲");
    assert.equal(phoneSearch.data.recipients.some((item) => item.id === second.id), true);
    assert.equal((await request(second, "/task-forwards", {
      recipientId: first.id,
      sourceTaskId: sourceTask.id,
    })).status, 404);

    const forwarded = await request(first, "/task-forwards", {
      recipientId: second.id,
      sourceTaskId: sourceTask.id,
      hour: 14,
      duration: 2,
    });
    assert.equal(forwarded.status, 201);
    assert.equal(forwarded.data.message.type, "task-forward");
    assert.equal(forwarded.data.message.taskForward.status, "pending");
    const forwardId = forwarded.data.message.taskForward.id;
    const reactedForward = await request(first, `/${forwarded.data.conversationId}/messages/${forwarded.data.message.id}`, { reaction: "👏" }, "PATCH");
    assert.equal(reactedForward.status, 200);
    assert.equal(reactedForward.data.message.taskForward.id, forwardId);
    const receivedForward = (await request(second)).data.messages.find((item) => item.taskForward?.id === forwardId);
    assert.equal(receivedForward.side, "theirs");
    assert.equal(receivedForward.taskForward.canRespond, true);
    assert.equal((await request(first, `/task-forwards/${forwardId}`, { decision: "accept" }, "PATCH")).status, 404);

    const accepted = await request(second, `/task-forwards/${forwardId}`, { decision: "accept" }, "PATCH");
    assert.equal(accepted.status, 200);
    assert.equal(accepted.data.taskForward.status, "accepted");
    assert.equal(accepted.data.taskForward.canRespond, false);
    const addedSchedule = await ScheduledItem.findOne({ user: second._id, forwardRequest: forwardId }).lean();
    assert.deepEqual(
      {
        title: addedSchedule.title,
        tag: addedSchedule.tag,
        priority: addedSchedule.priority,
        day: addedSchedule.day,
        hour: addedSchedule.hour,
        duration: addedSchedule.duration,
      },
      {
        title: sourceTask.title,
        tag: sourceTask.tag,
        priority: sourceTask.priority,
        day: sourceTask.day,
        hour: sourceTask.hour,
        duration: sourceTask.duration,
      },
    );
    assert.equal((await request(second, `/task-forwards/${forwardId}`, { decision: "accept" }, "PATCH")).status, 200);
    assert.equal(await ScheduledItem.countDocuments({ user: second._id, forwardRequest: forwardId }), 1);
    const senderAcceptedView = (await request(first)).data.messages.find((item) => item.taskForward?.id === forwardId);
    assert.equal(senderAcceptedView.taskForward.status, "accepted");
    assert.equal(senderAcceptedView.taskForward.canRespond, false);

    const rejectedForward = await request(first, "/task-forwards", {
      recipientId: second.id,
      sourceTaskId: sourceTask.id,
      hour: 14,
      duration: 2,
    });
    const rejectedId = rejectedForward.data.message.taskForward.id;
    const rejected = await request(second, `/task-forwards/${rejectedId}`, { decision: "reject" }, "PATCH");
    assert.equal(rejected.status, 200);
    assert.equal(rejected.data.taskForward.status, "rejected");
    assert.equal(await ScheduledItem.countDocuments({ user: second._id, forwardRequest: rejectedId }), 0);
  } finally {
    if (listener) await new Promise((resolve) => listener.close(resolve));
    if (uploadedImagePath) await unlink(uploadedImagePath).catch(() => {});
    if (uploadedGroupImagePath) await unlink(uploadedGroupImagePath).catch(() => {});
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) {
      await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
  }
});
