package com.portfolio.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    // deleteAll() 대신 TRUNCATE 사용 — auto_increment도 함께 리셋
    @Modifying
    @Query(nativeQuery = true, value = "TRUNCATE TABLE projects")
    void truncate();
}
