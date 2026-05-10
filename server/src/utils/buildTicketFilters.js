const { Op } = require('sequelize');

const buildTicketFilters = (query) => {
  const filters = {};

  if (query.status) filters.status = query.status;
  if (query.priority) filters.priority = query.priority;
  if (query.assigned_to) filters.assigned_to = query.assigned_to;
  if (query.created_by) filters.created_by = query.created_by;

  if (query.unassigned === 'true') {
    filters.assigned_to = { [Op.is]: null };
  }

  if (query.search) {
    filters.title = { [Op.iLike]: `%${query.search}%` };
  }

  if (query.from || query.to) {
    filters.created_at = {};
    if (query.from) filters.created_at[Op.gte] = new Date(query.from);
    if (query.to) filters.created_at[Op.lte] = new Date(query.to + 'T23:59:59Z');
  }

  return filters;
};

const buildTicketSort = (query) => {
  const SORTABLE_FIELDS = ['created_at', 'updated_at', 'priority', 'status'];
  const SORT_ORDERS = ['ASC', 'DESC'];

  const field = SORTABLE_FIELDS.includes(query.sort) ? query.sort : 'created_at';
  const order = SORT_ORDERS.includes(query.order?.toUpperCase())
    ? query.order.toUpperCase()
    : 'DESC';

  // Priority needs custom ordering — urgent > high > medium > low
  if (field === 'priority') {
    return [
      [
        // Raw SQL CASE statement for custom sort order
        require('sequelize').literal(`
            CASE priority
                WHEN 'urgent' THEN 1
                WHEN 'high'   THEN 2
                WHEN 'medium' THEN 3
                WHEN 'low'    THEN 4
            END
        `),
        order,
      ],
    ];
  }

  return [[field, order]];
};

module.exports = { buildTicketFilters, buildTicketSort };
