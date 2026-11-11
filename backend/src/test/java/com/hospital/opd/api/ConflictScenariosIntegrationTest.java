package com.hospital.opd.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ConflictScenariosIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void duplicateMobile_returns409() throws Exception {
        String body = patientJson("Amit", "Shah", "9111111111");

        mockMvc.perform(post("/api/patients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/patients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors.mobile").value("mobile already registered"));
    }

    @Test
    void secondWaitingVisit_returns409() throws Exception {
        Long patientId = register("Neha", "Patel", "9222222222");

        mockMvc.perform(post("/api/visits")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(visitJson(patientId, "ROUTINE")))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/visits")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(visitJson(patientId, "URGENT")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors.patientId").value("patient already has a waiting visit"));
    }

    @Test
    void completeNonWaiting_returns409() throws Exception {
        Long patientId = register("Omar", "Khan", "9333333333");

        MvcResult created = mockMvc.perform(post("/api/visits")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(visitJson(patientId, "ROUTINE")))
                .andExpect(status().isCreated())
                .andReturn();

        Long visitId = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(patch("/api/visits/" + visitId + "/complete"))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/visits/" + visitId + "/complete"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors.status").value("visit is not waiting"));
    }

    private Long register(String first, String last, String mobile) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/patients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(patientJson(first, last, mobile)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("id").asLong();
    }

    private String patientJson(String first, String last, String mobile) {
        return """
                {
                  "firstName": "%s",
                  "lastName": "%s",
                  "mobile": "%s",
                  "dateOfBirth": "1988-05-20",
                  "gender": "MALE"
                }
                """.formatted(first, last, mobile);
    }

    private String visitJson(Long patientId, String priority) {
        return """
                {
                  "patientId": %d,
                  "priority": "%s"
                }
                """.formatted(patientId, priority);
    }
}
