package com.hospital.opd.dto;

import com.hospital.opd.entity.Priority;
import jakarta.validation.constraints.NotNull;
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
public class VisitRequest {

    @NotNull(message = "must not be null")
    private Long patientId;

    @NotNull(message = "must not be null")
    private Priority priority;
}
