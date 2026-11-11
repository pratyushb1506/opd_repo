import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { RegisterComponent } from './register.component';
import { ApiService } from '../../services/api.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj('ApiService', ['registerPatient', 'addToQueue', 'getQueue']);
    api.getQueue.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        { provide: ApiService, useValue: api },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps submit disabled until the form is valid', () => {
    expect(component.form.invalid).toBeTrue();

    component.form.setValue({
      firstName: 'Anita',
      lastName: 'Sharma',
      mobile: '9876543210',
      dateOfBirth: '1990-01-15',
      gender: 'FEMALE'
    });

    expect(component.form.valid).toBeTrue();
  });

  it('rejects invalid mobile and future date of birth', () => {
    component.form.controls.mobile.setValue('12345');
    component.form.controls.mobile.markAsTouched();
    expect(component.fieldError('mobile')).toContain('10 digits');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const iso = tomorrow.toISOString().slice(0, 10);
    component.form.controls.dateOfBirth.setValue(iso);
    component.form.controls.dateOfBirth.markAsTouched();
    expect(component.fieldError('dateOfBirth')).toContain('future');
  });

  it('maps 409 duplicate mobile onto the mobile field', () => {
    component.form.setValue({
      firstName: 'Anita',
      lastName: 'Sharma',
      mobile: '9876543210',
      dateOfBirth: '1990-01-15',
      gender: 'FEMALE'
    });

    api.registerPatient.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 409,
      error: { errors: { mobile: 'mobile already registered' } }
    })));

    component.submit();

    expect(component.fieldError('mobile')).toBe('mobile already registered');
    expect(component.formError).toBe('mobile already registered');
  });

  it('moves to queue step after successful registration', () => {
    component.form.setValue({
      firstName: 'Anita',
      lastName: 'Sharma',
      mobile: '9876543210',
      dateOfBirth: '1990-01-15',
      gender: 'FEMALE'
    });

    api.registerPatient.and.returnValue(of({
      id: 1,
      mrNumber: 'MR-2026-000001',
      firstName: 'Anita',
      lastName: 'Sharma',
      mobile: '9876543210',
      dateOfBirth: '1990-01-15',
      gender: 'FEMALE'
    }));

    component.submit();

    expect(component.successMr).toBe('MR-2026-000001');
    expect(component.step).toBe('enqueue');
    expect(component.form.value.firstName).toBe('');
  });

  it('can add the new patient to the queue from step 2', () => {
    component.registered = {
      id: 1,
      mrNumber: 'MR-2026-000001',
      firstName: 'Anita',
      lastName: 'Sharma',
      mobile: '9876543210',
      dateOfBirth: '1990-01-15',
      gender: 'FEMALE'
    };
    component.step = 'enqueue';
    component.selectedPriority = 'URGENT';
    api.addToQueue.and.returnValue(of({
      id: 9,
      patientId: 1,
      priority: 'URGENT',
      status: 'WAITING',
      createdAt: '2026-03-11T10:00:00Z',
      completedAt: null
    }));

    component.addToQueueNow();

    expect(api.addToQueue).toHaveBeenCalledWith(1, 'URGENT');
    expect(component.step).toBe('done');
  });
});
