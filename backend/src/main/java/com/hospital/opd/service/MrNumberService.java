package com.hospital.opd.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.Year;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MrNumberService {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Allocates the next MR number using an H2 sequence (atomic under concurrency).
     * Format: MR-{year}-{6-digit zero-padded}. Unique constraint on patients.mr_number is a safety net.
     */
    @Transactional
    public String nextMrNumber() {
        Number next = (Number) entityManager
                .createNativeQuery("SELECT NEXT VALUE FOR mr_number_seq")
                .getSingleResult();
        return String.format("MR-%d-%06d", Year.now().getValue(), next.longValue());
    }
}
