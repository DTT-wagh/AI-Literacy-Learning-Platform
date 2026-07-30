package com.witjoy.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AiTaskCreateResponse {
    private String taskId;
    private String status;
}
