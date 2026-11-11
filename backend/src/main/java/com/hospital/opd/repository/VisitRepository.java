package com.hospital.opd.repository;

import com.hospital.opd.entity.Visit;
import com.hospital.opd.entity.VisitStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface VisitRepository extends JpaRepository<Visit, Long> {

    boolean existsByPatientIdAndStatus(Long patientId, VisitStatus status);

    @Query("""
            SELECT v FROM Visit v
            JOIN FETCH v.patient
            WHERE v.status = com.hospital.opd.entity.VisitStatus.WAITING
            ORDER BY
              CASE WHEN v.priority = com.hospital.opd.entity.Priority.URGENT THEN 0 ELSE 1 END,
              v.createdAt ASC
            """)
    List<Visit> findWaitingQueueOrdered();
}
