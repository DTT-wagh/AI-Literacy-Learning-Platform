package com.witjoy.aiquestion;

import com.witjoy.dto.AiQuestionGenerateRequest;
import com.witjoy.dto.AiQuestionResponse;
import java.util.List;

public interface AiQuestionProvider {
    AiQuestionResponse generate(AiQuestionGenerateRequest request, List<String> history);

    AiQuestionResponse generateMock(AiQuestionGenerateRequest request, List<String> history);
}
