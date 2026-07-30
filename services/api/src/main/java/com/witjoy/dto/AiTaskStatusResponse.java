package com.witjoy.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AiTaskStatusResponse {
    private String taskId;
    private String status;
    private List<AiQuestionResponse> result;
    private String errorMessage;
}
