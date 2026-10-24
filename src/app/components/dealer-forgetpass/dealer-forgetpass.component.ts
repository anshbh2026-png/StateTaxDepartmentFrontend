import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
// Import your AuthService or API service here when connecting to your backend REST endpoints
// import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dealer-forgetpass',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './dealer-forgetpass.component.html',
  styleUrls: ['./dealer-forgetpass.component.css']
})
export class DealerForgetPassComponent {
  forgetForm: FormGroup;
  secCodeForm: FormGroup;

  isOtpSent: boolean = false;
  isCompleted: boolean = false;
  
  generalMsg: string = '';
  generalMsgColor: string = 'red';
  otpMsg: string = '';

  constructor(private fb: FormBuilder, private router: Router) {
    // Step 1 Form Group matching TIN, Email, Mobile validations
    this.forgetForm = this.fb.group({
      txtTin: ['', [Validators.required, Validators.pattern(/^[0-9]+$/), Validators.maxLength(11)]],
      txtemailid: ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
      txtmobno: ['', [Validators.required, Validators.pattern(/^[0-9]+$/), Validators.maxLength(10)]]
    });

    // Step 2 Security Code Form Group
    this.secCodeForm = this.fb.group({
      txtsmscode: ['', [Validators.required, Validators.pattern(/^[0-9A-Z ]+$/), Validators.maxLength(6)]]
    });
  }

  // Equivalent to btproceed_Click VB logic
  onProceed() {
    if (this.forgetForm.invalid) {
      this.forgetForm.markAllAsTouched();
      return;
    }

    const { txtTin, txtemailid, txtmobno } = this.forgetForm.value;

    // TODO: Connect to your ASP.NET Core / Web API backend endpoint matching your VB logic:
    // 1. Check if TIN exists in buss_detail_master
    // 2. Verify email matches add_main_off
    // 3. Generate OTP, insert/update pass_reset_trail, and dispatch SMS/Email
    
    // Simulating successful backend response:
    this.isOtpSent = true;
    this.generalMsg = '';
    this.forgetForm.disable();
  }

  // Equivalent to btnconfirmreset_Click VB logic
  onConfirmReset() {
    if (this.secCodeForm.invalid) {
      this.secCodeForm.markAllAsTouched();
      return;
    }

    const enteredCode = this.secCodeForm.value.txtsmscode;

    // TODO: Connect to backend endpoint to verify OTP from pass_reset_trail,
    // generate MD5 hash password, update e_login, and email temporary password.

    // Simulating successful confirmation and reset:
    this.isCompleted = true;
    this.otpMsg = 'Your new password has been sent to you on the registered mail ID.';
  }

  onCancel() {
    this.router.navigate(['/login']);
  }
}