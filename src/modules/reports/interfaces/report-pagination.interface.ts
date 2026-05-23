import type {
  CursorPaginationMeta,
  SortOrder,
} from '../../../common/utils/pagination.util';
import type { ReportSortBy } from './report-query.interface';

export type ReportPaginationMeta = CursorPaginationMeta;

export type ReportPaginationOptions = {
  limit?: number;
  cursor?: string;
  sortBy: ReportSortBy;
  sortOrder: SortOrder;
};
