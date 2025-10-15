import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError } from 'rxjs/operators';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackbar = inject(MatSnackBar);

  return next(req).pipe(
    // No retry for now
    // Add error tap:
    // tap({ error: (err) => { ... } }) — not necessary with error operator
    // Handle here:
    catchError((error: HttpErrorResponse) => {
      let msg = 'An unexpected error occurred.';
      if (error.status === 0) msg = 'Server unreachable. Check your connection.';
      else if (error.status >= 500) msg = 'Server error. Please try again later.';
      else if (error.status === 404) msg = 'Resource not found.';
      else if (error.status === 400) msg = 'Bad request.';
      snackbar.open(msg, 'Dismiss', { duration: 4000 });
      throw error;
    })
  );
};
