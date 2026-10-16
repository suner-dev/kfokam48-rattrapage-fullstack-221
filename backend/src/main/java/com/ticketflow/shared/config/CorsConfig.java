package com.ticketflow.shared.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Ouverture CORS restreinte à l'origine du frontend en développement.
 * L'origine se configure via app.cors.allowed-origins, rien n'est codé en dur.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final String[] originesAutorisees;

    public CorsConfig(@Value("${app.cors.allowed-origins}") String[] originesAutorisees) {
        this.originesAutorisees = originesAutorisees;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(originesAutorisees)
                .allowedMethods("GET", "POST", "PATCH", "OPTIONS")
                .allowedHeaders("*");
    }
}
