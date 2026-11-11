package com.hospital.opd.service;

import com.hospital.opd.dto.PatientRequest;
import com.hospital.opd.dto.PatientResponse;
import com.hospital.opd.entity.Patient;
import com.hospital.opd.exception.ConflictException;
import com.hospital.opd.repository.PatientRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PatientService {

    private static final int DEFAULT_LIMIT = 100;

    private final PatientRepository patientRepository;
    private final MrNumberService mrNumberService;

    @Transactional
    public PatientResponse register(PatientRequest request) {
        if (patientRepository.existsByMobile(request.getMobile())) {
            throw new ConflictException("mobile", "mobile already registered");
        }

        Patient patient = Patient.builder()
                .mrNumber(mrNumberService.nextMrNumber())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .mobile(request.getMobile())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .build();

        return toResponse(patientRepository.save(patient));
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> search(String search) {
        if (search == null || search.isBlank()) {
            return patientRepository.findAll(PageRequest.of(0, DEFAULT_LIMIT)).stream()
                    .map(this::toResponse)
                    .toList();
        }
        // Strip LIKE wildcards so user input cannot broaden the match unintentionally.
        String term = search.trim().replace("%", "").replace("_", "");
        if (term.isBlank()) {
            return List.of();
        }
        return patientRepository.search(term).stream()
                .map(this::toResponse)
                .toList();
    }

    private PatientResponse toResponse(Patient patient) {
        return PatientResponse.builder()
                .id(patient.getId())
                .mrNumber(patient.getMrNumber())
                .firstName(patient.getFirstName())
                .lastName(patient.getLastName())
                .mobile(patient.getMobile())
                .dateOfBirth(patient.getDateOfBirth())
                .gender(patient.getGender())
                .build();
    }
}
