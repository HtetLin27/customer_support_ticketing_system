const { Op } = require('sequelize');

const offsetPaginate = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, parseInt(query.limit) || 20);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

const buildPaginationMeta = (count, page, limit) => ({
  total: count,
  page,
  limit,
  totalPages: Math.ceil(count / limit),
  hasNext: page < Math.ceil(count / limit),
  hasPrev: page > 1,
});

const cursorPaginate = (query) => {
  const limit = Math.min(100, parseInt(query.limit) || 20);
  // Fetch one extra item to know if there's a next page
  const fetchLimit = limit + 1;
  const cursorWhere = query.cursor ? { created_at: { [Op.lt]: new Date(query.cursor) } } : {};

  return { limit, fetchLimit, cursorWhere };
};

const buildCursorMeta = (items, limit) => {
  const hasNext = items.length > limit;
  const data = hasNext ? items.slice(0, limit) : items;

  const nextCursor = hasNext ? data[data.length - 1].created_at.toISOString() : null;

  return { data, hasNext, nextCursor };
};

module.exports = {
  offsetPaginate,
  buildPaginationMeta,
  cursorPaginate,
  buildCursorMeta,
};
