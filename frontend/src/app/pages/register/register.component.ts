import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../services/api.service';
import { DeskStateService } from '../../services/desk-state.service';
import { ApiErrorBody, Gender, PatientResponse, Priority } from '../../models/patient.model';

function lettersOnly(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').toString();
  if (!value) {
    return null;
  }
  return /^[A-Za-z]+$/.test(value) ? null : { lettersOnly: true };
}

function notFutureDate(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').toString();
  if (!value) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dob = new Date(value + 'T00:00:00');
  return dob.getTime() > today.getTime() ? { futureDate: true } : null;
}

type Step = 'form' | 'enqueue' | 'done';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly genders: Gender[] = ['MALE', 'FEMALE', 'OTHER'];
  step: Step = 'form';
  submitting = false;
  enqueueing = false;
  successMr: string | null = null;
  registered: PatientResponse | null = null;
  selectedPriority: Priority = 'ROUTINE';
  queuedSuccessfully = false;
  formError: string | null = null;
  enqueueError: string | null = null;

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(50), lettersOnly]],
    lastName: ['', [Validators.required, Validators.maxLength(50), lettersOnly]],
    mobile: ['', [Validators.required, Validators.pattern(/^[6-9][0-9]{9}$/)]],
    dateOfBirth: ['', [Validators.required, notFutureDate]],
    gender: ['' as Gender | '', Validators.required]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly api: ApiService,
    private readonly deskState: DeskStateService
  ) {}

  fieldError(name: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[name];
    if (!control || !(control.touched || control.dirty) || !control.errors) {
      return null;
    }
    if (control.errors['required']) {
      return 'Required';
    }
    if (control.errors['maxlength']) {
      return 'Max 50 characters';
    }
    if (control.errors['lettersOnly']) {
      return 'Letters only';
    }
    if (control.errors['pattern']) {
      return 'Must be 10 digits starting with 6-9';
    }
    if (control.errors['futureDate']) {
      return 'Date of birth cannot be in the future';
    }
    if (control.errors['server']) {
      return control.errors['server'] as string;
    }
    return 'Invalid value';
  }

  submit(): void {
    this.form.markAllAsTouched();
    this.clearServerErrors();
    this.formError = null;

    if (this.form.invalid || this.submitting) {
      return;
    }

    const value = this.form.getRawValue();
    this.submitting = true;

    this.api.registerPatient({
      firstName: value.firstName,
      lastName: value.lastName,
      mobile: value.mobile,
      dateOfBirth: value.dateOfBirth,
      gender: value.gender as Gender
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (patient) => {
        this.submitting = false;
        this.registered = patient;
        this.successMr = patient.mrNumber;
        this.selectedPriority = 'ROUTINE';
        this.queuedSuccessfully = false;
        this.enqueueError = null;
        this.step = 'enqueue';
        this.form.reset({
          firstName: '',
          lastName: '',
          mobile: '',
          dateOfBirth: '',
          gender: ''
        });
      },
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        this.applyServerErrors(err);
      }
    });
  }

  setPriority(priority: Priority): void {
    this.selectedPriority = priority;
  }

  addToQueueNow(): void {
    if (!this.registered || this.enqueueing) {
      return;
    }
    this.enqueueing = true;
    this.enqueueError = null;

    this.api.addToQueue(this.registered.id, this.selectedPriority)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.enqueueing = false;
          this.queuedSuccessfully = true;
          this.step = 'done';
          this.api.getQueue().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (items) => this.deskState.setWaitingCount(items.length)
          });
        },
        error: (err: HttpErrorResponse) => {
          this.enqueueing = false;
          if (err.status === 409) {
            this.enqueueError = 'already in queue';
            this.queuedSuccessfully = false;
            this.step = 'done';
            return;
          }
          const body = err.error as ApiErrorBody | null;
          this.enqueueError = body?.errors?.['message']
            ?? Object.values(body?.errors ?? {})[0]
            ?? 'Could not add to queue';
        }
      });
  }

  skipQueue(): void {
    this.queuedSuccessfully = false;
    this.enqueueError = null;
    this.step = 'done';
  }

  registerAnother(): void {
    this.step = 'form';
    this.registered = null;
    this.successMr = null;
    this.queuedSuccessfully = false;
    this.enqueueError = null;
    this.formError = null;
    this.selectedPriority = 'ROUTINE';
  }

  private clearServerErrors(): void {
    (Object.keys(this.form.controls) as Array<keyof typeof this.form.controls>).forEach((key) => {
      const control = this.form.controls[key];
      if (control.errors?.['server']) {
        const { server, ...rest } = control.errors;
        control.setErrors(Object.keys(rest).length ? rest : null);
      }
    });
  }

  private applyServerErrors(err: HttpErrorResponse): void {
    const body = err.error as ApiErrorBody | null;
    const errors = body?.errors ?? {};

    if (err.status === 409) {
      const mobileMsg = errors['mobile'] ?? 'Mobile already registered';
      this.form.controls.mobile.setErrors({ server: mobileMsg });
      this.form.controls.mobile.markAsTouched();
      this.formError = mobileMsg;
      return;
    }

    if (err.status === 400) {
      let mapped = false;
      Object.entries(errors).forEach(([field, message]) => {
        const control = this.form.get(field);
        if (control) {
          control.setErrors({ ...(control.errors ?? {}), server: message });
          control.markAsTouched();
          mapped = true;
        }
      });
      if (!mapped) {
        this.formError = Object.values(errors)[0] ?? 'Please fix the highlighted fields';
      }
      return;
    }

    this.formError = 'Could not register patient. Please try again.';
  }
}
