package com.hospital.opd.dto;

import com.hospital.opd.entity.Priority;
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
public class QueueItemResponse {

    private Long visitId;
    private String mrNumber;
    private String patientName;
    private int ageInYears;
    private Priority priority;
    private Instant waitingSince;
}
