package com.hospital.opd.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.hospital.opd.exception.GlobalExceptionHandler;
import com.hospital.opd.service.PatientService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = PatientController.class)
@Import(GlobalExceptionHandler.class)
class PatientValidationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PatientService patientService;

    @Test
    void invalidMobile_returns400WithErrorsMap() throws Exception {
        String body = """
                {
                  "firstName": "Riya",
                  "lastName": "Sharma",
                  "mobile": "5123456789",
                  "dateOfBirth": "1990-01-15",
                  "gender": "FEMALE"
                }
                """;

        mockMvc.perform(post("/api/patients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.mobile").value("must be 10 digits starting with 6-9"));
    }

    @Test
    void futureDateOfBirth_returns400WithErrorsMap() throws Exception {
        String body = """
                {
                  "firstName": "Riya",
                  "lastName": "Sharma",
                  "mobile": "9876543210",
                  "dateOfBirth": "2099-01-15",
                  "gender": "FEMALE"
                }
                """;

        mockMvc.perform(post("/api/patients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.dateOfBirth").value("must not be in the future"));
    }

    @Test
    void badName_returns400WithErrorsMap() throws Exception {
        String body = """
                {
                  "firstName": "Riya123",
                  "lastName": "Sharma",
                  "mobile": "9876543210",
                  "dateOfBirth": "1990-01-15",
                  "gender": "FEMALE"
                }
                """;

        mockMvc.perform(post("/api/patients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.firstName").value("letters only"));
    }
}
