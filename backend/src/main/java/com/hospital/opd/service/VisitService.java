package com.hospital.opd.service;

import com.hospital.opd.dto.QueueItemResponse;
import com.hospital.opd.dto.VisitRequest;
import com.hospital.opd.dto.VisitResponse;
import com.hospital.opd.entity.Patient;
import com.hospital.opd.entity.Visit;
import com.hospital.opd.entity.VisitStatus;
import com.hospital.opd.exception.ConflictException;
import com.hospital.opd.exception.NotFoundException;
import com.hospital.opd.repository.PatientRepository;
import com.hospital.opd.repository.VisitRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class VisitService {

    private final VisitRepository visitRepository;
    private final PatientRepository patientRepository;

    @Transactional
    public VisitResponse create(VisitRequest request) {
        // Lock patient row so two concurrent "add to queue" calls cannot both create WAITING visits.
        Patient patient = patientRepository.findByIdForUpdate(request.getPatientId())
                .orElseThrow(() -> new NotFoundException("patient not found"));

        if (visitRepository.existsByPatientIdAndStatus(patient.getId(), VisitStatus.WAITING)) {
            throw new ConflictException("patientId", "patient already has a waiting visit");
        }

        Visit visit = Visit.builder()
                .patient(patient)
                .priority(request.getPriority())
                .status(VisitStatus.WAITING)
                .createdAt(Instant.now())
                .build();

        return toVisitResponse(visitRepository.save(visit));
    }

    @Transactional(readOnly = true)
    public List<QueueItemResponse> getQueue() {
        return visitRepository.findWaitingQueueOrdered().stream()
                .map(this::toQueueItem)
                .toList();
    }

    @Transactional
    public VisitResponse complete(Long visitId) {
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new NotFoundException("visit not found"));

        if (visit.getStatus() != VisitStatus.WAITING) {
            throw new ConflictException("status", "visit is not waiting");
        }

        visit.setStatus(VisitStatus.COMPLETED);
        visit.setCompletedAt(Instant.now());
        return toVisitResponse(visitRepository.save(visit));
    }

    private QueueItemResponse toQueueItem(Visit visit) {
        Patient patient = visit.getPatient();
        return QueueItemResponse.builder()
                .visitId(visit.getId())
                .mrNumber(patient.getMrNumber())
                .patientName(patient.getFirstName() + " " + patient.getLastName())
                .ageInYears(Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears())
                .priority(visit.getPriority())
                .waitingSince(visit.getCreatedAt())
                .build();
    }

    private VisitResponse toVisitResponse(Visit visit) {
        return VisitResponse.builder()
                .id(visit.getId())
                .patientId(visit.getPatient().getId())
                .priority(visit.getPriority())
                .status(visit.getStatus())
                .createdAt(visit.getCreatedAt())
                .completedAt(visit.getCompletedAt())
                .build();
    }
}
