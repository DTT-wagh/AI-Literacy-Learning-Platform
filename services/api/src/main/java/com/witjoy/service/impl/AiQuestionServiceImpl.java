package com.witjoy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.witjoy.aiquestion.AiQuestionProvider;
import com.witjoy.aiquestion.AiQuestionProviderException;
import com.witjoy.aiquestion.AiQuestionInputSafetyValidator;
import com.witjoy.dto.AiQuestionAnswerRequest;
import com.witjoy.dto.AiQuestionAnswerResponse;
import com.witjoy.dto.AiQuestionGenerateRequest;
import com.witjoy.dto.AiQuestionResponse;
import com.witjoy.entity.AiQuestionAnswer;
import com.witjoy.entity.AiQuestionHistory;
import com.witjoy.mapper.AiQuestionAnswerMapper;
import com.witjoy.mapper.AiQuestionHistoryMapper;
import com.witjoy.service.AiQuestionService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class AiQuestionServiceImpl implements AiQuestionService {
    private final AiQuestionHistoryMapper historyMapper;
    private final AiQuestionAnswerMapper answerMapper;
    private final AiQuestionProvider questionProvider;
    private final AiQuestionInputSafetyValidator inputSafetyValidator;

    public AiQuestionServiceImpl(AiQuestionHistoryMapper historyMapper,
                                 AiQuestionAnswerMapper answerMapper,
                                 AiQuestionProvider questionProvider,
                                 AiQuestionInputSafetyValidator inputSafetyValidator) {
        this.historyMapper = historyMapper;
        this.answerMapper = answerMapper;
        this.questionProvider = questionProvider;
        this.inputSafetyValidator = inputSafetyValidator;
    }

    @Override
    public AiQuestionResponse generateQuestion(Long userId, AiQuestionGenerateRequest request) {
        inputSafetyValidator.validate(request);
        List<String> history = recentHistory(userId);
        AiQuestionResponse question;
        try {
            question = questionProvider.generate(request, history);
        } catch (AiQuestionProviderException exception) {
            // Preserve the legacy endpoint's safe mock fallback. The async worker
            // calls the provider directly so provider failures become FAILED tasks.
            question = questionProvider.generateMock(request, history);
        }
        saveHistory(userId, request, question);
        return question;
    }

    @Override
    public AiQuestionAnswerResponse saveAnswer(Long userId, AiQuestionAnswerRequest request) {
        boolean correct = request.getUserAnswer().equals(request.getCorrectAnswer());
        AiQuestionAnswer answer = new AiQuestionAnswer();
        answer.setUserId(userId);
        answer.setQuestion(request.getQuestion());
        answer.setUserAnswer(request.getUserAnswer());
        answer.setCorrectAnswer(request.getCorrectAnswer());
        answer.setCorrect(correct);
        answer.setCreateTime(LocalDateTime.now());
        answerMapper.insert(answer);
        return new AiQuestionAnswerResponse(correct);
    }

    List<String> recentHistory(Long userId) {
        return historyMapper.selectList(new LambdaQueryWrapper<AiQuestionHistory>()
                .eq(AiQuestionHistory::getUserId, userId)
                .orderByDesc(AiQuestionHistory::getCreateTime)
                .last("LIMIT 10"))
                .stream().map(AiQuestionHistory::getQuestion).collect(Collectors.toList());
    }

    private void saveHistory(Long userId, AiQuestionGenerateRequest request, AiQuestionResponse question) {
        AiQuestionHistory record = new AiQuestionHistory();
        record.setUserId(userId);
        record.setQuestion(question.getQuestion());
        record.setSubject(request.getSubject());
        record.setCreateTime(LocalDateTime.now());
        historyMapper.insert(record);
    }
}
