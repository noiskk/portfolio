package com.portfolio.project;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;

    public List<Project> findAll() {
        return projectRepository.findAll();
    }

    public Project findById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + id));
    }

    public Optional<String> findReadme(Long id) {
        Project project = findById(id);
        if (project.getReadmeSlug() == null) return Optional.empty();

        try {
            ClassPathResource resource = new ClassPathResource("readmes/" + project.getReadmeSlug() + ".md");
            String content = resource.getContentAsString(StandardCharsets.UTF_8);

            // githubUrl이 있으면 상대 경로 이미지를 GitHub Raw URL로 변환
            // 예: https://github.com/user/repo → https://raw.githubusercontent.com/user/repo/main/
            if (project.getGithubUrl() != null) {
                String rawBase = project.getGithubUrl()
                        .replaceFirst("https://github\\.com/", "https://raw.githubusercontent.com/")
                        + "/main/";

                // Markdown 이미지: ![alt](relative/path)
                content = content.replaceAll(
                        "!\\[([^]]*)]\\((?!https?://)([^)]+)\\)",
                        "![$1](" + rawBase + "$2)"
                );
                // HTML img 태그: src="relative/path"
                content = content.replaceAll(
                        "src=\"(?!https?://)([^\"]+)\"",
                        "src=\"" + rawBase + "$1\""
                );
            }

            return Optional.of(content);
        } catch (IOException e) {
            return Optional.empty();
        }
    }
}
