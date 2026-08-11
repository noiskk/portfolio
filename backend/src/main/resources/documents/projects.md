# 프로젝트

## SOFIT: 소상공인 성장가능성 기반 대출 플랫폼
- 기간: 2026.04 ~ 2026.06 (5~6주), 우리FIS아카데미 최종프로젝트 — 최우수상 수상
- 팀 구성: 5명 (PM / TL·AI / Backend / Infra(본인) / Frontend), 역할: Infra Leader + 백엔드 일부
- 기술 스택: AWS (VPC, EC2, ALB, ASG, CloudFront, S3, ElastiCache, CodeDeploy, Secrets Manager), OpenStack, WireGuard, MySQL InnoDB Cluster, Jenkins, Docker, Spring Boot, Prometheus/Loki/Grafana
- 설명: 소상공인의 비금융 데이터를 AI(LightGBM·SHAP)로 분석해 신용등급을 산출하고, 대출 신청부터 심사·실행까지 처리하는 디지털 포용금융 대출 플랫폼. AWS(고객 채널)와 온프레미스(은행 내부망)를 잇는 하이브리드 인프라를 구축했다.
- 주요 기여:
  - AWS·온프레미스 하이브리드 인프라 구축 — NAT 뒤의 온프레미스가 AWS로 먼저 아웃바운드 연결을 개시하는 WireGuard VPN으로 Site-to-Site VPN 불가 문제 해결, 이후 AZ별 허브 2대 Active-Active로 이중화
  - 디스크 I/O 장애로 DB가 중단된 경험 후 MySQL InnoDB Cluster 3노드 구축 — vCPU 쿼터 부족을 기존 인스턴스 다운사이징으로 자체 해결, Primary 강제 종료 후 자동 승격 검증
  - 전자금융감독규정 기반 감사 로그 체계 설계 — @AuditLog AOP 자동 수집 + DB 트리거로 수정·삭제 원천 차단, 운영 로그와 이중 트랙 분리
  - CodeDeploy Blue/Green 무중단 배포 (Canary 10% → 5분 → 100%), Jenkins CI, VPC Endpoint 기반 비용 최적화
  - 백엔드: 마이비즈 대시보드 API, 약관 조회·동의 API, 심사결과·약정 API 개발
  - 의사결정 로그(ADR) 58건 기록으로 설계 근거 문서화

## 포트폴리오 RAG 챗봇 사이트 (이 사이트)
- 기간: 2026.04 ~ , 개인 프로젝트
- 기술 스택: Spring Boot 3.4, Spring AI 1.0, Qdrant, Redis, MySQL, OpenAI API (gpt-4o-mini, text-embedding-3-small), Next.js, TypeScript, Tailwind CSS, Docker Compose
- 설명: Spring AI + Qdrant 기반 RAG 챗봇이 메인인 개인 포트폴리오 사이트. 방문자가 자연어로 질문하면 관련 문서를 벡터 검색해 LLM이 컨텍스트 기반 답변을 생성한다.
- 주요 구현:
  - RAG 파이프라인 직접 구현: 문서를 TokenTextSplitter로 500토큰 단위 청킹(100토큰 overlap) → text-embedding-3-small 임베딩 → Qdrant 저장 → 코사인 유사도 Top-K 검색 → gpt-4o-mini 답변 생성
  - 유사도 임계값 필터링으로 관련 없는 청크가 프롬프트에 섞이는 것을 방지, 근거 없는 질문에는 답변 대신 직접 문의 안내
  - 검색된 청크의 출처 메타데이터를 SSE 이벤트로 전달해 답변마다 참고 문서 표시 — 답변 근거 추적 가능
  - 앱 시작 시 컬렉션 삭제 후 재임베딩으로 문서 수정 즉시 반영 (중복 벡터 누적 방지)
  - Redis 기반 세션 히스토리(TTL 1시간), 프로젝트 API 캐싱, 세션당 분당 요청 제한(Rate Limiting)
  - SSE 스트리밍 응답 + 대화 히스토리 전송으로 맥락 유지

## 카드 결제 시스템 (카드사 내부 MSA)
- 기간: 2026.03 팀 프로젝트 → 이후 개인 재설계·고도화
- 기술 스택: Java 17, Spring Boot 3.2, Spring Cloud Gateway, Netflix Eureka, OpenFeign, Spring Batch, Spring Data JPA, MySQL, ISO 8583(j8583) + TCP
- 설명: 실물카드 대면결제 흐름(POS → VAN → 카드사 → 은행) 전 구간을 구현한 분산 결제 시스템. 카드사 내부를 게이트웨이·승인·원장·FDS의 MSA로 분해했다. 핵심은 분산 환경의 결제 정합성(멱등성·망취소·보상·원장·정산). 업무 서비스 6개 + 게이트웨이·레지스트리, 테스트 87개.
- 주요 구현:
  - STAN(단말 거래번호) 기반 멱등키를 전 구간 전파하고 예약-후-실행 구조로 재시도 시 이중결제 차단
  - 망취소 + 보상 트랜잭션 — 응답이 불확실한 거래는 실패로 단정하지 않고 대사 대상으로 남긴 뒤, Spring Batch가 은행에 재조회해 정리
  - 취소 연산도 멱등하게 — CANCEL-{원거래ID} 참조번호로 같은 원거래의 중복 취소 시 잔액 이중 복구 차단
  - INSERT-only 불변 원장을 독립 서비스로 분리, 데이터 소유권 기준으로 서비스 경계 설정 (FK 제거, 값 복사)
  - Spring Batch 대사 배치 + 가맹점별 정산 배치(수수료 차감)
  - VAN의 BIN 기반 카드사 라우팅(최장 일치), FDS 점수 합산 룰 엔진(APPROVE/REVIEW/BLOCK)
  - Domain/Business/System 예외 계층 통일, "전송=200, 결과=응답코드" 규약으로 금융권 표준 응답 코드(00/51/61/96) 적용

