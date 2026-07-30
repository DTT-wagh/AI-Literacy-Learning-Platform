package com.witjoy.config;

import com.witjoy.interceptor.JwtInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final JwtInterceptor jwtInterceptor;

    public WebConfig(JwtInterceptor jwtInterceptor) {
        this.jwtInterceptor = jwtInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(jwtInterceptor)
                .addPathPatterns("/api/user/info", "/api/user/level", "/api/user/experience/add",
                        "/api/learning/**", "/api/ai/question/**", "/api/mentor/**",
                        "/api/v2/ai/tasks/**",
                        "/api/v1/game/sessions", "/api/v1/game/events/**",
                        "/api/v1/game/ai-evaluate", "/api/v1/game/progress",
                        "/api/v1/game/statistics")
                .excludePathPatterns("/api/user/register", "/api/user/login", "/api/user/verification-code");
    }
}
