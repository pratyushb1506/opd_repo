package com.hospital.opd.repository;

import com.hospital.opd.entity.Patient;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PatientRepository extends JpaRepository<Patient, Long> {

    boolean existsByMobile(String mobile);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Patient p WHERE p.id = :id")
    Optional<Patient> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            SELECT p FROM Patient p
            WHERE LOWER(p.firstName) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(p.lastName) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(CONCAT(p.firstName, ' ', p.lastName)) LIKE LOWER(CONCAT('%', :search, '%'))
               OR p.mobile LIKE CONCAT('%', :search, '%')
            ORDER BY p.id
            """)
    List<Patient> search(@Param("search") String search);
}
