import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  otpForm: FormGroup;

  showPassword = false;
  captchaCode = '';
  captchaId = '';
  captchaError = '';
  isOtpMode = false;

  timerSeconds = 30;
  timerInterval: any;
  isOtpExpired = false;
  otpMessage = '';

  Math = Math;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      captchaInput: ['', Validators.required]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern('[0-9]{6}'), Validators.maxLength(6)]]
    });
  }

  ngOnInit(): void {
    this.generateCaptcha();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  generateCaptcha(): void {
    this.authService.getCaptcha().subscribe({
      next: (res: any) => {
        const isSuccess = res.success !== undefined ? res.success : res.Success;
        if (isSuccess) {
          this.captchaId = res.captchaId || res.CaptchaId;
          this.captchaCode = res.captchaImageText || res.CaptchaImageText;
          this.captchaError = '';
        } else {
          this.captchaError = res.message || res.Message || 'Failed to load captcha.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Captcha load error:', err);
        this.captchaError = 'Failed to load captcha. Please check backend connection.';
        this.cdr.detectChanges();
      }
    });
  }

  onLoginSubmit(): void {
    if (this.loginForm.invalid) return;

    const payload = {
      username: this.loginForm.get('username')?.value,
      password: this.loginForm.get('password')?.value,
      captchaId: this.captchaId,
      captchaValue: this.loginForm.get('captchaInput')?.value?.trim()
    };

    this.authService.login(payload).subscribe({
      next: (res: any) => {
        const isSuccess = res.success !== undefined ? res.success : res.Success;

        if (isSuccess) {
          this.isOtpMode = true;

          const responseData = res.data || res.Data;
          const serverExpiry = responseData?.expiresInSeconds || 120;

          this.startOtpTimer(serverExpiry);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Invalid credentials or captcha.');
        this.generateCaptcha();
        this.loginForm.get('captchaInput')?.setValue('');
      }
    });
  }

  onUnlockClick(event: Event): void {
    event.preventDefault();
    this.isOtpMode = true;
    this.startOtpTimer();
  }

  backToLogin(): void {
    this.isOtpMode = false;
    this.generateCaptcha();
    this.loginForm.get('captchaInput')?.setValue('');
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  startOtpTimer(durationSeconds: number = 120): void {
    this.timerSeconds = durationSeconds;
    this.isOtpExpired = false;

    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.timerSeconds > 0) {
        this.timerSeconds--;
        this.cdr.detectChanges();
      } else {
        this.isOtpExpired = true;
        clearInterval(this.timerInterval);
        this.cdr.detectChanges();
      }
    }, 1000);
  }

  resendOtp(): void {
    if (this.timerSeconds > 0) return;

    this.otpMessage = 'Resending OTP...';
    this.cdr.detectChanges();

    const payload = {
      username: this.loginForm.get('username')?.value
    };

    this.authService.ResendOtp(payload).subscribe({
      next: (res: any) => {
        const isSuccess = res.success !== undefined ? res.success : res.Success;

        if (isSuccess) {
          this.otpMessage = 'A new OTP has been sent to your registered mobile number.';
          const responseData = res.data || res.Data;
          const serverExpiry = responseData?.expiresInSeconds || 120;

          this.startOtpTimer(serverExpiry);
          this.isOtpExpired = false;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.otpMessage = '';
            this.cdr.detectChanges();
          }, 4000);
        } else {
          this.otpMessage = res.message || 'Failed to resend OTP.';
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        this.otpMessage = err.error?.message || 'Failed to resend OTP. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  onOtpSubmit(): void {
    if (this.otpForm.invalid || this.isOtpExpired) return;

    const payload = {
      username: this.loginForm.get('username')?.value,
      otp: this.otpForm.get('otp')?.value
    };

    this.authService.verifyOtp(payload).subscribe({
      next: (res: any) => {
        const isSuccess = res.success !== undefined ? res.success : res.Success;
        if (isSuccess) {
          localStorage.setItem('token', res.data || res.Data);
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.otpMessage = err.error?.message || 'Incorrect OTP. Please try again.';
      }
    });
  }
}