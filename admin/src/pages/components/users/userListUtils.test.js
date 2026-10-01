import { test } from "node:test";
import assert from "node:assert/strict";
import { filterUsers, paginateUsers } from "./userListUtils.js";

const users = [
  { _id: "1", username: "مالک", phone: "09120000001", role: "owner", subscription: "enterprise", isActive: true },
  { _id: "2", username: "ادمین", phone: "09120000002", role: "admin", subscription: "pro", isActive: true },
  { _id: "3", username: "زهرا", phone: "09120000003", role: "user", subscription: "free", isActive: false },
  { _id: "4", username: "user-4", phone: "09120000004", role: "user", subscription: "free", isActive: true },
  { _id: "5", username: "user-5", phone: "09120000005", role: "user", subscription: "free", isActive: true },
  { _id: "6", username: "user-6", phone: "09120000006", role: "user", subscription: "free", isActive: true },
  { _id: "7", username: "user-7", phone: "09120000007", role: "user", subscription: "free", isActive: true },
];

const allFilters = { query: "", role: "all", subscription: "all", status: "all" };

test("filters all visible user fields and keeps active distinct from inactive", () => {
  assert.deepEqual(filterUsers(users, { ...allFilters, query: "۰۹۱۲۰۰۰۰۰۰۳" }).map((user) => user._id), ["3"]);
  assert.deepEqual(filterUsers(users, { ...allFilters, query: "زهرا" }).map((user) => user._id), ["3"]);
  assert.deepEqual(filterUsers(users, { ...allFilters, query: "فعال" }).map((user) => user._id), ["1", "2", "4", "5", "6", "7"]);
  assert.deepEqual(filterUsers(users, { ...allFilters, status: "inactive" }).map((user) => user._id), ["3"]);
  assert.deepEqual(filterUsers(users, { ...allFilters, role: "owner", subscription: "enterprise" }).map((user) => user._id), ["1"]);
});

test("paginates filtered users and clamps an invalid requested page", () => {
  assert.deepEqual(paginateUsers(users, 1, 5), {
    page: 1,
    pageCount: 2,
    visibleUsers: users.slice(0, 5),
  });
  assert.deepEqual(paginateUsers(users, 2, 5), {
    page: 2,
    pageCount: 2,
    visibleUsers: users.slice(5),
  });
  assert.equal(paginateUsers(users, 99, 5).page, 2);
});
