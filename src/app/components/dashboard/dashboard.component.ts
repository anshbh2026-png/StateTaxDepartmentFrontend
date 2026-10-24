import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import {
  DashboardService,
  SectionCollection,
  DashboardSummary
} from '../../services/dashboard.service';

interface Totals {
  target: number;
  cash: number;
  sgst: number;
  igstSettlement: number;
  total: number;
}

interface ZoneGroup {
  name: string;
  sections: SectionCollection[];
  totals: Totals;
}

interface DonutPart {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  // Zone -> regions (display order is the order written here)
  readonly zoneRegions: Record<string, string[]> = {
    Garhwal: ['Dehradun', 'Haridwar'],
    Kumaon: ['Haldwani', 'Rudrapur']
  };

  readonly zoneNames = Object.keys(this.zoneRegions);

  years: number[] = [];

  months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  selectedYear: number;
  selectedMonth: number;

  sections: SectionCollection[] = [];
  zones: ZoneGroup[] = [];

  summary: DashboardSummary = {
    demand: 0,
    deposit: 0,
    recovery: 0,
    target: 0
  };

  totals: Totals = this.emptyTotals();

  loading = false;
  error = '';

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly cdr: ChangeDetectorRef
  ) {
    const now = new Date();

    this.selectedYear = now.getFullYear();
    this.selectedMonth = now.getMonth() + 1;

    for (let year = this.selectedYear; year >= this.selectedYear - 5; year--) {
      this.years.push(year);
    }
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Template-safe getter (arrow functions are not allowed in Angular templates)
  get hasRegionRows(): boolean {
    return this.zones.some(zone => zone.sections.length > 0);
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.dashboardService
      .getDashboard(this.selectedYear, this.selectedMonth)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.sections = (data.sections ?? [])
            .filter(section => this.isAllowedSection(section))
            .map(section => {
              const target = this.toNumber(section.target);
              const cash = this.toNumber(section.cash);
              const sgst = this.toNumber(section.sgst);
              const igstSettlement = this.toNumber(section.igstSettlement);

              return {
                ...section,
                target,
                cash,
                sgst,
                igstSettlement,
                total: this.collectionTotal(cash, igstSettlement)
              };
            });

          this.summary = {
            demand: this.toNumber(data.summary?.demand),
            deposit: this.toNumber(data.summary?.deposit),
            recovery: this.toNumber(data.summary?.recovery),
            target: this.toNumber(data.summary?.target)
          };

          this.totals = this.sumTotals(this.sections);
          this.buildZones();

          this.loading = false;
          this.cdr.markForCheck();
        },

        error: (err) => {
          console.error('Dashboard loading error:', err);

          this.sections = [];
          this.zones = [];
          this.totals = this.emptyTotals();

          this.summary = {
            demand: 0,
            deposit: 0,
            recovery: 0,
            target: 0
          };

          this.error = 'Failed to load dashboard data. Please try again.';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  /** Only sections whose zone and region are listed in zoneRegions are shown. */
  private isAllowedSection(section: SectionCollection): boolean {
    const zone = this.findZoneName(section.zone);

    if (!zone) {
      return false;
    }

    return this.zoneRegions[zone].some(
      region =>
        region.toLowerCase() ===
        String(section.name ?? '').trim().toLowerCase()
    );
  }

  private findZoneName(zone: string | null | undefined): string | undefined {
    const value = String(zone ?? '').trim().toLowerCase();

    return this.zoneNames.find(name => name.toLowerCase() === value);
  }

  private emptyTotals(): Totals {
    return {
      target: 0,
      cash: 0,
      sgst: 0,
      igstSettlement: 0,
      total: 0
    };
  }

  private toNumber(value: number | string | null | undefined): number {
    const result = Number(value ?? 0);
    return Number.isFinite(result) ? result : 0;
  }

  /**
   * Total Collection = SGST Cash + IGST Settlement.
   * Target and plain SGST are intentionally NOT included.
   */
  private collectionTotal(cash: number, igstSettlement: number): number {
    return cash + igstSettlement;
  }

  private sumTotals(list: SectionCollection[]): Totals {
    const target = list.reduce(
      (sum, section) => sum + this.toNumber(section.target),
      0
    );

    const cash = list.reduce(
      (sum, section) => sum + this.toNumber(section.cash),
      0
    );

    const sgst = list.reduce(
      (sum, section) => sum + this.toNumber(section.sgst),
      0
    );

    const igstSettlement = list.reduce(
      (sum, section) => sum + this.toNumber(section.igstSettlement),
      0
    );

    return {
      target,
      cash,
      sgst,
      igstSettlement,
      total: this.collectionTotal(cash, igstSettlement)
    };
  }

  private buildZones(): void {
    this.zones = this.zoneNames.map(name => {
      const regionOrder = this.zoneRegions[name];

      // Rows follow the order defined in zoneRegions
      const zoneSections = regionOrder
        .map(region =>
          this.sections.find(
            section =>
              this.findZoneName(section.zone) === name &&
              String(section.name).trim().toLowerCase() ===
                region.toLowerCase()
          )
        )
        .filter((section): section is SectionCollection => !!section);

      return {
        name,
        sections: zoneSections,
        totals: this.sumTotals(zoneSections)
      };
    });
  }

  /** Target + Achieved: collection as a percentage of target. */
  achievedPct(collected: number, target: number): number {
    const t = this.toNumber(target);

    return t > 0
      ? Math.round((this.toNumber(collected) / t) * 1000) / 10
      : 0;
  }

  get targetAchievedPct(): number {
    return this.achievedPct(this.totals.total, this.summary.target);
  }

  // Scale every graph bar against the largest displayed amount.
  get maxBarValue(): number {
    return Math.max(
      this.toNumber(this.summary.target),
      this.toNumber(this.totals.cash),
      this.toNumber(this.totals.igstSettlement),
      1
    );
  }

  barPct(value: number): number {
    const amount = this.toNumber(value);

    return amount > 0
      ? Math.max((amount / this.maxBarValue) * 100, 2)
      : 0;
  }

  // Donut shows only the parts that make up Total Collection.
  get donutParts(): DonutPart[] {
    return [
      {
        label: 'SGST Cash',
        value: this.totals.cash,
        color: '#49beff'
      },
      {
        label: 'IGST Settlement',
        value: this.totals.igstSettlement,
        color: '#13deb9'
      }
    ];
  }

  get donutSum(): number {
    return this.donutParts.reduce((sum, part) => sum + part.value, 0);
  }

  donutPct(value: number): number {
    return this.donutSum > 0
      ? Math.round((value / this.donutSum) * 100)
      : 0;
  }

  get donutGradient(): string {
    const sum = this.donutSum;

    if (sum <= 0) {
      return 'conic-gradient(#e9edf5 0% 100%)';
    }

    let start = 0;

    const stops = this.donutParts.map(part => {
      const end = start + (part.value / sum) * 100;
      const stop = `${part.color} ${start}% ${end}%`;
      start = end;
      return stop;
    });

    return `conic-gradient(${stops.join(', ')})`;
  }
}