package com.hospital.opd.controller;

import com.hospital.opd.dto.QueueItemResponse;
import com.hospital.opd.dto.VisitRequest;
import com.hospital.opd.dto.VisitResponse;
import com.hospital.opd.service.VisitService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class VisitController {

    private final VisitService visitService;

    @PostMapping("/visits")
    @ResponseStatus(HttpStatus.CREATED)
    public VisitResponse create(@Valid @RequestBody VisitRequest request) {
        return visitService.create(request);
    }

    @GetMapping("/queue")
    public List<QueueItemResponse> queue() {
        return visitService.getQueue();
    }

    @PatchMapping("/visits/{id}/complete")
    public VisitResponse complete(@PathVariable Long id) {
        return visitService.complete(id);
    }
}
