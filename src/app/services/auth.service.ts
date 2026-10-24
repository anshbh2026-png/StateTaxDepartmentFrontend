import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
private baseUrl = 'https://localhost:44381/api/auth';
  constructor(private http: HttpClient) {}

  getCaptcha(): Observable<any> {
    return this.http.get(`${this.baseUrl}/captcha`);
  }

  login(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, payload);
  }

  verifyOtp(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/verify-otp`, payload);
  }

  // Add this method inside your AuthService class
ResendOtp(payload: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/resend-otp`, payload);
}
}