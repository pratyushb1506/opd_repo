package com.hospital.opd.dto;

import com.hospital.opd.entity.Priority;
import com.hospital.opd.entity.VisitStatus;
import java.time.Instant;
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
public class VisitResponse {

    private Long id;
    private Long patientId;
    private Priority priority;
    private VisitStatus status;
    private Instant createdAt;
    private Instant completedAt;
}
