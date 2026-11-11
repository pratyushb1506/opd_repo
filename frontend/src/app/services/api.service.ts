import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  PatientRequest,
  PatientResponse,
  Priority,
  QueueItem,
  VisitRequest,
  VisitResponse
} from '../models/patient.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'http://localhost:8080/api';

  constructor(private readonly http: HttpClient) {}

  registerPatient(body: PatientRequest): Observable<PatientResponse> {
    return this.http.post<PatientResponse>(`${this.baseUrl}/patients`, body);
  }

  searchPatients(search: string): Observable<PatientResponse[]> {
    let params = new HttpParams();
    if (search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<PatientResponse[]>(`${this.baseUrl}/patients`, { params });
  }

  addToQueue(patientId: number, priority: Priority): Observable<VisitResponse> {
    const body: VisitRequest = { patientId, priority };
    return this.http.post<VisitResponse>(`${this.baseUrl}/visits`, body);
  }

  getQueue(): Observable<QueueItem[]> {
    return this.http.get<QueueItem[]>(`${this.baseUrl}/queue`);
  }

  completeVisit(visitId: number): Observable<VisitResponse> {
    return this.http.patch<VisitResponse>(`${this.baseUrl}/visits/${visitId}/complete`, {});
  }
}