## BookCard: AI 이미지 기반 책 소개 서비스
- 기간: 2024.09 ~ 2025.06 — 대학 졸업작품 (Phase 1) → 졸업 후 Spring Boot 재설계 (Phase 2)
- 기술 스택: Phase 1 — Node.js, Express / Phase 2 — Spring Boot 3, Spring Security, JWT, JPA, MySQL, React
- GitHub: https://github.com/noiskk/bookcard
- 설명: AI 이미지를 활용한 책 소개 웹 서비스. 팀 프로젝트로 교내 졸업작품 최우수상을 수상했지만, 설계에 대한 반성으로 졸업 후 Spring Boot로 혼자 처음부터 재설계·마이그레이션했다.
- 주요 구현:
  - GPT-4o + Gemini 4단계 프롬프트 체이닝 — 책 분석 → 5문장 요약 → 이미지 프롬프트 → 커버 이미지 생성, 단계별 출력을 다음 입력으로 누적
  - SSE 실시간 진행률 스트리밍 — 약 21초 대기 구간을 단계별 진행률로 표시, SecurityContext를 비동기 스레드에 전파해 인증 유지
  - Spring Security + JWT 인증 체계 직접 설계 — JwtAuthFilter, 비회원 접근 허용/차단 분리, 토큰 만료 시 자동 로그아웃
  - @Transactional로 4단계 AI 생성 과정을 하나의 트랜잭션으로 묶어 중간 실패 시 전체 롤백

## 감사 로그 변조 방지 라이브러리
- 기간: 2026.03, 우리FISA 과정 개인 프로젝트
- 기술 스택: Java, Logback, HMAC-SHA256, JUnit 5, Mockito, JaCoCo
- GitHub: https://github.com/khmandarrin/woori-fisa-backend-audit-log-integrity
- 설명: 금융 시스템 감사 로그의 위변조·삭제·순서 변경을 탐지하는 Java 라이브러리. 각 로그가 이전 로그의 해시값을 포함하는 HMAC-SHA256 해시 체인 구조로, 중간 로그 변조 시 이후 체인 전체가 붕괴되어 즉시 탐지한다.
- 주요 구현:
  - HMAC 해시 체인 설계 — 비밀 키 없이는 유효한 해시를 재계산할 수 없어 변조 후 해시 덮어쓰기 차단
  - 4가지 검증 메커니즘: 내용 변조(CURRENT_HASH_MISMATCH) / 중간 삭제(PREV_HASH_MISMATCH) / 끝 잘라내기(audit.head 파일 대조로 TAIL_TRUNCATION 탐지) / 순서 변경
  - cascade 플래그로 실제 변조 지점과 연쇄 오류를 구분해 root cause 특정
  - Logback Custom Appender 방식으로 기존 코드 수정 없이 logback.xml 설정만으로 적용 — 레거시 시스템에도 비침투적
  - LogFormatter 인터페이스(Strategy 패턴)로 로그 포맷 교체 가능, 테스트 4그룹 16개 작성

## 카드 내역 조회 3티어 시스템
- 기간: 2026.02, 우리FISA 과정 팀 프로젝트
- 기술 스택: MySQL 8.0, MySQL InnoDB Cluster, MySQL Router, HikariCP, Nginx, Redis, Tomcat, Docker Compose, Shell Script
- 설명: Docker 기반 3티어 고가용성 아키텍처로 분기별 카드 거래 내역 조회 시스템 구축. 프레젠테이션·애플리케이션·데이터 전 레이어를 이중화하고 MySQL 읽기/쓰기 분리까지 직접 설계 및 구현했다.
- 주요 구현:
  - 전 레이어 이중화: Master Nginx → Worker Nginx × 2 → Tomcat WAS × 2 → MySQL InnoDB Cluster × 3 (Primary 1 + Secondary 2)
  - MySQL Router 포트 분리(쓰기 6446 / 읽기 6447) + SourceDataSource/ReplicaDataSource 애플리케이션 이중화로 읽기 부하 분산
  - depends_on + healthcheck 조합으로 9개 컨테이너 기동 순서 보장 (MySQL 응답 확인 후 Router 기동)
  - InnoDB Cluster 초기화 4단계를 setup-cluster.sh로 자동화 — 팀원 누구나 단일 커맨드로 동일 환경 재현
  - WAS 이중화에 따른 세션 불일치를 Redis 세션 공유로 해결
