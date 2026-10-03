// 프로젝트 상세 페이지용 구조화 콘텐츠 (초안).
//
// 사실의 원본은 backend DataInitializer.java / readmes/*.md 이고, 여기서는 같은 내용을
// "한 줄 요약 · 핵심 구현(제목+설명) · 트러블슈팅(문제/원인/해결)"로 나눠 담는다.
// 정적 파일이라 백엔드가 꺼져 있어도 상세 페이지가 그대로 표시된다.
//
// 키는 프로젝트 ID. DataInitializer가 TRUNCATE 후 재시딩해 ID는 항상 1부터 순차 부여되므로
// generateStaticParams(1~6)와 같은 전제다. 프로젝트를 추가·순서 변경하면 함께 갱신할 것.

export interface HighlightItem {
  title: string;
  body: string;
}

export interface TroubleItem {
  problem: string;
  cause: string;
  solution: string;
}

export interface ProjectDetailContent {
  tagline: string; // 한 줄 요약
  teamLabel?: string; // 팀 구성/포지션 (근거가 있는 프로젝트만)
  highlights: HighlightItem[];
  troubleshooting: TroubleItem[];
}

export const PROJECT_DETAILS: Record<number, ProjectDetailContent> = {
  1: {
    tagline: '방문자가 자연어로 질문하면 제 문서를 검색해 대신 답하는 RAG 챗봇이 메인인 포트폴리오 사이트.',
    teamLabel: '개인 프로젝트',
    highlights: [
      {
        title: 'RAG 파이프라인 직접 구현',
        body: '문서 청킹 → 임베딩 → Qdrant 저장 → 유사도 검색 → LLM 답변 생성까지 단계별 파라미터를 기본값에 맡기지 않고 직접 정했습니다.',
      },
      {
        title: '측정으로 정한 유사도 임계값',
        body: '골든셋 30문항으로 180개 조합을 비교해 임계값을 0.35에서 0.30으로 조정했습니다. 관련 질문 Hit는 0.591 → 0.864로 올랐고, 무관 질문은 전부 차단(Reject 1.000)됩니다.',
      },
      {
        title: '근거를 보여주는 답변',
        body: '임계값에 미달하면 지어내지 않고 직접 문의를 안내하며, 답변마다 참고한 문서를 출처로 함께 표시합니다.',
      },
      {
        title: '운영을 고려한 Redis 활용',
        body: '세션 히스토리(TTL), 프로젝트 API 캐싱, 세션당 분당 요청 제한(Rate Limiting)으로 서버 재시작과 OpenAI 비용 문제를 함께 다뤘습니다.',
      },
      {
        title: '문서 수정이 즉시 반영되는 색인',
        body: '앱 시작 시 기존 컬렉션을 비우고 전체를 다시 임베딩해, 문서를 고쳐도 벡터가 중복 누적되지 않습니다.',
      },
      {
        title: 'SSE 스트리밍과 대화 맥락',
        body: '대화 히스토리를 함께 전송해 후속 질문을 처리하고, 답변을 SSE로 스트리밍합니다.',
      },
    ],
    troubleshooting: [
      {
        problem: 'HTTP 배포 환경에서 채팅이 시작조차 되지 않음',
        cause: 'crypto.randomUUID()가 보안 컨텍스트(HTTPS)에서만 동작해 세션 ID 생성이 실패했습니다.',
        solution: 'Math.random 기반 ID 생성으로 교체해 해결했습니다.',
      },
      {
        problem: 'SSE 응답이 중간에 잘리거나 줄바꿈이 사라짐',
        cause: '네트워크 청크가 이벤트 경계와 어긋나게 도착했습니다.',
        solution: '\\n\\n 경계로 버퍼링하고, 이벤트 안의 data: 라인들을 합쳐서 파싱하도록 수정했습니다.',
      },
      {
        problem: '문서 수정 후 재시작하면 옛 내용과 새 내용이 함께 검색됨',
        cause: '재시작할 때마다 벡터가 계속 누적되는 구조였습니다.',
        solution: '시작 시 컬렉션을 삭제하고 전체를 다시 임베딩하는 방식으로 단순화했습니다.',
      },
    ],
  },

  2: {
    tagline: '소상공인의 비금융 데이터를 AI로 분석해 신용등급을 산출하는 디지털 포용금융 대출 플랫폼.',
    teamLabel: '5명 팀 · Infra Leader',
    highlights: [
      {
        title: 'WireGuard로 AWS·온프레미스 하이브리드 연결',
        body: 'NAT 뒤 온프레미스가 AWS로 먼저 연결을 여는 WireGuard VPN으로 Site-to-Site VPN을 쓸 수 없는 문제를 해결했고, AZ별 허브를 Active-Active로 이중화했습니다.',
      },
      {
        title: 'DB 고가용성 — InnoDB Cluster 3노드',
        body: '디스크 I/O 장애를 겪은 뒤 3노드 클러스터를 구축했습니다. vCPU 쿼터 부족은 인스턴스 다운사이징으로 자체 해결했고, 자동 failover를 검증했습니다.',
      },
      {
        title: '수정·삭제가 불가능한 감사 로그',
        body: '전자금융감독규정에 맞춰 @AuditLog AOP로 로그를 수집하고, DB 트리거로 수정과 삭제를 원천 차단했습니다.',
      },
      {
        title: '무중단 배포와 비용·보안 개선',
        body: 'CodeDeploy Blue/Green(Canary)으로 무중단 배포를 구성했고, VPC Endpoint로 상시 NAT를 없애 비용과 공격 표면을 줄였습니다.',
      },
      {
        title: '설계 번복까지 남긴 의사결정 기록',
        body: '의사결정 로그(ADR) 58건을 기록하며 설계를 뒤집은 과정까지 문서화했습니다.',
      },
    ],
    troubleshooting: [
      {
        problem: 'VPN 터널은 연결됐는데 DB 연결만 실패',
        cause: '온프레미스 eth0 IP로 들어온 패킷이 wg0 인터페이스로 들어와 수신이 거부됐습니다.',
        solution: 'DB_HOST와 라우트를 터널 IP로 바꿨습니다. 운영 DB는 건드리지 않고 클라우드 쪽 설정만으로 해결했습니다.',
      },
      {
        problem: 'ElastiCache로 이전한 뒤 앱이 기동하지 않음',
        cause: '포트는 열려 있었지만 TLS 없이 접속해 핸드셰이크가 교착됐고, 관리형 Redis가 CONFIG 명령을 막고 있었습니다.',
        solution: 'TLS를 활성화하고 ConfigureRedisAction.NO_OP 빈을 등록해 해결했습니다.',
      },
      {
        problem: '로그인 실패가 200 OK로 위장되어 보임',
        cause: 'CORS 403 응답을 CloudFront의 SPA용 오류 페이지가 index.html 200으로 바꿔 돌려주고 있었습니다.',
        solution: '오리진(ALB)에 직접 요청해 계층을 나눠 원인을 특정하고 allowedOrigins를 수정했습니다.',
      },
    ],
  },

  3: {
    tagline: '실물카드 대면결제 전 구간(POS → VAN → 카드사 → 은행)을 구현한 분산 결제 시스템. 핵심은 분산 환경의 결제 정합성입니다.',
    teamLabel: '팀 프로젝트 이후 개인 fork에서 재설계·고도화',
    highlights: [
      {
        title: '재시도해도 이중결제가 나지 않는 구조',
        body: 'STAN 기반 멱등키를 전 구간에 전파하고, 예약-후-실행 구조로 재시도 시 이중결제를 차단했습니다.',
      },
      {
        title: '망취소·보상 트랜잭션',
        body: '응답이 불확실한 거래는 실패로 단정하지 않고 대사 대상으로 남기며, 이후 배치가 은행에 재조회해 정리합니다.',
      },
      {
        title: '취소도 멱등하게',
        body: 'CANCEL-{원거래ID} 참조번호로 같은 원거래를 중복 취소해도 잔액이 두 번 복구되지 않게 막았습니다.',
      },
      {
        title: 'INSERT-only 불변 원장 분리',
        body: '원장을 독립 서비스로 분리하고, 데이터 소유권을 기준으로 서비스 경계를 나눴습니다.',
      },
      {
        title: '정산·라우팅·이상거래 탐지',
        body: 'Spring Batch 대사와 가맹점 정산, VAN BIN 기반 카드사 라우팅, 점수를 합산하는 FDS 룰 엔진을 구현했습니다.',
      },
    ],
    troubleshooting: [
      {
        problem: '보상(취소) 기록이 DB에 남지 않음',
        cause: '바깥 비즈니스 트랜잭션이 롤백되면서, 같은 트랜잭션에 합류해 있던 보상 기록도 함께 삭제됐습니다.',
        solution: 'REQUIRES_NEW로 독립 커밋해 해결했습니다.',
      },
      {
        problem: '배치가 2회차 실행부터 아무것도 읽지 않음',
        cause: 'Reader가 싱글턴이라 이전 실행의 id 커서가 그대로 남아 있었습니다.',
        solution: '@StepScope로 실행마다 새로 생성하고, 페이지 밀림은 keyset paging으로 해결했습니다.',
      },
      {
        problem: '취소를 재시도하면 잔액이 두 번 복구됨',
        cause: '취소 API에 멱등성이 없었습니다.',
        solution: 'CANCEL-{원거래ID} 참조번호로 같은 원거래의 중복 취소를 차단했습니다.',
      },
    ],
  },

  4: {
    tagline: 'AI 이미지를 활용한 책 소개 웹 서비스. 졸업작품으로 최우수상을 받은 뒤 Spring Boot로 재설계했습니다.',
    teamLabel: '졸업작품 팀 프로젝트',
    highlights: [
      {
        title: 'Node.js에서 Spring Boot로 전면 재설계',
        body: '졸업작품 수상 후 백엔드 전반을 Spring Boot로 다시 설계하고 마이그레이션하는 작업을 주도했습니다.',
      },
      {
        title: '4단계 프롬프트 체이닝',
        body: 'GPT-4o와 Gemini로 책 분석 → 5문장 요약 → 이미지 프롬프트 → 커버 이미지 생성 순서로 이어지며, 단계별 출력이 다음 입력으로 누적됩니다.',
      },
      {
        title: 'SSE 실시간 진행률',
        body: '약 21초의 대기 구간을 단계별 진행률로 스트리밍하고, SecurityContext를 비동기 스레드에 전파해 인증을 유지했습니다.',
      },
      {
        title: 'Spring Security + JWT 인증 설계',
        body: 'JwtAuthFilter를 직접 구현하고 비회원 접근 허용·차단을 분리했으며, 토큰 만료 시 자동 로그아웃되도록 구성했습니다.',
      },
    ],
    troubleshooting: [
      {
        problem: 'SSE 생성 중 getCurrentUser()에서 NPE 발생',
        cause: 'SSE 생성이 ExecutorService의 별도 스레드에서 실행되면서 ThreadLocal 기반 SecurityContext가 전파되지 않았습니다.',
        solution: '요청 스레드에서 컨텍스트를 캡처해 자식 스레드에 직접 주입하고, finally에서 clearContext()로 스레드풀 오염을 막았습니다.',
      },
      {
        problem: '북카드 생성 중 DB 커넥션이 약 21초 동안 점유됨',
        cause: 'AI 호출 4단계를 포함한 생성 전 과정에 @Transactional이 걸려 있어, 호출이 끝날 때까지 커넥션 풀의 커넥션을 붙잡고 있었습니다.',
        solution: 'AI 호출은 트랜잭션 밖에서 실행하고, DB 저장 구간만 TransactionTemplate으로 짧게 묶어 점유 시간을 저장 시간(수십 ms) 수준으로 줄였습니다.',
      },
      {
        problem: 'SSE 완료 후 Access Denied 로그가 남음',
        cause: 'SSE 응답이 끝나면 Tomcat이 ASYNC dispatch를 발생시키는데, Spring Security 6가 필터 체인을 다시 실행하면서 빈 SecurityContext가 authenticated() 규칙에 막혔습니다.',
        solution: 'SecurityConfig에 dispatcherTypeMatchers(DispatcherType.ASYNC).permitAll()을 추가해 해결했습니다.',
      },
    ],
  },

  5: {
    tagline: '금융 시스템 감사 로그의 위변조·삭제·순서 변경을 탐지하는 Java 라이브러리. HMAC 해시 체인으로 중간 로그가 바뀌면 이후 체인이 모두 무너집니다.',
    highlights: [
      {
        title: 'HMAC 해시 체인',
        body: '각 로그가 이전 로그의 해시에 연결돼, 중간 로그를 바꾸면 이후 체인 전체가 붕괴해 즉시 탐지됩니다.',
      },
      {
        title: '4가지 검증 메커니즘',
        body: '단일 로그 무결성, 체인 연결성, 파일 끝 삭제 탐지, 연쇄 오류 추적으로 변조 유형을 나눠 검증합니다.',
      },
      {
        title: '기존 로깅에 비침투적으로 적용',
        body: 'Logback Appender를 확장해, 설정 파일만 교체하면 기존 로깅 시스템에 적용되도록 했습니다.',
      },
      {
        title: '3계층 아키텍처',
        body: 'Core(Appender) → Util(Formatter/Hasher) → Verifier로 책임을 나눴습니다.',
      },
    ],
    troubleshooting: [
      {
        problem: '중간 로그 하나가 깨지면 이후 전부 오류로 표시돼 실제 변조 지점을 못 찾음',
        cause: '해시 체인 특성상 한 번 끊기면 뒤따르는 모든 로그가 연쇄적으로 불일치합니다.',
        solution: 'cascade 플래그를 도입했습니다. cascade=false인 최초 붕괴 지점만 보면 원인(root cause)을 특정할 수 있습니다.',
      },
      {
        problem: '끝 로그를 잘라내면 체인은 유효해 보여 탐지할 수 없음',
        cause: '뒤쪽 로그를 삭제해도 남은 앞부분의 체인 자체는 계속 유효합니다.',
        solution: '마지막 해시를 audit.head 파일에 따로 저장하고 검증할 때 대조해 TAIL_TRUNCATION을 탐지합니다.',
      },
      {
        problem: '환경마다 로그 포맷이 달라 라이브러리를 재사용할 수 없음',
        cause: '포맷 처리가 구현에 묶여 있었습니다.',
        solution: 'LogFormatter 인터페이스(Strategy 패턴)로 분리해, logback.xml 설정값만으로 포맷을 바꿀 수 있게 했습니다.',
      },
    ],
  },

  6: {
    tagline: 'Docker 기반 3티어 고가용성 아키텍처로 구축한 분기별 카드 거래 내역 조회 시스템.',
    teamLabel: '전체 설계 참여 · DB 레이어 전담',
    highlights: [
      {
        title: '전 레이어 이중화',
        body: 'Master Nginx → Worker Nginx × 2 → Tomcat WAS × 2 → MySQL InnoDB Cluster × 3 구조로 어느 계층이 한 대 죽어도 서비스가 이어지게 했습니다.',
      },
      {
        title: '읽기·쓰기 분리',
        body: 'MySQL Router의 읽기(6447)/쓰기(6446) 포트를 분리하고, 애플리케이션 DataSource도 이중화했습니다(HikariCP).',
      },
      {
        title: '9개 컨테이너 기동 순서 보장',
        body: 'depends_on과 healthcheck를 함께 써서 의존하는 서비스가 준비된 뒤에 다음 컨테이너가 뜨도록 했습니다.',
      },
      {
        title: '한 줄로 재현되는 클러스터 환경',
        body: '클러스터 생성·노드 조인·Router 부트스트랩을 setup-cluster.sh로 자동화해, 팀원 누구나 단일 커맨드로 같은 환경을 만들 수 있습니다.',
      },
    ],
    troubleshooting: [
      {
        problem: '9개 컨테이너를 동시에 띄우면 Router가 MySQL보다 먼저 떠서 연결 실패',
        cause: 'depends_on은 프로세스가 시작됐다는 것만 보장하고, 서비스가 준비됐는지는 보장하지 않습니다.',
        solution: 'healthcheck로 MySQL 응답을 확인한 뒤 Router가 기동하도록 순서를 보장했습니다.',
      },
      {
        problem: 'InnoDB Cluster 초기화가 4단계 수작업이라 팀원마다 환경 재현에 실패',
        cause: '수작업 절차라 사람마다 순서와 설정이 달라졌습니다.',
        solution: 'setup-cluster.sh로 클러스터 생성·노드 조인·Router 부트스트랩을 자동화해 단일 커맨드로 통일했습니다.',
      },
      {
        problem: 'WAS를 2대로 이중화하자 요청이 다른 WAS로 가면 로그인이 풀림',
        cause: '인메모리 세션이 인스턴스마다 분리돼 있었습니다.',
        solution: 'Redis 세션 스토리지를 공유하도록 바꿔 해결했습니다.',
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 기술 선택 이유 — 프로젝트에서 강조할 판단만 2~3개
//
// 근거: README(readmes/*.md)와 프로젝트 노트(면접용·Redis 설계)에 적힌 판단만 옮겼다.
// `vs`는 비교한 대안이 있을 때만 적는다. 문서에 이유가 없는 항목은 넣지 않았다.
// ─────────────────────────────────────────────────────────────────────────────

export interface TechChoice {
  tech: string;
  vs?: string; // 비교한 대안
  reason: string;
}

export const TECH_CHOICES: Record<number, TechChoice[]> = {
  // 1. 포트폴리오 RAG 챗봇
  1: [
    {
      tech: 'RAG',
      vs: '파인튜닝',
      reason:
        '이력과 프로젝트가 수시로 바뀌기 때문에, 재학습 없이 문서만 고치면 바로 반영되는 RAG가 맞았습니다. 어떤 문서를 근거로 답했는지 추적할 수 있다는 점도 이유였습니다.',
    },
    {
      tech: '슬라이딩 윈도우 (Redis ZSET)',
      vs: '고정 윈도우',
      reason:
        '고정 윈도우는 경계에서 2초에 20회까지 통과할 수 있습니다. 목적이 OpenAI 비용 보호라 "최근 60초" 기준으로 세는 슬라이딩 윈도우를 택했습니다.',
    },
    {
      tech: '시작 시 전체 재임베딩',
      vs: '증분 갱신',
      reason:
        '문서가 8개 규모라 전체 재색인은 몇 초면 끝나고, 증분 갱신 로직의 복잡도가 실익보다 컸습니다. 문서가 크게 늘면 성립하지 않는 방식이라는 한계는 알고 선택했습니다.',
    },
  ],

  // 2. SOFIT
  2: [
    {
      tech: 'WireGuard VPN',
      vs: 'AWS Site-to-Site VPN',
      reason:
        '온프레미스가 NAT 뒤라 AWS가 먼저 연결하는 표준 VPN을 쓸 수 없었습니다. 아웃바운드는 허용된다는 점을 이용해 온프레미스가 먼저 연결을 여는 방식으로 풀었고, 비용도 월 $36에서 약 $3으로 줄었습니다.',
    },
    {
      tech: 'MySQL InnoDB Cluster 3노드',
      vs: '단일 DB',
      reason:
        '디스크 I/O 장애로 DB가 내려가는 일을 겪어 자동 failover가 필요했습니다. 다수결 기반이라 짝수 노드는 스플릿 브레인 위험이 있어 3노드로 구성했고, Primary 강제 종료 후 자동 승격까지 검증했습니다.',
    },
    {
      tech: 'DB 트리거 (감사 로그 변경 차단)',
      vs: 'HMAC 해시체인',
      reason:
        'HMAC은 탐지 수단이지 방지 수단이 아니고, root가 데이터와 HMAC을 함께 다시 계산하면 우회됩니다. 위협 모델에 실제로 기여하지 않는 장치는 걷어내고, DB 트리거로 수정·삭제 자체를 막았습니다.',
    },
  ],

  // 3. 카드 결제 시스템
  3: [
    {
      tech: '응답 불확실 거래 → 대사 대상',
      vs: '실패로 단정',
      reason:
        '응답을 받지 못한 거래를 실패로 단정하지 않고 대사 대상으로 남긴 뒤, 배치가 은행에 재조회해 정리하도록 했습니다.',
    },
    {
      tech: 'INSERT-only 원장 서비스',
      reason: '데이터 소유권을 기준으로 서비스 경계를 나누고, 원장은 수정 없이 추가만 하는 불변 구조로 분리했습니다.',
    },
  ],

  // 4. BookCard
  4: [
    {
      tech: '4단계 프롬프트 체이닝',
      vs: '단일 프롬프트',
      reason:
        '책 분석 → 요약 → 이미지 프롬프트 → 이미지 생성으로 나누고, 각 단계의 출력을 다음 단계의 입력으로 넘겨 품질을 높였습니다.',
    },
    {
      tech: 'SSE',
      vs: 'WebSocket',
      reason:
        '서버에서 클라이언트로 가는 단방향 통신이면 충분하고 HTTP 기반이라 방화벽에도 친화적입니다. 약 21초 걸리는 생성 동안 진행 상황을 보여 이탈을 줄입니다.',
    },
  ],

  // 5. 감사 로그 라이브러리
  5: [
    {
      tech: 'HMAC 해시 체인',
      reason:
        '각 로그가 이전 로그의 해시에 이어져, 로그 하나를 바꾸거나 지우거나 순서를 바꾸면 이후 체인이 어긋나 바로 드러납니다.',
    },
    {
      tech: '마지막 해시를 별도 파일(audit.head)에 저장',
      reason: '끝 로그를 잘라내면 체인 자체는 유효해 보이기 때문에, 검증할 때 별도로 저장해 둔 값과 대조해 끝 삭제를 탐지합니다.',
    },
  ],

  // 6. 카드 내역 조회 3티어
  6: [
    {
      tech: 'Redis 세션 스토리지',
      vs: '인메모리 세션',
      reason:
        'WAS를 2대로 이중화하자 세션이 인스턴스마다 분리돼 다른 WAS로 요청이 가면 로그인이 풀렸습니다. 세션을 Redis에서 공유하도록 바꿨습니다.',
    },
    {
      tech: 'healthcheck + depends_on',
      vs: 'depends_on만 사용',
      reason:
        'depends_on은 프로세스가 시작됐다는 것만 보장해서 Router가 MySQL보다 먼저 떠 실패했습니다. healthcheck로 MySQL 응답을 확인한 뒤 다음 컨테이너가 뜨게 했습니다.',
    },
  ],
};
