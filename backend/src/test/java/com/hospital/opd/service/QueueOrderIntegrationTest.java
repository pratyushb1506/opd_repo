package com.hospital.opd.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.hospital.opd.dto.QueueItemResponse;
import com.hospital.opd.entity.Gender;
import com.hospital.opd.entity.Patient;
import com.hospital.opd.entity.Priority;
import com.hospital.opd.entity.Visit;
import com.hospital.opd.entity.VisitStatus;
import com.hospital.opd.repository.PatientRepository;
import com.hospital.opd.repository.VisitRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class QueueOrderIntegrationTest {

    @Autowired
    private VisitService visitService;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private VisitRepository visitRepository;

    @BeforeEach
    void clean() {
        visitRepository.deleteAll();
        patientRepository.deleteAll();
    }

    @Test
    void queue_ordersUrgentFirst_thenOldestFirst() {
        Patient routineOlder = savePatient("Asha", "Nair", "9000000001", "MR-TEST-000001");
        Patient urgentNewer = savePatient("Bala", "Iyer", "9000000002", "MR-TEST-000002");
        Patient urgentOlder = savePatient("Chet", "Rao", "9000000003", "MR-TEST-000003");
        Patient routineNewer = savePatient("Diya", "Sen", "9000000004", "MR-TEST-000004");

        Instant t1 = Instant.parse("2026-01-01T08:00:00Z");
        Instant t2 = Instant.parse("2026-01-01T09:00:00Z");
        Instant t3 = Instant.parse("2026-01-01T10:00:00Z");
        Instant t4 = Instant.parse("2026-01-01T11:00:00Z");

        saveVisit(routineOlder, Priority.ROUTINE, t1);
        saveVisit(urgentNewer, Priority.URGENT, t3);
        saveVisit(urgentOlder, Priority.URGENT, t2);
        saveVisit(routineNewer, Priority.ROUTINE, t4);

        List<QueueItemResponse> queue = visitService.getQueue();

        assertThat(queue).extracting(QueueItemResponse::getMrNumber)
                .containsExactly(
                        "MR-TEST-000003", // URGENT oldest
                        "MR-TEST-000002", // URGENT newer
                        "MR-TEST-000001", // ROUTINE oldest
                        "MR-TEST-000004"  // ROUTINE newer
                );
        assertThat(queue.get(0).getPriority()).isEqualTo(Priority.URGENT);
        assertThat(queue.get(1).getPriority()).isEqualTo(Priority.URGENT);
        assertThat(queue.get(2).getPriority()).isEqualTo(Priority.ROUTINE);
        assertThat(queue.get(3).getPriority()).isEqualTo(Priority.ROUTINE);
    }

    private Patient savePatient(String first, String last, String mobile, String mr) {
        return patientRepository.save(Patient.builder()
                .mrNumber(mr)
                .firstName(first)
                .lastName(last)
                .mobile(mobile)
                .dateOfBirth(LocalDate.of(1990, 1, 1))
                .gender(Gender.OTHER)
                .build());
    }

    private void saveVisit(Patient patient, Priority priority, Instant createdAt) {
        visitRepository.save(Visit.builder()
                .patient(patient)
                .priority(priority)
                .status(VisitStatus.WAITING)
                .createdAt(createdAt)
                .build());
    }
}
