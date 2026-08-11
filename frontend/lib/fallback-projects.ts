import type { Project } from './api';

// 백엔드 오프라인 시 표시할 프로젝트 스냅샷.
// 백엔드는 비용 문제로 상시 운영하지 않으므로, 서버가 꺼져 있어도
// 포트폴리오의 프로젝트 목록/상세는 보여야 한다. 챗봇만 degrade된다.
//
// 원본은 DataInitializer.java — 프로젝트를 추가·수정하면 여기도 갱신할 것.
// (백엔드를 띄운 뒤 GET /api/projects 응답을 그대로 붙여넣으면 된다)
export const FALLBACK_PROJECTS: Project[] = [
    {
      "id": 1,
      "title": "포트폴리오 RAG 챗봇 사이트",
      "description": "Spring AI + Qdrant 기반 RAG 챗봇이 메인인 개인 포트폴리오 사이트. 방문자가 자연어로 질문하면 관련 문서를 벡터 검색해 LLM이 답변을 생성.",
      "period": "2026.04 - ",
      "githubUrl": "https://github.com/noiskk/portfolio",
      "demoUrl": null,
      "readmeSlug": null,
      "techStack": [
        "Spring Boot 3.4",
        "Spring AI",
        "Qdrant",
        "Redis",
        "Next.js",
        "OpenAI API",
        "Docker"
      ],
      "highlights": [
        "RAG 파이프라인 직접 구현: 문서 청킹 → 임베딩 → Qdrant 저장 → 유사도 검색 → LLM 답변 생성",
        "유사도 임계값 필터링 + 답변마다 참고 문서 출처 표시로 근거 추적 가능",
        "Redis 기반 세션 히스토리(TTL)·프로젝트 API 캐싱·세션당 Rate Limiting",
        "앱 시작 시 기존 컬렉션 삭제 후 재임베딩으로 문서 수정 즉시 반영 (중복 누적 방지)",
        "SSE 스트리밍 + 대화 히스토리 전송으로 맥락 유지 및 후속 질문 처리"
      ],
      "troubleshooting": [
        "HTTP 배포 환경에서 채팅이 시작조차 안 됨 — crypto.randomUUID()가 보안 컨텍스트(HTTPS)에서만 동작해 세션 ID 생성이 실패 → Math.random 기반 ID 생성으로 교체해 해결",
        "SSE 응답이 중간에 잘리거나 줄바꿈이 사라짐 — 네트워크 청크가 이벤트 경계와 어긋나게 도착 → \\n\\n 경계로 버퍼링하고 이벤트 내 data: 라인들을 합쳐 파싱하도록 수정",
        "문서 수정 후 재시작하면 옛 내용과 새 내용이 함께 검색됨 — 벡터가 계속 누적되는 구조 → 시작 시 컬렉션 삭제 후 전체 재임베딩으로 단순화해 해결"
      ],
      "role": [
        "개인 프로젝트"
      ]
    },
    {
      "id": 2,
      "title": "SOFIT: 소상공인 대출 플랫폼",
      "description": "소상공인의 비금융 데이터를 AI로 분석해 신용등급을 산출하는 디지털 포용금융 대출 플랫폼. 5명 팀에서 Infra Leader로 AWS·온프레미스 하이브리드 인프라를 구축. 우리FIS아카데미 최종프로젝트 최우수상.",
      "period": "2026.04 - 2026.06",
      "githubUrl": null,
      "demoUrl": null,
      "readmeSlug": "sofit",
      "techStack": [
        "AWS",
        "OpenStack",
        "WireGuard",
        "MySQL InnoDB Cluster",
        "Jenkins",
        "CodeDeploy",
        "Spring Boot",
        "Prometheus/Grafana"
      ],
      "highlights": [
        "NAT 뒤 온프레미스가 AWS로 먼저 연결을 개시하는 WireGuard VPN으로 Site-to-Site VPN 불가 문제 해결, AZ별 허브 Active-Active 이중화",
        "디스크 I/O 장애 경험 후 MySQL InnoDB Cluster 3노드 구축 — vCPU 쿼터 부족을 인스턴스 다운사이징으로 자체 해결, 자동 failover 검증",
        "전자금융감독규정 기반 감사 로그 — @AuditLog AOP 수집 + DB 트리거로 수정·삭제 원천 차단",
        "CodeDeploy Blue/Green 무중단 배포(Canary), VPC Endpoint로 상시 NAT 제거해 비용·공격 표면 축소",
        "의사결정 로그(ADR) 58건 기록 — 설계 번복까지 문서화"
      ],
      "troubleshooting": [
        "VPN 터널은 붙었는데 DB 연결만 실패 — 온프레미스 eth0 IP로 온 패킷이 wg0 인터페이스로 들어와 수신 거부됨 → DB_HOST와 라우트를 터널 IP로 변경, 운영 DB는 건드리지 않고 클라우드 쪽 설정만으로 해결",
        "ElastiCache 이전 후 앱이 기동 불가 — 포트는 열렸는데 TLS 미적용 접속으로 핸드셰이크 교착 + 관리형 Redis의 CONFIG 명령 차단 → TLS 활성화 + ConfigureRedisAction.NO_OP 빈 등록으로 해결",
        "로그인 실패가 200 OK로 위장됨 — CORS 403을 CloudFront의 SPA용 오류 페이지가 index.html 200으로 변환 → 오리진(ALB)에 직접 요청해 계층 분리로 원인 특정, allowedOrigins 수정"
      ],
      "role": [
        "Infra Leader — AWS·온프레미스 하이브리드, DB HA, CI/CD, 이중 트랙 로깅 전담",
        "백엔드: 마이비즈 대시보드·약관 동의·심사결과 API 개발"
      ]
    },
    {
      "id": 3,
      "title": "카드 결제 시스템 (카드사 내부 MSA)",
      "description": "실물카드 대면결제 흐름(POS → VAN → 카드사 → 은행) 전 구간을 구현한 분산 결제 시스템. 카드사 내부를 게이트웨이·승인·원장·FDS의 MSA로 분해. 핵심은 분산 환경의 결제 정합성(멱등성·망취소·보상·원장·정산).",
      "period": "2026.03 - 2026.07",
      "githubUrl": null,
      "demoUrl": null,
      "readmeSlug": "card-payment",
      "techStack": [
        "Java 17",
        "Spring Boot 3.2",
        "Spring Cloud Gateway",
        "Eureka",
        "OpenFeign",
        "Spring Batch",
        "MySQL",
        "ISO 8583"
      ],
      "highlights": [
        "STAN 기반 멱등키 전 구간 전파 + 예약-후-실행 구조로 재시도 시 이중결제 차단",
        "망취소·보상 트랜잭션 — 응답 불확실 거래는 실패로 단정하지 않고 대사 대상으로 남긴 뒤 배치가 은행에 재조회해 정리",
        "취소도 멱등하게 — CANCEL-{원거래ID} 참조번호로 중복 취소 시 잔액 이중 복구 차단",
        "INSERT-only 불변 원장을 독립 서비스로 분리, 데이터 소유권 기준으로 서비스 경계 설정",
        "Spring Batch 대사·가맹점 정산 배치, VAN BIN 기반 카드사 라우팅, FDS 점수 합산 룰 엔진"
      ],
      "troubleshooting": [
        "보상(취소) 기록이 DB에 안 남음 — 바깥 비즈니스 트랜잭션이 롤백되면서 같은 트랜잭션에 합류한 보상 기록도 함께 삭제됨 → REQUIRES_NEW로 독립 커밋해 해결",
        "배치가 2회차부터 아무것도 안 읽음 — Reader가 싱글턴이라 이전 실행의 id 커서가 남아 있음 → @StepScope로 실행마다 새로 생성, 페이지 밀림은 keyset paging으로 해결",
        "취소 재시도 시 잔액이 두 번 복구됨 — 취소 API에 멱등성이 없었음 → CANCEL-{원거래ID} 참조번호로 동일 원거래 중복 취소 차단"
      ],
      "role": [
        "팀 프로젝트(승인 경로) 이후 개인 fork에서 재설계·고도화 — 8개 앱, 테스트 87개",
        "멱등성·보상 트랜잭션·원장 분리·대사/정산 배치·BIN 라우팅·FDS 룰 엔진 전담"
      ]
    },
    {
      "id": 4,
      "title": "BookCard",
      "description": "AI 이미지를 활용한 책 소개 웹 서비스. 졸업작품 팀 프로젝트로 최우수상 수상 후, Spring Boot로 재설계·마이그레이션.",
      "period": "2024.09 - 2025.06",
      "githubUrl": "https://github.com/noiskk/bookcard",
      "demoUrl": null,
      "readmeSlug": "bookcard",
      "techStack": [
        "Spring Boot 3",
        "Spring Security",
        "JWT",
        "JPA",
        "MySQL",
        "React"
      ],
      "highlights": [
        "교내 졸업작품 최우수상 수상 → Spring Boot 전면 재설계",
        "GPT-4o + Gemini 4단계 프롬프트 체이닝 — 책 분석 → 5문장 요약 → 이미지 프롬프트 → 커버 이미지 생성, 단계별 출력을 다음 입력으로 누적",
        "SSE 실시간 진행률 스트리밍 — 약 21초 대기 구간을 단계별 스트리밍으로 처리, SecurityContext를 비동기 스레드에 전파해 인증 유지",
        "Spring Security + JWT 인증 체계 직접 설계 — JwtAuthFilter, 비회원 접근 허용/차단 분리, 토큰 만료 시 자동 로그아웃"
      ],
      "troubleshooting": [
        "SecurityContext 스레드 전파 — SSE 생성이 ExecutorService의 별도 스레드에서 실행되면서 ThreadLocal 기반 SecurityContext가 전파되지 않아 getCurrentUser() 호출 시 NPE 발생 → 요청 스레드에서 컨텍스트를 캡처해 자식 스레드에 직접 주입하고 finally에서 clearContext()로 스레드풀 오염을 방지해 해결",
        "북카드 생성 실패 시 DB 불완전 데이터 잔류 — 4단계 AI 체이닝 중 중간 단계 API 오류 시 앞 단계의 결과(summary 등)가 이미 DB에 커밋된 채로 남는 문제 → @Transactional로 전체 생성 과정을 하나의 트랜잭션으로 묶어 어느 단계에서든 실패하면 DB 저장 전체가 롤백되도록 해결",
        "SSE async dispatch Access Denied 로그 — SSE 응답 완료 후 Tomcat이 내부적으로 ASYNC dispatch를 발생시키는데 Spring Security 6가 필터 체인을 재실행하면서 빈 SecurityContext로 인해 anyRequest().authenticated() 룰에 차단 → SecurityConfig에 dispatcherTypeMatchers(DispatcherType.ASYNC).permitAll() 추가로 해결"
      ],
      "role": [
        "Phase 1 (Node.js): AI 기능 담당 — 4단계 프롬프트 체이닝, SSE 진행률 스트리밍",
        "Phase 2 (Spring Boot): 백엔드 전반 재설계 주도, Spring Security + JWT 구현"
      ]
    },
    {
      "id": 5,
      "title": "감사 로그 변조 방지 라이브러리",
      "description": "금융 시스템 감사 로그의 위변조·삭제·순서 변경을 탐지하는 Java 라이브러리. HMAC 해시 체인 구조로 중간 로그 변조 시 이후 체인 전체가 붕괴되어 즉시 탐지.",
      "period": "2026.03",
      "githubUrl": "https://github.com/khmandarrin/woori-fisa-backend-audit-log-integrity",
      "demoUrl": null,
      "readmeSlug": "audit-log",
      "techStack": [
        "Java",
        "Logback",
        "HMAC-SHA256",
        "JUnit 5",
        "Mockito",
        "JaCoCo"
      ],
      "highlights": [
        "HMAC 해시 체인 구조 설계 — 중간 로그 변조 시 이후 체인 전체 붕괴로 즉시 탐지",
        "4가지 검증 메커니즘: 단일 무결성 / 체인 연결성 / 파일 끝 삭제 탐지 / 연쇄 오류 추적",
        "Logback Appender 확장 방식으로 기존 로깅 시스템에 비침투적 적용 (설정 파일만 교체)",
        "Core(Appender) → Util(Formatter/Hasher) → Verifier 3계층 아키텍처 설계"
      ],
      "troubleshooting": [
        "중간 로그 하나가 깨지면 이후 전부 오류로 표시돼 실제 변조 지점을 못 찾음 — cascade 플래그 도입, cascade=false(최초 붕괴 지점)만 보면 root cause 특정 가능",
        "끝 로그를 잘라내면 체인 자체는 유효해 보여 탐지 불가 — 마지막 해시를 audit.head 파일에 별도 저장하고 검증 시 대조해 TAIL_TRUNCATION 탐지",
        "환경마다 로그 포맷이 달라 라이브러리 재사용 불가 — LogFormatter 인터페이스(Strategy 패턴)로 분리해 logback.xml 설정값만으로 포맷 교체 가능하게 개선"
      ],
      "role": [
        "LogVerifier 구현 — 4가지 검증 메커니즘 (HMAC 무결성 / 체인 연결성 / Tail Truncation / 연쇄 오류 추적)",
        "cascade 플래그로 실제 변조 지점과 파생 오류 구분"
      ]
    },
    {
      "id": 6,
      "title": "카드 내역 조회 3티어 시스템",
      "description": "Docker 기반 3티어 고가용성 아키텍처로 분기별 카드 거래 내역 조회 시스템 구축. 전 레이어 이중화와 MySQL InnoDB Cluster 읽기/쓰기 분리까지 직접 설계 및 구현.",
      "period": "2026.02",
      "githubUrl": null,
      "demoUrl": null,
      "readmeSlug": "card-3tier",
      "techStack": [
        "MySQL InnoDB Cluster",
        "MySQL Router",
        "Nginx",
        "Redis",
        "Tomcat",
        "Docker Compose",
        "Shell Script"
      ],
      "highlights": [
        "전 레이어 이중화: Master Nginx → Worker Nginx × 2 → Tomcat WAS × 2 → MySQL InnoDB Cluster × 3",
        "MySQL Router 읽기(6447)/쓰기(6446) 포트 분리 + 애플리케이션 DataSource 이중화",
        "depends_on + healthcheck 조합으로 9개 컨테이너 기동 순서 보장",
        "InnoDB Cluster 초기화 자동화 스크립트(setup-cluster.sh)로 팀원 누구나 단일 커맨드로 환경 재현"
      ],
      "troubleshooting": [
        "9개 컨테이너 동시 기동 시 Router가 MySQL보다 먼저 떠서 연결 실패 — depends_on만으로는 '프로세스 시작'만 보장됨 → healthcheck로 MySQL 응답을 확인한 뒤 Router가 기동하도록 순서 보장",
        "InnoDB Cluster 초기화가 4단계 수작업이라 팀원마다 환경 재현 실패 — setup-cluster.sh로 클러스터 생성·노드 조인·Router 부트스트랩을 자동화해 단일 커맨드로 통일",
        "WAS 2대 이중화 후 요청이 다른 WAS로 가면 로그인이 풀림 — 인메모리 세션이 인스턴스별로 분리됨 → Redis 세션 스토리지 공유로 해결"
      ],
      "role": [
        "전체 아키텍처 설계 참여 + DB 레이어 전담",
        "MySQL InnoDB Cluster 3노드 구성, Router 읽기/쓰기 분리, HikariCP DataSource 이중화"
      ]
    }
  ];
