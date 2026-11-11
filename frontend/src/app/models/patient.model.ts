export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type Priority = 'ROUTINE' | 'URGENT';

export interface PatientRequest {
  firstName: string;
  lastName: string;
  mobile: string;
  dateOfBirth: string;
  gender: Gender;
}

export interface PatientResponse {
  id: number;
  mrNumber: string;
  firstName: string;
  lastName: string;
  mobile: string;
  dateOfBirth: string;
  gender: Gender;
}

export interface VisitRequest {
  patientId: number;
  priority: Priority;
}

export interface VisitResponse {
  id: number;
  patientId: number;
  priority: Priority;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

export interface QueueItem {
  visitId: number;
  mrNumber: string;
  patientName: string;
  ageInYears: number;
  priority: Priority;
  waitingSince: string;
}

export interface ApiErrorBody {
  errors: Record<string, string>;
}
