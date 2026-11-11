import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { QueueComponent } from './queue.component';
import { ApiService } from '../../services/api.service';

describe('QueueComponent', () => {
  let component: QueueComponent;
  let fixture: ComponentFixture<QueueComponent>;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj('ApiService', [
      'searchPatients',
      'getQueue',
      'addToQueue',
      'completeVisit'
    ]);
    api.getQueue.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [QueueComponent],
      providers: [{ provide: ApiService, useValue: api }]
    }).compileComponents();

    fixture = TestBed.createComponent(QueueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('loads the queue on init', () => {
    expect(api.getQueue).toHaveBeenCalled();
  });

  it('debounces live search input', fakeAsync(() => {
    api.searchPatients.and.returnValue(of([]));
    component.onSearchChange('pri');
    tick(200);
    expect(api.searchPatients).not.toHaveBeenCalled();
    tick(150);
    expect(api.searchPatients).toHaveBeenCalledWith('pri');
  }));

  it('runs search immediately when Search is clicked', () => {
    api.searchPatients.and.returnValue(of([]));
    component.search = 'anita';
    component.runSearch();
    expect(api.searchPatients).toHaveBeenCalledWith('anita');
  });

  it('shows already-in-queue style error on 409 when adding', () => {
    api.addToQueue.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 409,
      error: { errors: { patientId: 'patient already has a waiting visit' } }
    })));

    component.addToQueue({
      id: 1,
      mrNumber: 'MR-2026-000001',
      firstName: 'Anita',
      lastName: 'Sharma',
      mobile: '9876543210',
      dateOfBirth: '1990-01-15',
      gender: 'FEMALE'
    });

    expect(component.actionError).toBe('already in queue');
  });

  it('refreshes queue after complete', () => {
    api.getQueue.calls.reset();
    api.completeVisit.and.returnValue(of({
      id: 3,
      patientId: 1,
      priority: 'ROUTINE',
      status: 'COMPLETED',
      createdAt: '2026-03-11T10:00:00Z',
      completedAt: '2026-03-11T11:00:00Z'
    }));
    api.getQueue.and.returnValue(of([]));

    component.complete({
      visitId: 3,
      mrNumber: 'MR-2026-000001',
      patientName: 'Anita Sharma',
      ageInYears: 36,
      priority: 'ROUTINE',
      waitingSince: '2026-03-11T10:00:00Z'
    });

    expect(api.completeVisit).toHaveBeenCalledWith(3);
    expect(api.getQueue).toHaveBeenCalled();
  });
});
