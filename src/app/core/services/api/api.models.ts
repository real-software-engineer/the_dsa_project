// ── Generic API Response Wrapper ──────────────
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  statusCode: number;
}

// ── Paginated Response ─────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── API Error ──────────────────────────────────
export interface ApiError {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>; // field-level validation errors
  timestamp?: string;
  path?: string;
}

// ── Request Options ────────────────────────────
export interface RequestOptions {
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  showLoader?: boolean;       // optionally show global loader
  skipAuth?: boolean;         // skip attaching auth token (e.g. login endpoint)
}

// ── Pagination Params ──────────────────────────
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}