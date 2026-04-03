package com.portfolio.project;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<List<Project>> getAll() {
        return ResponseEntity.ok(projectService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.findById(id));
    }

    @GetMapping("/{id}/readme")
    public ResponseEntity<String> getReadme(@PathVariable Long id) {
        return projectService.findReadme(id)
                .map(content -> ResponseEntity.ok()
                        .header("Content-Type", "text/plain;charset=UTF-8")
                        .body(content))
                .orElse(ResponseEntity.notFound().build());
    }
}
