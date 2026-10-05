import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { app } from "../app.js";
import Users from "../models/User.js";
import { ChatGroup } from "../modules/chat/chat.model.js";

test("admin user management enforces edits, status, deletion, and role safeguards", async () => {
  const dbName = `taskmentor_admin_users_test_${randomUUID().replaceAll("-", "")}`;
  const uri = "mongodb://127.0.0.1:27017";
  let listener;

  try {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "isolated-test-secret";
    await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 5000 });
    const [owner, admin, user, legacyUser] = await Users.create([
      { username: "owner-test", phone: "09120000101", role: "owner" },
      { username: "admin-test", phone: "09120000102", role: "admin" },
      { username: "user-test", phone: "09120000103", role: "user" },
      { username: "legacy-user", role: "user" },
    ]);

    const tokenFor = (account) => jwt.sign({ id: account.id }, process.env.JWT_SECRET);
    const group = await ChatGroup.create({
      key: `group-${randomUUID()}`,
      ownerId: owner._id,
      name: "گروه تست داشبورد",
      memberIds: [owner._id, user._id],
    });
    listener = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => listener.once("listening", resolve));
    const origin = `http://127.0.0.1:${listener.address().port}`;
    const request = async (account, route, { body, method = body ? "PATCH" : "GET" } = {}) => {
      const response = await fetch(`${origin}${route}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenFor(account)}`,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return { status: response.status, data: await response.json() };
    };

    const listed = await request(admin, "/api/admin/users");
    assert.equal(listed.status, 200);
    assert.equal(listed.data.data.length, 4);
    assert.ok(listed.data.data.every((account) => typeof account.isActive === "boolean"));

    const dashboard = await request(admin, "/api/admin/dashboard");
    assert.equal(dashboard.status, 200);
    assert.equal(dashboard.data.data.users.length, 4);
    assert.deepEqual(dashboard.data.data.groups.map((item) => item._id), [group.id]);
    assert.equal((await request(user, "/api/admin/dashboard")).status, 403);

    const adminRoleChange = await request(admin, `/api/admin/users/${user.id}`, {
      body: { username: user.username, phone: user.phone, role: "admin", subscription: "free" },
    });
    assert.equal(adminRoleChange.status, 403);

    const edited = await request(owner, `/api/admin/users/${user.id}`, {
      body: { username: "edited-user", phone: "09120000113", role: "admin", subscription: "pro" },
    });
    assert.equal(edited.status, 200);
    assert.equal(edited.data.data.username, "edited-user");
    assert.equal(edited.data.data.role, "admin");
    assert.equal(edited.data.data.subscription, "pro");

    const editedLegacyUser = await request(owner, `/api/admin/users/${legacyUser.id}`, {
      body: { username: "edited-legacy-user", phone: "", role: "user", subscription: "free" },
    });
    assert.equal(editedLegacyUser.status, 200);
    assert.equal(editedLegacyUser.data.data.username, "edited-legacy-user");
    assert.equal(editedLegacyUser.data.data.phone, undefined);

    const deactivated = await request(owner, `/api/admin/users/${user.id}/status`, {
      body: { isActive: false },
    });
    assert.equal(deactivated.status, 200);
    assert.equal(deactivated.data.data.isActive, false);
    assert.equal((await request(user, "/api/auth/me")).status, 403);

    const activated = await request(owner, `/api/admin/users/${user.id}/status`, {
      body: { isActive: true },
    });
    assert.equal(activated.status, 200);
    assert.equal(activated.data.data.isActive, true);

    assert.equal((await request(admin, `/api/admin/users/${owner.id}`, { method: "DELETE" })).status, 403);
    assert.equal((await request(owner, `/api/admin/users/${owner.id}`, { method: "DELETE" })).status, 400);

    const deleted = await request(owner, `/api/admin/users/${user.id}`, { method: "DELETE" });
    assert.equal(deleted.status, 200);
    assert.equal(await Users.exists({ _id: user._id }), null);
  } finally {
    if (listener) await new Promise((resolve) => listener.close(resolve));
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) {
      await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
  }
});
