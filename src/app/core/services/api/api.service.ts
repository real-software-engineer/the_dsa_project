// ─────────────────────────────────────────────
// api.service.ts — Base HTTP Wrapper Service
// ─────────────────────────────────────────────

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiResponse, ApiError, RequestOptions, PaginatedResponse, PaginationParams } from './api.models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  // ── GET ───────────────────────────────────────
  /**
   * Fetch a single resource or list.
   * @example this.apiService.get<User[]>('/users')
   */
  get<T>(endpoint: string, options: RequestOptions = {}): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(this.resolveUrl(endpoint), {
        params: this.buildParams(options.params),
        headers: this.buildHeaders(options.headers),
      })
      .pipe(
        map((res) => {
          // Case 1: Standard API response
          if (res?.data !== undefined) {
            return res.data as T;
          }

          // Case 2: Direct array/object response
          return res as T;
        }),
        catchError(this.handleError)
      );
  }

  // ── GET PAGINATED ─────────────────────────────
  /**
   * Fetch a paginated list of resources.
   * @example this.apiService.getPaginated<Product>('/products', { page: 1, limit: 10 })
   */
  getPaginated<T>(
    endpoint: string,
    pagination: PaginationParams,
    options: RequestOptions = {}
  ): Observable<PaginatedResponse<T>> {
    const mergedParams = { ...pagination, ...(options.params || {}) };
    return this.http
      .get<PaginatedResponse<T>>(this.resolveUrl(endpoint), {
        params: this.buildParams(mergedParams),
        headers: this.buildHeaders(options.headers),
      })
      .pipe(catchError(this.handleError));
  }

  // ── POST ──────────────────────────────────────
  /**
   * Create a new resource.
   * @example this.apiService.post<User>('/users', { name: 'John' })
   */
  post<T>(endpoint: string, body: unknown, options: RequestOptions = {}): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(this.resolveUrl(endpoint), body, {
        params: this.buildParams(options.params),
        headers: this.buildHeaders(options.headers),
      })
      .pipe(
        map((res) => res.data),
        catchError(this.handleError)
      );
  }

  // ── PUT ───────────────────────────────────────
  /**
   * Replace an existing resource entirely.
   * @example this.apiService.put<User>('/users/1', updatedUser)
   */
  put<T>(endpoint: string, body: unknown, options: RequestOptions = {}): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(this.resolveUrl(endpoint), body, {
        params: this.buildParams(options.params),
        headers: this.buildHeaders(options.headers),
      })
      .pipe(
        map((res) => res.data),
        catchError(this.handleError)
      );
  }

  // ── PATCH ─────────────────────────────────────
  /**
   * Partially update an existing resource.
   * @example this.apiService.patch<User>('/users/1', { name: 'Jane' })
   */
  patch<T>(endpoint: string, body: unknown, options: RequestOptions = {}): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(this.resolveUrl(endpoint), body, {
        params: this.buildParams(options.params),
        headers: this.buildHeaders(options.headers),
      })
      .pipe(
        map((res) => res.data),
        catchError(this.handleError)
      );
  }

  // ── DELETE ────────────────────────────────────
  /**
   * Delete a resource by endpoint (usually includes ID).
   * @example this.apiService.delete<void>('/users/1')
   */
  delete<T>(endpoint: string, options: RequestOptions = {}): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(this.resolveUrl(endpoint), {
        params: this.buildParams(options.params),
        headers: this.buildHeaders(options.headers),
      })
      .pipe(
        map((res) => res.data),
        catchError(this.handleError)
      );
  }

  // ── UPLOAD (multipart/form-data) ──────────────
  /**
   * Upload a file or form data.
   * @example this.apiService.upload<{ url: string }>('/upload', formData)
   */
  upload<T>(endpoint: string, formData: FormData, options: RequestOptions = {}): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(this.resolveUrl(endpoint), formData, {
        params: this.buildParams(options.params),
        // NOTE: Do NOT set Content-Type manually; browser sets it with boundary for multipart
        reportProgress: true,
      })
      .pipe(
        map((res) => res.data),
        catchError(this.handleError)
      );
  }

  // ── Private Helpers ───────────────────────────

  private resolveUrl(endpoint: string): string {
    if (/^https?:\/\//i.test(endpoint)) {
      return endpoint;
    }

    const baseUrl = this.baseUrl.replace(/\/$/, '');
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${normalizedEndpoint}`;
  }

  private buildParams(
    params?: Record<string, string | number | boolean>
  ): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return httpParams;
  }

  private buildHeaders(customHeaders?: Record<string, string>): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (customHeaders) {
      Object.entries(customHeaders).forEach(([key, value]) => {
        headers = headers.set(key, value);
      });
    }
    return headers;
  }

  private handleError(error: any): Observable<never> {
    const apiError: ApiError = {
      statusCode: error.status,
      message: error.error?.message || 'An unexpected error occurred.',
      errors: error.error?.errors,
      timestamp: new Date().toISOString(),
      path: error.url,
    };
    console.error('[ApiService Error]', apiError);
    return throwError(() => apiError);
  }
}
