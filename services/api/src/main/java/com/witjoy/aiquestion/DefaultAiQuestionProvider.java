package com.witjoy.aiquestion;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.witjoy.dto.AiQuestionGenerateRequest;
import com.witjoy.dto.AiQuestionResponse;
import java.time.Duration;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

@Component
public class DefaultAiQuestionProvider implements AiQuestionProvider {
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final AiQuestionInputSafetyValidator inputSafetyValidator;
    private final boolean mockEnabled;
    private final String llmEndpoint;
    private final String llmApiKey;
    private final String llmModel;

    public DefaultAiQuestionProvider(
            ObjectMapper objectMapper,
            RestTemplateBuilder restTemplateBuilder,
            AiQuestionInputSafetyValidator inputSafetyValidator,
            @Value("${app.ai.mock-enabled:true}") boolean mockEnabled,
            @Value("${app.ai.llm-endpoint:}") String llmEndpoint,
            @Value("${app.ai.llm-api-key:}") String llmApiKey,
            @Value("${app.ai.llm-model:gpt-4o-mini}") String llmModel,
            @Value("${app.ai.connect-timeout-ms:3000}") int connectTimeoutMs,
            @Value("${app.ai.read-timeout-ms:10000}") int readTimeoutMs) {
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofMillis(connectTimeoutMs))
                .setReadTimeout(Duration.ofMillis(readTimeoutMs))
                .build();
        this.inputSafetyValidator = inputSafetyValidator;
        this.mockEnabled = mockEnabled;
        this.llmEndpoint = llmEndpoint;
        this.llmApiKey = llmApiKey;
        this.llmModel = llmModel;
    }

    @Override
    public AiQuestionResponse generate(AiQuestionGenerateRequest request, List<String> history) {
        inputSafetyValidator.validate(request);
        if (mockEnabled) {
            return generateMock(request, history);
        }
        if (!StringUtils.hasText(llmEndpoint) || !StringUtils.hasText(llmApiKey)) {
            throw new AiQuestionProviderException("AI Provider未配置");
        }

        try {
            Map<String, Object> payload = new HashMap<String, Object>();
            payload.put("model", StringUtils.hasText(llmModel) ? llmModel : "gpt-4o-mini");
            payload.put("temperature", 0.7);
            payload.put("messages", Arrays.asList(
                    message("system", "你是一名小学人工智能教育老师，只能输出合法JSON。"),
                    message("user", buildPrompt(request, history))));
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(llmApiKey);
            ResponseEntity<String> response = restTemplate.postForEntity(
                    llmEndpoint, new HttpEntity<Map<String, Object>>(payload, headers), String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            String content = root.path("choices").path(0).path("message").path("content").asText();
            JsonNode generated = objectMapper.readTree(stripCodeFence(content));
            List<String> options = Arrays.asList(
                    generated.path("options").path(0).asText(), generated.path("options").path(1).asText(),
                    generated.path("options").path(2).asText(), generated.path("options").path(3).asText());
            String question = generated.path("question").asText();
            String answer = generated.path("answer").asText();
            String analysis = generated.path("analysis").asText();
            if (!StringUtils.hasText(question) || options.stream().anyMatch(option -> !StringUtils.hasText(option))
                    || !StringUtils.hasText(answer) || !StringUtils.hasText(analysis)) {
                throw new IllegalStateException("大模型返回题目格式不完整");
            }
            return new AiQuestionResponse(question, options, answer, analysis, request.getDifficulty());
        } catch (Exception exception) {
            throw new AiQuestionProviderException("AI Provider调用失败", exception);
        }
    }

    @Override
    public AiQuestionResponse generateMock(AiQuestionGenerateRequest request, List<String> history) {
        inputSafetyValidator.validate(request);
        String subject = request.getSubject();
        String question = "机器人想安全绕开桌子，最需要先做什么？";
        List<String> options = Arrays.asList("观察周围环境", "关掉所有传感器", "只加快速度", "闭上摄像头");
        if ("机器学习".equals(subject)) {
            question = "机器学习最重要的帮助是什么？";
            options = Arrays.asList("从数据中发现规律", "让电脑不用电", "把屏幕变大", "只保存文件");
        } else if ("图像识别".equals(subject)) {
            question = "AI识别照片里的小猫，主要属于哪种能力？";
            options = Arrays.asList("计算机视觉", "机械传动", "文字排版", "天气预报");
        } else if ("语音识别".equals(subject)) {
            question = "语音识别可以帮助AI做什么？";
            options = Arrays.asList("听懂人说的话", "闻到花香", "测量体重", "打印图书");
        } else if ("人工智能基础".equals(subject)) {
            question = "下面哪个是生活中常见的人工智能应用？";
            options = Arrays.asList("智能语音助手", "普通尺子", "机械闹钟", "纸质地图");
        }
        if (history.contains(question)) {
            question = "在" + subject + "学习中，AI要先理解信息再做出合适判断，这种做法有什么作用？";
        }
        return new AiQuestionResponse(question, options, options.get(0),
                "正确答案是“" + options.get(0) + "”。AI会通过感知信息和学习规律来帮助我们解决问题。",
                request.getDifficulty());
    }

    private Map<String, String> message(String role, String content) {
        Map<String, String> message = new HashMap<String, String>();
        message.put("role", role);
        message.put("content", content);
        return message;
    }

    private String buildPrompt(AiQuestionGenerateRequest request, List<String> history) {
        return "请为6-12岁学生生成一道人工智能知识选择题。主题：" + request.getSubject()
                + "；难度：" + request.getDifficulty()
                + "。题目贴近日常生活，四个选项，只有一个正确答案，解析要儿童容易理解。"
                + "最近题目如下，请避免重复：" + history
                + "。必须只返回JSON：{\"question\":\"\",\"options\":[\"\",\"\",\"\",\"\"],\"answer\":\"\",\"analysis\":\"\"}";
    }

    private String stripCodeFence(String content) {
        return content.replace("```json", "").replace("```", "").trim();
    }
}
