// ─────────────────────────────────────────────
// api.interceptor.ts — Auth & Global Error Interceptor
// ─────────────────────────────────────────────

import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  // ── Token Refresh State ────────────────────────
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // 1. Attach auth token (skip if marked as public)
    const authReq = this.addAuthToken(req);

    return next.handle(authReq).pipe(
      // 2. Handle errors globally
      catchError((error: HttpErrorResponse) => this.handleError(error, req, next)),
      // 3. Optional: hide loader on complete
      finalize(() => this.onRequestComplete())
    );
  }

  // ── Attach Bearer Token ───────────────────────
  private addAuthToken(req: HttpRequest<unknown>): HttpRequest<unknown> {
    // Skip token for requests marked with X-Skip-Auth header
    if (req.headers.has('X-Skip-Auth')) {
      return req.clone({ headers: req.headers.delete('X-Skip-Auth') });
    }

    const token = this.getAccessToken();
    if (!token) return req;

    return req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  // ── Global Error Handler ──────────────────────
  private handleError(
    error: HttpErrorResponse,
    originalReq: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    switch (error.status) {
      case 401:
        // Token expired → try refresh, then retry original request
        return this.handle401(originalReq, next);

      case 403:
        // Forbidden → redirect to access-denied page
        this.router.navigate(['/access-denied']);
        break;

      case 404:
        // Not found — let individual services handle or log here
        console.warn('[ApiInterceptor] 404 Not Found:', error.url);
        break;

      case 500:
      case 502:
      case 503:
        // Server errors → redirect to error page or show global toast
        console.error('[ApiInterceptor] Server Error:', error.status, error.message);
        this.router.navigate(['/server-error']);
        break;

      default:
        console.error('[ApiInterceptor] HTTP Error:', error);
    }

    return throwError(() => error);
  }

  // ── Handle 401: Token Refresh ─────────────────
  /**
   * When a 401 occurs:
   * - If NOT already refreshing → call refresh endpoint, retry original request
   * - If already refreshing → wait for new token, then retry
   */
  private handle401(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      // TODO: Replace with your actual AuthService.refreshToken() call
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        this.logout();
        return throwError(() => new Error('No refresh token. Logged out.'));
      }

      // Simulate refresh — replace with: this.authService.refreshToken()
      return next
        .handle(req.clone({ setHeaders: { Authorization: `Bearer ${refreshToken}` } }))
        .pipe(
          switchMap((newToken: any) => {
            this.isRefreshing = false;
            const token = newToken?.accessToken || '';
            this.saveAccessToken(token);
            this.refreshTokenSubject.next(token);
            return next.handle(this.addAuthToken(req));
          }),
          catchError((err) => {
            this.isRefreshing = false;
            this.logout();
            return throwError(() => err);
          })
        );
    }

    // Already refreshing — queue this request until new token is ready
    return this.refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap(() => next.handle(this.addAuthToken(req)))
    );
  }

  // ── Token Helpers ─────────────────────────────
  // Replace localStorage with your AuthService/TokenService as needed

  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private saveAccessToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  private logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  private onRequestComplete(): void {
    // Hook to hide global spinner/loader if you have one
    // e.g. this.loaderService.hide();
  }
}

// ─────────────────────────────────────────────
// Register in app.config.ts (Angular 17+ standalone):
//
// export const appConfig: ApplicationConfig = {
//   providers: [
//     provideHttpClient(withInterceptorsFromDi()),
//     { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true },
//   ],
// };
//
// OR in CoreModule (NgModule approach):
//
// providers: [
//   { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true }
// ]
// ─────────────────────────────────────────────