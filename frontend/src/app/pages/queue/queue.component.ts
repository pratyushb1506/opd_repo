import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  of
} from 'rxjs';
import { ApiService } from '../../services/api.service';
import { DeskStateService } from '../../services/desk-state.service';
import {
  ApiErrorBody,
  PatientResponse,
  Priority,
  QueueItem
} from '../../models/patient.model';

@Component({
  selector: 'app-queue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './queue.component.html',
  styleUrl: './queue.component.css'
})
export class QueueComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchInput$ = new Subject<string>();
  private readonly flashTimers = new Map<number, ReturnType<typeof setTimeout>>();

  search = '';
  results: PatientResponse[] = [];
  queue: QueueItem[] = [];
  priorities: Record<number, Priority> = {};
  addingIds = new Set<number>();
  completingIds = new Set<number>();
  flashIds = new Set<number>();
  searched = false;
  searching = false;
  loadingQueue = false;
  now = Date.now();
  searchError: string | null = null;
  actionError: string | null = null;
  actionMessage: string | null = null;

  constructor(
    private readonly api: ApiService,
    private readonly deskState: DeskStateService
  ) {
    this.destroyRef.onDestroy(() => {
      this.flashTimers.forEach((timer) => clearTimeout(timer));
      this.flashTimers.clear();
    });
  }

  ngOnInit(): void {
    this.refreshQueue();

    this.searchInput$.pipe(
      debounceTime(320),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((term) => this.performSearch(term, false));

    const tickHandle = setInterval(() => {
      this.now = Date.now();
    }, 15000);
    const pollHandle = setInterval(() => this.refreshQueue(true), 20000);

    this.destroyRef.onDestroy(() => {
      clearInterval(tickHandle);
      clearInterval(pollHandle);
    });
  }

  onSearchChange(value: string): void {
    this.search = value;
    this.searchInput$.next(value);
  }

  /** Explicit Search button — always runs, even if the term is unchanged. */
  runSearch(): void {
    this.performSearch(this.search, true);
  }

  private performSearch(term: string, force: boolean): void {
    const q = term.trim();
    if (!q) {
      this.results = [];
      this.searched = false;
      this.searching = false;
      this.searchError = null;
      return;
    }

    this.searching = true;
    this.searched = true;
    this.searchError = null;

    this.api.searchPatients(q).pipe(
      catchError(() => {
        this.searchError = 'Could not search patients.';
        return of([] as PatientResponse[]);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((patients) => {
      // Ignore stale responses if the box changed (unless this was a forced button search).
      if (!force && this.search.trim() !== q) {
        return;
      }
      this.searching = false;
      this.results = patients;
      patients.forEach((p) => {
        if (!this.priorities[p.id]) {
          this.priorities[p.id] = 'ROUTINE';
        }
      });
    });
  }

  setPriority(patientId: number, priority: Priority): void {
    this.priorities[patientId] = priority;
  }

  addToQueue(patient: PatientResponse): void {
    if (this.addingIds.has(patient.id)) {
      return;
    }
    const priority = this.priorities[patient.id] ?? 'ROUTINE';
    this.actionError = null;
    this.actionMessage = null;
    this.addingIds = new Set(this.addingIds).add(patient.id);

    this.api.addToQueue(patient.id, priority).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.addingIds = new Set([...this.addingIds].filter((id) => id !== patient.id));
        this.actionMessage = `${patient.firstName} ${patient.lastName} added (${priority}).`;
        this.refreshQueue();
      },
      error: (err: HttpErrorResponse) => {
        this.addingIds = new Set([...this.addingIds].filter((id) => id !== patient.id));
        this.actionError = err.status === 409
          ? 'already in queue'
          : this.readError(err, 'Could not add to queue');
      }
    });
  }

  complete(item: QueueItem): void {
    if (this.completingIds.has(item.visitId)) {
      return;
    }
    this.actionError = null;
    this.actionMessage = null;
    this.completingIds = new Set(this.completingIds).add(item.visitId);

    this.api.completeVisit(item.visitId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.completingIds = new Set([...this.completingIds].filter((id) => id !== item.visitId));
        this.actionMessage = `Completed ${item.patientName}.`;
        this.queue = this.queue.filter((q) => q.visitId !== item.visitId);
        this.deskState.setWaitingCount(this.queue.length);
        this.refreshQueue(true);
      },
      error: (err: HttpErrorResponse) => {
        this.completingIds = new Set([...this.completingIds].filter((id) => id !== item.visitId));
        this.actionError = this.readError(err, 'Could not complete visit');
        this.refreshQueue();
      }
    });
  }

  refreshQueue(silent = false): void {
    if (!silent) {
      this.loadingQueue = true;
    }
    this.api.getQueue().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        this.loadingQueue = false;
        const previous = new Set(this.queue.map((q) => q.visitId));
        this.queue = items;
        this.deskState.setWaitingCount(items.length);
        items.forEach((item) => {
          if (!previous.has(item.visitId) && previous.size > 0) {
            this.markFlash(item.visitId);
          }
        });
      },
      error: () => {
        this.loadingQueue = false;
        if (!silent) {
          this.actionError = 'Could not load queue.';
        }
      }
    });
  }

  waitingLabel(iso: string): string {
    const mins = Math.max(0, Math.floor((this.now - new Date(iso).getTime()) / 60000));
    if (mins < 1) {
      return 'just now';
    }
    if (mins === 1) {
      return '1 min';
    }
    if (mins < 60) {
      return `${mins} min`;
    }
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem ? `${hours}h ${rem}m` : `${hours}h`;
  }

  urgentCount(): number {
    return this.queue.filter((q) => q.priority === 'URGENT').length;
  }

  private markFlash(visitId: number): void {
    const existing = this.flashTimers.get(visitId);
    if (existing) {
      clearTimeout(existing);
    }
    this.flashIds = new Set(this.flashIds).add(visitId);
    const timer = setTimeout(() => {
      this.flashIds = new Set([...this.flashIds].filter((id) => id !== visitId));
      this.flashTimers.delete(visitId);
    }, 1800);
    this.flashTimers.set(visitId, timer);
  }

  private readError(err: HttpErrorResponse, fallback: string): string {
    const body = err.error as ApiErrorBody | null;
    const errors = body?.errors ?? {};
    return errors['message']
      ?? errors['patientId']
      ?? Object.values(errors)[0]
      ?? fallback;
  }
}
