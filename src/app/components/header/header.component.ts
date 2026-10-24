import { Component, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  isDropdownOpen: boolean = false;
  username: string = 'admin'; // Can be bound to your auth service

  constructor(private router: Router, private eRef: ElementRef) {}

  // Toggle dropdown visibility
  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  // Close dropdown when clicking outside the component
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  // Logout functionality with security/CSRF logic hint implementation
  logout() {
    // Example equivalent logic to your VB.NET CSRF and Session handling
    const csrfVal = sessionStorage.getItem('csrfval');
    const randomNo = sessionStorage.getItem('randomno');

    // If implementing token validation:
    // if (csrfVal && csrfVal === randomNo) {
    const randomNo1 = Math.floor(Math.random() * 1000000);
    sessionStorage.setItem('randomno1', randomNo1.toString());
    this.router.navigate(['/logout'], { queryParams: { id: randomNo1 } });
    // } else {
    //   this.router.navigate(['/generic-error']);
    // }
  }
}