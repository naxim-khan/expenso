export type SortOrder = 'asc' | 'desc';

export type CursorPaginationMeta = {
  limit: number;
  nextCursor: string | null;
  hasNext: boolean;
};

export type CursorPaginationResult<T> = {
  data: T[];
  meta: CursorPaginationMeta;
};

export type PrismaCursorQueryOptions<TSortField extends string> = {
  limit?: number;
  cursor?: string;
  sortBy: TSortField;
  sortOrder: SortOrder;
};

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export function normalizeLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_PAGE_LIMIT;
  }

  return Math.min(Math.max(limit, 1), MAX_PAGE_LIMIT);
}

export function buildPrismaCursorQuery<TSortField extends string>({
  limit,
  cursor,
  sortBy,
  sortOrder,
}: PrismaCursorQueryOptions<TSortField>) {
  const normalizedLimit = normalizeLimit(limit);

  return {
    take: normalizedLimit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ [sortBy]: sortOrder }, { id: sortOrder }],
  };
}

export function buildCursorPagination<T extends { id: string }>(
  items: T[],
  limit?: number,
): CursorPaginationResult<T> {
  const normalizedLimit = normalizeLimit(limit);
  const hasNext = items.length > normalizedLimit;
  const data = hasNext ? items.slice(0, normalizedLimit) : items;
  const nextCursor = hasNext ? (data[data.length - 1]?.id ?? null) : null;

  return {
    data,
    meta: {
      limit: normalizedLimit,
      nextCursor,
      hasNext,
    },
  };
}

export function isCursorPaginationResult<T>(
  value: unknown,
): value is CursorPaginationResult<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'meta' in value &&
    Array.isArray((value as CursorPaginationResult<T>).data)
  );
}
