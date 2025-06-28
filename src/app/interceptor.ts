import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize, throwError } from 'rxjs';
import { LoadingService } from "./shared/services/loader.service";
import { AuthService } from "./shared/services/auth.service";
import { HttpErrorResponse } from '@angular/common/http';

const urlsWithoutLoader: Array<string> = ['/assets/i18n/'];

export const Interceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);
  const authService = inject(AuthService);
  const loadingService = inject(LoadingService);
  const token = authService.getToken();

  // Check if the request should skip the loader
  const isReqWithoutLoader = urlsWithoutLoader.some(url => req.url.startsWith(url));

  if (!isReqWithoutLoader) {
    loadingService.show(); // remove setTimeout()
  }

  const clonedRequest = req.clone({
    setHeaders: {
      'Authorization': `Bearer ${token}`,
    }
  });

  return next(clonedRequest).pipe(
    finalize(() => {
      if (!isReqWithoutLoader) {
        loadingService.hide();
      }
    }),
    catchError((error: HttpErrorResponse) => {
      // Skip error handling if custom header is present
      if (req.headers.has('HandleErrors')) {
        return throwError(() => error);
      }

      let errorMessage = 'An unknown error occurred.';

      // Handle different status codes
      if (error.status === 0) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.status === 401) {
        errorMessage = 'Unauthorized access. Please check your credentials.';
        authService.logout();
      } else if (error.status === 403) {
        errorMessage = 'Forbidden. You do not have permission to access this resource.';
      } else if (error.status === 404) {
        errorMessage = 'Resource not found. Please check the URL.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      // Prefer backend-provided error message if available
      if (error.error) {
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error.error) {
          errorMessage = error.error.error;
        } else if (error.error.message) {
          errorMessage = error.error.message;
        }
      }

      toastr.error(errorMessage, 'Error');
      console.error('HTTP Error:', error);

      return throwError(() => error);
    })
  );
};
