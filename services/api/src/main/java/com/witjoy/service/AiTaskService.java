package com.witjoy.service;

import com.witjoy.dto.AiQuestionGenerateRequest;
import com.witjoy.dto.AiTaskCreateResponse;
import com.witjoy.dto.AiTaskStatusResponse;

public interface AiTaskService {
    AiTaskCreateResponse createQuestionTask(Long userId, AiQuestionGenerateRequest request);

    AiTaskStatusResponse getTask(Long userId, String taskId);
}
