import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface SectionCollection {
  name: string;
  zone: string;
  target: number;
  cash: number;
  sgst: number;
  igstSettlement: number;
  total: number;
}

export interface DashboardSummary {
  demand: number;
  deposit: number;
  recovery: number;
  target: number;
}

export interface DashboardData {
  sections: SectionCollection[];
  summary: DashboardSummary;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = '/api/dashboard/collection';

  // Change to false when connecting to your real API.
  private readonly useMockData = true;

  constructor(private readonly http: HttpClient) {}

  getDashboard(year: number, month: number): Observable<DashboardData> {
    if (this.useMockData) {
      const sections: SectionCollection[] = [
        {
          name: 'Dehradun',
          zone: 'Garhwal',
          target: 380000,
          cash: 120000,
          sgst: 340000,
          igstSettlement: 210000,
          total: 0
        },
        {
          name: 'Haridwar',
          zone: 'Garhwal',
          target: 420000,
          cash: 150000,
          sgst: 410000,
          igstSettlement: 260000,
          total: 0
        },
        {
          name: 'Haldwani',
          zone: 'Kumaon',
          target: 380000,
          cash: 135000,
          sgst: 300000,
          igstSettlement: 190000,
          total: 0
        },
        {
          name: 'Rudrapur',
          zone: 'Kumaon',
          target: 320000,
          cash: 110000,
          sgst: 290000,
          igstSettlement: 160000,
          total: 0
        }
      ].map(section => ({
        ...section,
        // Total Collection = SGST Cash + IGST Settlement
        total: section.cash + section.igstSettlement
      }));

      const summary: DashboardSummary = {
        demand: 2500000,
        deposit: 1900000,
        recovery: 600000,
        target: 1500000
      };

      return of({ sections, summary }).pipe(delay(300));
    }

    const params = new HttpParams()
      .set('year', year.toString())
      .set('month', month.toString());

    return this.http.get<DashboardData>(
      this.apiUrl,
      { params }
    );
  }
}