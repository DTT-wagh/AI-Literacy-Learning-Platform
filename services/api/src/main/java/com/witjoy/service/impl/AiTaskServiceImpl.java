package com.witjoy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.witjoy.dto.AiQuestionGenerateRequest;
import com.witjoy.dto.AiQuestionResponse;
import com.witjoy.dto.AiTaskCreateResponse;
import com.witjoy.dto.AiTaskStatusResponse;
import com.witjoy.aiquestion.AiQuestionInputSafetyValidator;
import com.witjoy.entity.AiTask;
import com.witjoy.entity.AiTaskStatus;
import com.witjoy.entity.AiTaskType;
import com.witjoy.exception.BusinessException;
import com.witjoy.mapper.AiTaskMapper;
import com.witjoy.service.AiTaskService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.RejectedExecutionException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.core.task.TaskRejectedException;

@Service
public class AiTaskServiceImpl implements AiTaskService {
    private final AiTaskMapper taskMapper;
    private final ObjectMapper objectMapper;
    private final AiQuestionTaskWorker taskWorker;
    private final AiQuestionInputSafetyValidator inputSafetyValidator;

    public AiTaskServiceImpl(AiTaskMapper taskMapper, ObjectMapper objectMapper,
                             AiQuestionTaskWorker taskWorker,
                             AiQuestionInputSafetyValidator inputSafetyValidator) {
        this.taskMapper = taskMapper;
        this.objectMapper = objectMapper;
        this.taskWorker = taskWorker;
        this.inputSafetyValidator = inputSafetyValidator;
    }

    @Override
    public AiTaskCreateResponse createQuestionTask(Long userId, AiQuestionGenerateRequest request) {
        inputSafetyValidator.validate(request);
        AiTask task = new AiTask();
        task.setUserId(userId);
        task.setTaskType(AiTaskType.QUESTION_GENERATE.name());
        task.setStatus(AiTaskStatus.PENDING.name());
        task.setCreatedTime(LocalDateTime.now());
        try {
            task.setInputData(objectMapper.writeValueAsString(request));
        } catch (JsonProcessingException exception) {
            throw new BusinessException(500, "任务参数保存失败");
        }
        taskMapper.insert(task);

        try {
            CompletableFuture<Void> execution = taskWorker.execute(task.getId());
            execution.exceptionally(exception -> {
                taskWorker.markRejected(task.getId());
                return null;
            });
        } catch (TaskRejectedException exception) {
            taskWorker.markRejected(task.getId());
            throw new BusinessException(503, "AI任务队列繁忙，请稍后重试");
        } catch (RejectedExecutionException exception) {
            taskWorker.markRejected(task.getId());
            throw new BusinessException(503, "AI任务队列繁忙，请稍后重试");
        }
        return new AiTaskCreateResponse(String.valueOf(task.getId()), AiTaskStatus.PENDING.name());
    }

    @Override
    public AiTaskStatusResponse getTask(Long userId, String taskId) {
        long id;
        try {
            id = Long.parseLong(taskId);
        } catch (NumberFormatException exception) {
            throw new BusinessException(404, "任务不存在");
        }
        AiTask task = taskMapper.selectOne(new LambdaQueryWrapper<AiTask>()
                .eq(AiTask::getId, id)
                .eq(AiTask::getUserId, userId));
        if (task == null) {
            throw new BusinessException(404, "任务不存在");
        }

        List<AiQuestionResponse> result = null;
        if (AiTaskStatus.SUCCESS.name().equals(task.getStatus()) && StringUtils.hasText(task.getResultData())) {
            try {
                JavaType resultType = objectMapper.getTypeFactory()
                        .constructCollectionType(List.class, AiQuestionResponse.class);
                result = objectMapper.readValue(task.getResultData(), resultType);
            } catch (JsonProcessingException exception) {
                throw new BusinessException(500, "任务结果读取失败");
            }
        }
        String errorMessage = AiTaskStatus.FAILED.name().equals(task.getStatus())
                || AiTaskStatus.REVIEW_REQUIRED.name().equals(task.getStatus())
                ? task.getErrorMessage() : null;
        return new AiTaskStatusResponse(String.valueOf(task.getId()), task.getStatus(), result, errorMessage);
    }
}
