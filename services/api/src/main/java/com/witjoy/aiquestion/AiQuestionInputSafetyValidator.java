package com.witjoy.aiquestion;

import com.witjoy.dto.AiQuestionGenerateRequest;
import com.witjoy.exception.BusinessException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class AiQuestionInputSafetyValidator {
    private static final int SUBJECT_MAX_LENGTH = 20;
    private static final int DIFFICULTY_MAX_LENGTH = 4;
    private static final Set<String> ALLOWED_SUBJECTS = new HashSet<String>(Arrays.asList(
            "人工智能基础", "机器学习", "图像识别", "语音识别", "机器人"));
    private static final Set<String> ALLOWED_DIFFICULTIES = new HashSet<String>(Arrays.asList("基础", "进阶"));
    private static final Pattern PROMPT_INJECTION = Pattern.compile(
            "忽略.{0,8}(指令|要求|规则)|系统提示|系统指令|提示词|越狱|开发者模式|扮演|"
                    + "ignore\\s+(all\\s+)?(previous|prior|above)\\s+(instructions?|prompts?)|"
                    + "system\\s*prompt|developer\\s*message|jailbreak|prompt\\s*injection",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    public void validate(AiQuestionGenerateRequest request) {
        if (request == null || !StringUtils.hasText(request.getSubject())
                || !StringUtils.hasText(request.getDifficulty())) {
            throw new BusinessException(400, "AI出题参数不能为空");
        }
        if (request.getSubject().length() > SUBJECT_MAX_LENGTH
                || request.getDifficulty().length() > DIFFICULTY_MAX_LENGTH) {
            throw new BusinessException(400, "AI出题参数长度不合法");
        }
        if (!ALLOWED_SUBJECTS.contains(request.getSubject())) {
            throw new BusinessException(400, "知识主题不在允许范围内");
        }
        if (!ALLOWED_DIFFICULTIES.contains(request.getDifficulty())) {
            throw new BusinessException(400, "难度不在允许范围内");
        }
        String combined = (request.getSubject() + " " + request.getDifficulty()).toLowerCase(Locale.ROOT);
        if (PROMPT_INJECTION.matcher(combined).find()) {
            throw new BusinessException(400, "AI出题参数包含不允许的指令内容");
        }
    }
}
