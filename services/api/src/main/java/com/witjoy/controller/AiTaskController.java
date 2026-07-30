package com.witjoy.controller;

import com.witjoy.dto.AiQuestionGenerateRequest;
import com.witjoy.dto.AiTaskCreateResponse;
import com.witjoy.dto.AiTaskStatusResponse;
import com.witjoy.dto.ApiResponse;
import com.witjoy.service.AiTaskService;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v2/ai/tasks")
public class AiTaskController {
    private final AiTaskService taskService;

    public AiTaskController(AiTaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping("/questions")
    public ResponseEntity<ApiResponse<AiTaskCreateResponse>> createQuestionTask(
            HttpServletRequest request, @Valid @RequestBody AiQuestionGenerateRequest body) {
        AiTaskCreateResponse task = taskService.createQuestionTask(currentUserId(request), body);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success("任务已受理", task));
    }

    @GetMapping("/{taskId}")
    public ApiResponse<AiTaskStatusResponse> getTask(
            HttpServletRequest request, @PathVariable("taskId") String taskId) {
        return ApiResponse.success(taskService.getTask(currentUserId(request), taskId));
    }

    private Long currentUserId(HttpServletRequest request) {
        return (Long) request.getAttribute("currentUserId");
    }
}
