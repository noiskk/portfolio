package com.portfolio;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;

@SpringBootApplication
@EnableScheduling
public class PortfolioApplication {

    public static void main(String[] args) {
        loadEnv();
        SpringApplication.run(PortfolioApplication.class, args);
    }

    /**
     * Spring 시작 전에 .env를 읽어 시스템 프로퍼티로 주입.
     * IntelliJ는 working directory가 project root(portfolio/)라서
     * spring-dotenv가 backend/.env를 못 찾는 문제를 해결.
     */
    private static void loadEnv() {
        String workDir = System.getProperty("user.dir");
        String[] candidates = {
            workDir + "/.env",          // backend/ 에서 실행 시
            workDir + "/backend/.env",  // portfolio/ 에서 실행 시 (IntelliJ 기본값)
        };

        for (String path : candidates) {
            File file = new File(path);
            if (!file.exists()) continue;

            try (BufferedReader br = new BufferedReader(new FileReader(file))) {
                String line;
                while ((line = br.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) continue;
                    int idx = line.indexOf('=');
                    String key = line.substring(0, idx).trim();
                    String value = line.substring(idx + 1).trim();
                    if (System.getenv(key) == null && System.getProperty(key) == null) {
                        System.setProperty(key, value);
                    }
                }
                return;
            } catch (IOException ignored) {
            }
        }
    }
}
