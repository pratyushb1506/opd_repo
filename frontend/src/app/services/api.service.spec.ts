import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('registers a patient via POST /api/patients', () => {
    const body = {
      firstName: 'Anita',
      lastName: 'Sharma',
      mobile: '9876543210',
      dateOfBirth: '1990-01-15',
      gender: 'FEMALE' as const
    };

    service.registerPatient(body).subscribe((res) => {
      expect(res.mrNumber).toBe('MR-2026-000001');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/patients');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({
      id: 1,
      mrNumber: 'MR-2026-000001',
      ...body
    });
  });

  it('searches patients with a search query param', () => {
    service.searchPatients('anita').subscribe((res) => {
      expect(res.length).toBe(1);
    });

    const req = httpMock.expectOne(
      (r) => r.url === 'http://localhost:8080/api/patients' && r.params.get('search') === 'anita'
    );
    expect(req.request.method).toBe('GET');
    req.flush([{
      id: 1,
      mrNumber: 'MR-2026-000001',
      firstName: 'Anita',
      lastName: 'Sharma',
      mobile: '9876543210',
      dateOfBirth: '1990-01-15',
      gender: 'FEMALE'
    }]);
  });

  it('loads waiting queue and completes a visit', () => {
    service.getQueue().subscribe((items) => {
      expect(items[0].priority).toBe('URGENT');
    });
    const queueReq = httpMock.expectOne('http://localhost:8080/api/queue');
    expect(queueReq.request.method).toBe('GET');
    queueReq.flush([{
      visitId: 9,
      mrNumber: 'MR-2026-000002',
      patientName: 'Ravi Kumar',
      ageInYears: 40,
      priority: 'URGENT',
      waitingSince: '2026-03-11T10:00:00Z'
    }]);

    service.completeVisit(9).subscribe((visit) => {
      expect(visit.status).toBe('COMPLETED');
    });
    const completeReq = httpMock.expectOne('http://localhost:8080/api/visits/9/complete');
    expect(completeReq.request.method).toBe('PATCH');
    completeReq.flush({
      id: 9,
      patientId: 2,
      priority: 'URGENT',
      status: 'COMPLETED',
      createdAt: '2026-03-11T10:00:00Z',
      completedAt: '2026-03-11T10:30:00Z'
    });
  });
});
