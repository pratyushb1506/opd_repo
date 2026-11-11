import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DeskStateService {
  private readonly waitingCountSubject = new BehaviorSubject<number>(0);
  readonly waitingCount$ = this.waitingCountSubject.asObservable();

  setWaitingCount(count: number): void {
    this.waitingCountSubject.next(count);
  }
}
