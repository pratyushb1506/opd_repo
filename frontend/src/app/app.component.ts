import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiService } from './services/api.service';
import { DeskStateService } from './services/desk-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly title = 'OPD Desk';
  readonly waitingCount$ = this.deskState.waitingCount$;

  constructor(
    private readonly api: ApiService,
    private readonly deskState: DeskStateService
  ) {}

  ngOnInit(): void {
    this.api.getQueue().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => this.deskState.setWaitingCount(items.length),
      error: () => this.deskState.setWaitingCount(0)
    });
  }
}
