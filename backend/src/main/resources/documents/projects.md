# 프로젝트

## 포트폴리오 RAG 챗봇 사이트
- 기간: 2026.04, 개인 프로젝트
- 기술 스택: Spring Boot 3.4, Spring AI 1.0, PGVector, PostgreSQL, OpenAI API (gpt-4o-mini, text-embedding-3-small), Next.js 16, TypeScript, Tailwind CSS, Docker Compose
- 설명: Spring AI + PGVector 기반 RAG 챗봇이 메인인 개인 포트폴리오 사이트. 방문자가 자연어로 질문하면 관련 문서를 벡터 검색해 LLM이 컨텍스트 기반 답변을 생성한다.
- 주요 구현:
  - RAG 파이프라인 직접 구현: documents/*.md 파일을 TokenTextSplitter로 500토큰 단위 청킹 → text-embedding-3-small로 임베딩 → PGVector 저장 → 코사인 유사도 Top-K 검색 → gpt-4o-mini 답변 생성
  - 앱 시작 시 VectorStore 필터 기반 전체 삭제 후 재임베딩으로 문서 수정 즉시 반영 (중복 누적 방지)
  - PGVector HNSW 인덱스로 검색 성능 최적화, 유사도 임계값(0.5) 필터링으로 관련 없는 문서 제외
  - Next.js App Router 기반 챗봇 메인 페이지 + 프로젝트 목록/상세 페이지 구성

## 카드 결제 승인 시스템 (MSA)
- 기간: 2025년, 우리FISA 과정 팀 프로젝트
- 기술 스택: Java 17, Spring Boot 3.2, Spring Cloud OpenFeign, MySQL, Spring Data JPA
- GitHub: https://github.com/fisa-msa-project
- 설명: POS → VAN → FDS → 카드사 → 은행으로 이어지는 실제 카드 결제 승인 흐름을 MSA로 구현한 프로젝트. card-service를 FDS(이상거래 탐지)와 Payment(결제 처리) 두 개의 마이크로서비스로 분리 설계하고 구현을 담당했다.
- 담당 서비스: card-service (FDS + Payment 두 마이크로서비스)
- 주요 구현:
  - FDS 서비스: ConcurrentHashMap으로 인메모리 세션을 관리해 3초 이내 동일 카드 중복결제를 탐지. JpaRepository 대신 최상위 Repository를 상속한 읽기 전용 레포지토리를 설계해 FDS에서 카드 데이터 쓰기 연산을 원천 차단.
  - Payment 서비스: 체크카드(은행 출금 API 호출)와 신용카드(creditLimit - usedAmount 잔여 한도 검사)를 분리 처리. UUID 거래 ID 발급 및 Authorization 이력 저장.
  - OpenFeign으로 FDS → Payment → Bank 서비스 간 선언적 HTTP 통신 구현.
  - 금융권 표준 응답 코드 적용: 00(승인), 51(잔액/한도 부족), 61(1회 한도 초과), 96(시스템 오류)

## BookCard
- 기간: 대학 졸업작품 (Phase 1) → 졸업 후 개인 프로젝트 (Phase 2)
- 기술 스택: Phase 1 — Node.js, Express / Phase 2 — Spring Boot 3, Spring Security, JWT, JPA, MySQL, React
- 설명: AI 이미지를 활용한 책 소개 웹 서비스. 팀 프로젝트로 교내 졸업작품 대회 최우수상을 수상했지만 AI 의존도가 높고 설계가 부실하다는 반성으로, 졸업 후 Spring Boot로 혼자 처음부터 재설계·마이그레이션했다.
- 주요 구현:
  - Phase 1: Node.js/Express 기반 팀 프로젝트, AI 이미지 생성 API 활용, 교내 최우수상 수상
  - Phase 2: 요구사항 명세서 + 10단계 개발 가이드 직접 작성 후 전면 재설계
  - Spring Security + JWT 인증 체계를 처음부터 아키텍처에 녹여 설계
  - Repository → Service → Controller → JWT 계층별 테스트 8개 작성, 테스트 과정에서 설계 결함 발견 및 수정

## 감사 로그 변조 방지 라이브러리
- 기간: 2025년, 우리FISA 과정 개인 프로젝트
- 기술 스택: Java, Logback, HMAC-SHA256, JUnit 5, Mockito, JaCoCo
- GitHub: https://github.com/khmandarrin/woori-fisa-backend-audit-log-integrity
- 설명: 금융 시스템 감사 로그의 위변조·삭제·순서 변경을 탐지하는 Java 라이브러리. 각 로그가 이전 로그의 해시값을 포함하는 HMAC 해시 체인 구조로, 중간 로그 변조 시 이후 체인 전체가 붕괴되어 즉시 탐지한다.
- 주요 구현:
  - HMAC 해시 체인 설계: 중간 로그 변경 시 이후 모든 해시값 불일치 → 변조 위치 특정 가능
  - 4가지 검증 메커니즘: 단일 로그 무결성 / 체인 연결성 / 파일 끝 삭제(tail truncation) 탐지 / 연쇄 오류 추적
  - Logback Appender 확장 방식으로 기존 로깅 코드 수정 없이 설정 파일만 교체해 적용 가능
  - Core(Appender) → Util(Formatter/Hasher) → Verifier 3계층 아키텍처 설계

## 카드 내역 조회 3티어 시스템
- 기간: 2025년, 우리FISA 과정 팀 프로젝트
- 기술 스택: MySQL 8.0, MySQL InnoDB Cluster, MySQL Router, HikariCP, Nginx, Redis, Tomcat, Docker Compose, Shell Script
- 설명: Docker 기반 3티어 고가용성 아키텍처로 분기별 카드 거래 내역 조회 시스템 구축. 프레젠테이션·애플리케이션·데이터 전 레이어를 이중화하고 MySQL 읽기/쓰기 분리까지 직접 설계 및 구현했다.
- 주요 구현:
  - 전 레이어 이중화: Master Nginx → Worker Nginx × 2 → Tomcat WAS × 2 → MySQL InnoDB Cluster × 3 (Primary 1 + Secondary 2)
  - MySQL Router 포트 분리(쓰기 6446 / 읽기 6447) + SourceDataSource/ReplicaDataSource 애플리케이션 이중화로 읽기 부하 분산
  - depends_on + healthcheck 조합으로 9개 컨테이너 기동 순서 보장 (MySQL 응답 확인 후 Router 기동)
  - InnoDB Cluster 초기화 4단계를 setup-cluster.sh로 자동화 — 팀원 누구나 단일 커맨드로 동일 환경 재현
