import { getUserSearchText, normalizeUserSearch } from "./userMetadata.js";

export function filterUsers(users, filters) {
  const query = normalizeUserSearch(filters.query);

  return users.filter((user) => {
    const active = user.isActive !== false;
    const matchesQuery = !query
      || (query === "فعال" ? active : query === "غیرفعال" ? !active : getUserSearchText(user).includes(query));
    const matchesRole = filters.role === "all" || user.role === filters.role;
    const matchesSubscription = filters.subscription === "all"
      || user.subscription === filters.subscription;
    const matchesStatus = filters.status === "all"
      || (filters.status === "active" ? active : !active);

    return matchesQuery && matchesRole && matchesSubscription && matchesStatus;
  });
}

export function paginateUsers(users, requestedPage, rowsPerPage) {
  const pageCount = Math.max(1, Math.ceil(users.length / rowsPerPage));
  const page = Math.min(Math.max(requestedPage, 1), pageCount);
  const start = (page - 1) * rowsPerPage;

  return {
    page,
    pageCount,
    visibleUsers: users.slice(start, start + rowsPerPage),
  };
}

export function hasActiveUserFilters(filters) {
  return Object.entries(filters).some(([key, value]) => (
    key === "query" ? Boolean(value.trim()) : value !== "all"
  ));
}
