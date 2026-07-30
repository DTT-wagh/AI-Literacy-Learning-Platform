package com.witjoy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.witjoy.aiquestion.AiQuestionProvider;
import com.witjoy.dto.AiQuestionGenerateRequest;
import com.witjoy.dto.AiQuestionResponse;
import com.witjoy.entity.AiQuestionHistory;
import com.witjoy.entity.AiTask;
import com.witjoy.entity.AiTaskStatus;
import com.witjoy.mapper.AiQuestionHistoryMapper;
import com.witjoy.mapper.AiTaskMapper;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AiQuestionTaskWorker {
    private static final Logger LOGGER = LoggerFactory.getLogger(AiQuestionTaskWorker.class);
    private static final String FAILURE_MESSAGE = "AI题目生成失败，请稍后重试";
    private static final Pattern PHONE = Pattern.compile("(?<!\\d)1[3-9]\\d{9}(?!\\d)");
    private static final Pattern ID_CARD = Pattern.compile("(?<!\\d)\\d{17}[\\dXx](?!\\d)");
    private static final Pattern SENSITIVE_LABEL = Pattern.compile(
            "身份证号?|护照号?|学生证号?|身份信息|家庭住址|家庭地址|详细地址|收货地址|我住在|住址\\s*[:：]");
    private static final Pattern HARMFUL_CONTENT = Pattern.compile(
            "自杀|自残|色情|性行为|毒品|吸毒|制造.{0,4}(炸弹|爆炸物)|伤害他人|杀人");

    private final AiTaskMapper taskMapper;
    private final AiQuestionHistoryMapper historyMapper;
    private final AiQuestionProvider questionProvider;
    private final ObjectMapper objectMapper;

    public AiQuestionTaskWorker(AiTaskMapper taskMapper,
                                AiQuestionHistoryMapper historyMapper,
                                AiQuestionProvider questionProvider,
                                ObjectMapper objectMapper) {
        this.taskMapper = taskMapper;
        this.historyMapper = historyMapper;
        this.questionProvider = questionProvider;
        this.objectMapper = objectMapper;
    }

    @Async("aiTaskExecutor")
    public CompletableFuture<Void> execute(Long taskId) {
        AiTask task = taskMapper.selectById(taskId);
        if (task == null || !markRunning(taskId)) {
            return CompletableFuture.completedFuture(null);
        }

        try {
            AiQuestionGenerateRequest request = objectMapper.readValue(
                    task.getInputData(), AiQuestionGenerateRequest.class);
            List<String> history = historyMapper.selectList(new LambdaQueryWrapper<AiQuestionHistory>()
                    .eq(AiQuestionHistory::getUserId, task.getUserId())
                    .orderByDesc(AiQuestionHistory::getCreateTime)
                    .last("LIMIT 10"))
                    .stream().map(AiQuestionHistory::getQuestion).collect(java.util.stream.Collectors.toList());
            AiQuestionResponse question = questionProvider.generate(request, history);
            validateFormat(question, request.getDifficulty());
            String resultData = objectMapper.writeValueAsString(Collections.singletonList(question));
            objectMapper.readTree(resultData);

            if (!passesSafetyCheck(question)) {
                markReviewRequired(taskId, resultData);
                return CompletableFuture.completedFuture(null);
            }

            AiQuestionHistory historyRecord = new AiQuestionHistory();
            historyRecord.setUserId(task.getUserId());
            historyRecord.setQuestion(question.getQuestion());
            historyRecord.setSubject(request.getSubject());
            historyRecord.setCreateTime(LocalDateTime.now());
            historyMapper.insert(historyRecord);

            taskMapper.update(null, new UpdateWrapper<AiTask>()
                    .eq("id", taskId)
                    .eq("status", AiTaskStatus.RUNNING.name())
                    .set("status", AiTaskStatus.SUCCESS.name())
                    .set("result_data", resultData)
                    .set("error_message", null)
                    .set("finished_time", LocalDateTime.now()));
        } catch (Exception exception) {
            LOGGER.warn("AI question task failed taskId={} cause={}", taskId,
                    exception.getClass().getSimpleName());
            markFailed(taskId);
        }
        return CompletableFuture.completedFuture(null);
    }

    void markRejected(Long taskId) {
        taskMapper.update(null, new UpdateWrapper<AiTask>()
                .eq("id", taskId)
                .eq("status", AiTaskStatus.PENDING.name())
                .set("status", AiTaskStatus.FAILED.name())
                .set("error_message", "AI任务队列繁忙，请稍后重试")
                .set("finished_time", LocalDateTime.now()));
    }

    private boolean markRunning(Long taskId) {
        return taskMapper.update(null, new UpdateWrapper<AiTask>()
                .eq("id", taskId)
                .eq("status", AiTaskStatus.PENDING.name())
                .set("status", AiTaskStatus.RUNNING.name())
                .set("started_time", LocalDateTime.now())) == 1;
    }

    private void markFailed(Long taskId) {
        taskMapper.update(null, new UpdateWrapper<AiTask>()
                .eq("id", taskId)
                .eq("status", AiTaskStatus.RUNNING.name())
                .set("status", AiTaskStatus.FAILED.name())
                .set("error_message", FAILURE_MESSAGE)
                .set("finished_time", LocalDateTime.now()));
    }

    private void markReviewRequired(Long taskId, String resultData) {
        taskMapper.update(null, new UpdateWrapper<AiTask>()
                .eq("id", taskId)
                .eq("status", AiTaskStatus.RUNNING.name())
                .set("status", AiTaskStatus.REVIEW_REQUIRED.name())
                .set("result_data", resultData)
                .set("error_message", "AI生成内容需要安全复核，请重新生成")
                .set("finished_time", LocalDateTime.now()));
    }

    private void validateFormat(AiQuestionResponse question, String expectedDifficulty) {
        if (question == null || !StringUtils.hasText(question.getQuestion())
                || question.getOptions() == null || question.getOptions().size() != 4
                || question.getOptions().stream().anyMatch(option -> !StringUtils.hasText(option))
                || !StringUtils.hasText(question.getAnswer())
                || !question.getOptions().contains(question.getAnswer())
                || !StringUtils.hasText(question.getAnalysis())
                || !StringUtils.hasText(question.getDifficulty())
                || !question.getDifficulty().equals(expectedDifficulty)) {
            throw new IllegalStateException("题目内容格式不完整");
        }
    }

    private boolean passesSafetyCheck(AiQuestionResponse question) {
        String content = String.join(" ", Arrays.asList(
                question.getQuestion(), question.getAnswer(), question.getAnalysis(),
                String.join(" ", question.getOptions())));
        return !PHONE.matcher(content).find() && !ID_CARD.matcher(content).find()
                && !SENSITIVE_LABEL.matcher(content).find()
                && !HARMFUL_CONTENT.matcher(content).find();
    }
}
