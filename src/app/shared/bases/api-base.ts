  import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from "../../../environments/environment";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root',
})
export class ApiBase {constructor(protected http: HttpClient) {
  }

  private get apiUrl(): string {
    return environment.apiUrl;
  }

  get<T>(endpoint: string, queryParams?: Record<string, string | number | boolean>, headers?: HttpHeaders): Observable<T> {
    let params = new HttpParams();
    if (queryParams) {
      Object.keys(queryParams).forEach((key) => {
        params = params.append(key, queryParams[key].toString());
      });
    }
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, {params, headers})
  }

  post<T, U = any>(endpoint: string, data: U, headers?: HttpHeaders): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, data, {headers}).pipe(catchError(this.handleError));
  }

  put<T, U = any>(endpoint: string, id: number | string, data: U, headers?: HttpHeaders): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}/${id}`, data, {headers}).pipe(catchError(this.handleError));
  }

  delete(endpoint: string, id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${endpoint}/${id}`).pipe(catchError(this.handleError));
  }

  protected handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}
