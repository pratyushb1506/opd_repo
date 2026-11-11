package com.hospital.opd.dto;

import com.hospital.opd.entity.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
public class PatientRequest {

    @NotBlank(message = "must not be blank")
    @Size(max = 50, message = "must be at most 50 characters")
    @Pattern(regexp = "^[A-Za-z]+$", message = "letters only")
    private String firstName;

    @NotBlank(message = "must not be blank")
    @Size(max = 50, message = "must be at most 50 characters")
    @Pattern(regexp = "^[A-Za-z]+$", message = "letters only")
    private String lastName;

    @NotBlank(message = "must not be blank")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "must be 10 digits starting with 6-9")
    private String mobile;

    @NotNull(message = "must not be null")
    @PastOrPresent(message = "must not be in the future")
    private LocalDate dateOfBirth;

    @NotNull(message = "must not be null")
    private Gender gender;
}
