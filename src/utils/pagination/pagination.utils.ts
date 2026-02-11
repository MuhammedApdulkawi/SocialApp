/**
 * Centralized pagination custom labels for mongoose-paginate-v2
 * Used to standardize field names across all paginated endpoints
 */
export const PAGINATION_LABELS = {
  totalDocs: "totalItems",
  docs: "items",
  page: "currentPage",
  totalPages: "totalPages",
  pagingCounter: "pagingCounter",
  hasPrevPage: "hasPrevPage",
  hasNextPage: "hasNextPage",
  prevPage: "prevPage",
  nextPage: "nextPage",
  meta: "meta",
};

export const pagination = ({ page = 1, limit = 10 }) => {
  if (Number(page) < 1) page = 1;
  if (Number(limit) < 1 || Number(limit) > 100) limit = 10;
  const skip = (Number(page) - 1) * Number(limit);
  return { skip, limit };
};
