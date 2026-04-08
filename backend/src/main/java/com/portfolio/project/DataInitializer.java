package com.portfolio.project;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final ProjectRepository projectRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // TRUNCATE로 데이터 + auto_increment 동시 리셋 → 재시작마다 ID 1부터 시작
        projectRepository.truncate();
        log.info("Initializing project data...");

        projectRepository.saveAll(List.of(
            Project.builder()
                .title("포트폴리오 RAG 챗봇 사이트")
                .description("Spring AI + Qdrant 기반 RAG 챗봇이 메인인 개인 포트폴리오 사이트. 방문자가 자연어로 질문하면 관련 문서를 벡터 검색해 LLM이 답변을 생성.")
                .period("2026.04")
                .githubUrl(null)
                .demoUrl(null)
                .readmeSlug(null)
                .techStack(List.of("Spring Boot 3.4", "Spring AI", "Qdrant", "Next.js", "OpenAI API", "Docker"))
                .role(List.of("개인 프로젝트"))
                .highlights(List.of(
                    "RAG 파이프라인 직접 구현: 문서 청킹 → 임베딩 → Qdrant 저장 → 유사도 검색 → LLM 답변 생성",
                    "앱 시작 시 기존 컬렉션 삭제 후 재임베딩으로 문서 수정 즉시 반영 (중복 누적 방지)",
                    "대화 히스토리 전송으로 맥락 유지 및 후속 질문 처리",
                    "Next.js App Router 기반 챗봇 UI + 프로젝트 목록/상세 페이지 구성"
                ))
                .troubleshooting(List.of(
                    "문제1 → 해결1",
                    "문제2 → 해결2",
                    "문제3 → 해결3"
                ))
                .build(),
            Project.builder()
                .title("카드 결제 승인 시스템 (MSA)")
                .description("POS → VAN → FDS → 카드사 → 은행으로 이어지는 실제 카드 결제 흐름을 MSA로 구현. card-service를 FDS(이상거래 탐지)와 Payment(결제 처리) 두 마이크로서비스로 분리 설계 및 구현.")
                .period("2026.03")
                .githubUrl("https://github.com/fisa-msa-project")
                .demoUrl(null)
                .readmeSlug("card-payment")
                .techStack(List.of("Java 17", "Spring Boot 3.2", "Spring Cloud OpenFeign", "MySQL", "Spring Data JPA"))
                .role(List.of(
                    "card-service (FDS + Payment) 구현 및 전체 MSA 아키텍처 설계",
                    "FDS: 중복결제 탐지 / Payment: 체크·신용 분기 처리 및 bank-service 연동"
                ))
                .highlights(List.of(
                    "FDS 서비스: ConcurrentHashMap 기반 3초 이내 중복결제 탐지, 읽기 전용 Repository 설계로 쓰기 연산 차단",
                    "Payment 서비스: 체크카드(은행 출금 API 연동) / 신용카드(한도 차감) 분기 처리",
                    "OpenFeign으로 FDS → Payment → Bank 서비스 간 선언적 HTTP 통신 구현",
                    "UUID 거래 ID 발급 및 금융권 표준 응답 코드(00/51/61/96) 적용"
                ))
                .troubleshooting(List.of(
                    "문제1 → 해결1",
                    "문제2 → 해결2",
                    "문제3 → 해결3"
                ))
                .build(),
            Project.builder()
                .title("BookCard")
                .description("AI 이미지를 활용한 책 소개 웹 서비스. 졸업작품 팀 프로젝트로 최우수상 수상 후, Spring Boot로 재설계·마이그레이션.")
                .period("2024.09 - 2025.06")
                .githubUrl("https://github.com/noiskk/bookcard")
                .demoUrl(null)
                .readmeSlug("bookcard")
                .techStack(List.of("Spring Boot 3", "Spring Security", "JWT", "JPA", "MySQL", "React"))
                .role(List.of(
                    "Phase 1 (Node.js): AI 기능 담당 — 4단계 프롬프트 체이닝, SSE 진행률 스트리밍",
                    "Phase 2 (Spring Boot): 백엔드 전반 재설계 주도, Spring Security + JWT 구현"
                ))
                .highlights(List.of(
                        "교내 졸업작품 최우수상 수상 → Spring Boot 전면 재설계",
                    "GPT-4o + Gemini 4단계 프롬프트 체이닝 — 책 분석 → 5문장 요약 → 이미지 프롬프트 → 커버 이미지 생성, 단계별 출력을 다음 입력으로 누적",
                    "SSE 실시간 진행률 스트리밍 — 약 21초 대기 구간을 단계별 스트리밍으로 처리, SecurityContext를 비동기 스레드에 전파해 인증 유지",
                    "Spring Security + JWT 인증 체계 직접 설계 — JwtAuthFilter, 비회원 접근 허용/차단 분리, 토큰 만료 시 자동 로그아웃"
                ))
                .troubleshooting(List.of(
                    "SecurityContext 스레드 전파 — SSE 생성이 ExecutorService의 별도 스레드에서 실행되면서 ThreadLocal 기반 SecurityContext가 전파되지 않아 getCurrentUser() 호출 시 NPE 발생 → 요청 스레드에서 컨텍스트를 캡처해 자식 스레드에 직접 주입하고 finally에서 clearContext()로 스레드풀 오염을 방지해 해결",
                    "북카드 생성 실패 시 DB 불완전 데이터 잔류 — 4단계 AI 체이닝 중 중간 단계 API 오류 시 앞 단계의 결과(summary 등)가 이미 DB에 커밋된 채로 남는 문제 → @Transactional로 전체 생성 과정을 하나의 트랜잭션으로 묶어 어느 단계에서든 실패하면 DB 저장 전체가 롤백되도록 해결",
                    "SSE async dispatch Access Denied 로그 — SSE 응답 완료 후 Tomcat이 내부적으로 ASYNC dispatch를 발생시키는데 Spring Security 6가 필터 체인을 재실행하면서 빈 SecurityContext로 인해 anyRequest().authenticated() 룰에 차단 → SecurityConfig에 dispatcherTypeMatchers(DispatcherType.ASYNC).permitAll() 추가로 해결"
                ))
                .build(),
            Project.builder()
                .title("감사 로그 변조 방지 라이브러리")
                .description("금융 시스템 감사 로그의 위변조·삭제·순서 변경을 탐지하는 Java 라이브러리. HMAC 해시 체인 구조로 중간 로그 변조 시 이후 체인 전체가 붕괴되어 즉시 탐지.")
                .period("2025.03")
                .githubUrl("https://github.com/khmandarrin/woori-fisa-backend-audit-log-integrity")
                .demoUrl(null)
                .readmeSlug("audit-log")
                .techStack(List.of("Java", "Logback", "HMAC-SHA256", "JUnit 5", "Mockito", "JaCoCo"))
                .role(List.of(
                    "LogVerifier 구현 — 4가지 검증 메커니즘 (HMAC 무결성 / 체인 연결성 / Tail Truncation / 연쇄 오류 추적)",
                    "cascade 플래그로 실제 변조 지점과 파생 오류 구분"
                ))
                .highlights(List.of(
                    "HMAC 해시 체인 구조 설계 — 중간 로그 변조 시 이후 체인 전체 붕괴로 즉시 탐지",
                    "4가지 검증 메커니즘: 단일 무결성 / 체인 연결성 / 파일 끝 삭제 탐지 / 연쇄 오류 추적",
                    "Logback Appender 확장 방식으로 기존 로깅 시스템에 비침투적 적용 (설정 파일만 교체)",
                    "Core(Appender) → Util(Formatter/Hasher) → Verifier 3계층 아키텍처 설계"
                ))
                .troubleshooting(List.of(
                    "문제1 → 해결1",
                    "문제2 → 해결2",
                    "문제3 → 해결3"
                ))
                .build(),
            Project.builder()
                .title("카드 내역 조회 3티어 시스템")
                .description("Docker 기반 3티어 고가용성 아키텍처로 분기별 카드 거래 내역 조회 시스템 구축. 전 레이어 이중화와 MySQL InnoDB Cluster 읽기/쓰기 분리까지 직접 설계 및 구현.")
                .period("2025.03")
                .githubUrl(null)
                .demoUrl(null)
                .readmeSlug("card-3tier")
                .techStack(List.of("MySQL InnoDB Cluster", "MySQL Router", "Nginx", "Redis", "Tomcat", "Docker Compose", "Shell Script"))
                .role(List.of(
                    "전체 아키텍처 설계 참여 + DB 레이어 전담",
                    "MySQL InnoDB Cluster 3노드 구성, Router 읽기/쓰기 분리, HikariCP DataSource 이중화"
                ))
                .highlights(List.of(
                    "전 레이어 이중화: Master Nginx → Worker Nginx × 2 → Tomcat WAS × 2 → MySQL InnoDB Cluster × 3",
                    "MySQL Router 읽기(6447)/쓰기(6446) 포트 분리 + 애플리케이션 DataSource 이중화",
                    "depends_on + healthcheck 조합으로 9개 컨테이너 기동 순서 보장",
                    "InnoDB Cluster 초기화 자동화 스크립트(setup-cluster.sh)로 팀원 누구나 단일 커맨드로 환경 재현"
                ))
                .troubleshooting(List.of(
                    "문제1 → 해결1",
                    "문제2 → 해결2",
                    "문제3 → 해결3"
                ))
                .build()
        ));

        log.info("Project data initialization complete. {} projects saved.", projectRepository.count());
    }
}
