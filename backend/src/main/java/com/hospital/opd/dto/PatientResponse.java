package com.hospital.opd.dto;

import com.hospital.opd.entity.Gender;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientResponse {

    private Long id;
    private String mrNumber;
    private String firstName;
    private String lastName;
    private String mobile;
    private LocalDate dateOfBirth;
    private Gender gender;
}
