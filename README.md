# Portfolio

Spring AI + RAG 기반 개인 포트폴리오 사이트.
방문자가 자연어로 질문하면 관련 문서를 벡터 검색해 LLM이 답변을 생성하는 챗봇이 메인이며, 프로젝트 목록/상세 페이지를 함께 제공한다.

---

## 프로젝트 구조

```
portfolio/
├── backend/          # Spring Boot (API 서버)
└── frontend/         # Next.js (UI)
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Backend | Java 17, Spring Boot 3.4, Spring AI 1.0 |
| Database | MySQL 8.0 (로컬), Spring Data JPA |
| Vector DB | Qdrant (Docker) |
| LLM | OpenAI gpt-4o-mini |
| Embedding | OpenAI text-embedding-3-small |
| Frontend | Next.js 16, TypeScript, Tailwind CSS |

---

## 아키텍처 (현재)

```
[Next.js :3000]
     │  POST /api/chat (SSE 스트리밍)
     │  GET  /api/projects
     ▼
[Spring Boot :8080]
     │
     ├── ChatService
     │    ├── ChatSessionStore        → ConcurrentHashMap (인메모리)
     │    ├── VectorStore.search()    → Qdrant (Docker :6334)
     │    └── ChatClient.prompt()     → OpenAI API
     │
     └── ProjectService              → MySQL (로컬 :3306)
          └── ProjectRepository (JPA)
```

### RAG 파이프라인

```
앱 시작 시:
  documents/*.md → TokenTextSplitter(500토큰) → Embedding → Qdrant 저장
  (시작마다 기존 컬렉션 삭제 후 재임베딩 → 문서 수정 즉시 반영)

요청 시:
  질문 + 히스토리 → 검색 쿼리 생성 → 유사도 Top-4 검색
  → 검색된 문서 + 대화 히스토리 → LLM 프롬프트 → SSE 스트리밍 응답
```

---

## 실행 방법

### 사전 준비
- OpenAI API Key
- MySQL 서버 실행 (로컬)
- Docker (Qdrant 실행용)

### 환경변수 설정

`backend/.env` 파일:
```
OPENAI_API_KEY=sk-...
```

### 실행

```bash
# 1. Qdrant 실행
cd backend
docker-compose up -d

# 2. 백엔드 실행 (앱 시작 시 MySQL 테이블 자동 생성 + 프로젝트 데이터 초기화 + 문서 임베딩)
./gradlew bootRun

# 3. 프론트 실행 (새 터미널)
cd ../frontend
npm run dev
```

접속: http://localhost:3000

---

## 주요 기능

### 챗봇 (`/`)
- 대화 히스토리를 함께 전송해 맥락 유지
- 관련 정보가 없는 질문은 직접 문의 안내
- 하단 플로팅 채팅바: 메시지 전송 시 채팅창이 위로 올라오는 UX

### 프로젝트 목록 (`/projects`)
- MySQL에서 프로젝트 목록 조회
- 기술 스택 태그, GitHub/Demo 링크

### 프로젝트 상세 (`/projects/[id]`)
- Overview, Highlights, Tech Stack 섹션

---

## 파일별 역할

### Backend

| 파일 | 역할 |
|------|------|
| `IngestionRunner.java` | 앱 시작 시 Qdrant 컬렉션 삭제 → 문서 재임베딩 |
| `DocumentIngester.java` | `documents/*.md` 청킹 → Qdrant 저장 |
| `ChatService.java` | 검색 쿼리 생성 → 유사도 검색 → 히스토리 포함 LLM 호출 |
| `ChatSessionStore.java` | 세션별 대화 히스토리 인메모리 관리 |
| `ProjectService.java` | 프로젝트 CRUD (MySQL) |
| `ProjectRepository.java` | Spring Data JPA Repository |
| `DataInitializer.java` | 앱 시작 시 프로젝트 초기 데이터 삽입 |
| `StringListConverter.java` | List<String> ↔ JSON 컬럼 변환 |

### Frontend

| 파일 | 역할 |
|------|------|
| `FloatingChat.tsx` | 하단 플로팅 채팅바 + 채팅창 (Client Component) |
| `MessageBubble.tsx` | 메시지 말풍선 (Markdown 렌더링) |
| `HeroSection.tsx` | 메인 페이지 프로필/소개 섹션 |
| `ProjectsSection.tsx` | 메인 페이지 프로젝트 미리보기 섹션 |
| `lib/api.ts` | 백엔드 API fetch 래퍼 (SSE 스트리밍 포함) |
| `app/projects/page.tsx` | 전체 프로젝트 목록 (Server Component) |
| `app/projects/[id]/page.tsx` | 프로젝트 상세 (Server Component) |

---

## 콘텐츠 수정 방법

### 챗봇 정보 수정
`backend/src/main/resources/documents/` 폴더의 md 파일 수정 후 백엔드 재시작.

| 파일 | 내용 |
|------|------|
| `profile.md` | 이름, 이메일, 자기소개, 학력 |
| `skills.md` | 기술 스택 |
| `projects.md` | 프로젝트 상세 (RAG용) |

### 프로젝트 카드 수정
`DataInitializer.java`에서 초기 데이터 수정 후 DB 초기화 후 재시작.
또는 MySQL에서 직접 `projects` 테이블 수정.

---

## 아키텍처 발전 계획

### Phase 1 — Redis 도입

**목적**: 채팅 세션 안정화, API 캐싱, 요금 보호

#### 1-1. 채팅 세션 저장소 교체

현재 `ChatSessionStore`는 `ConcurrentHashMap`으로 인메모리 관리.
서버 재시작 시 모든 대화 히스토리가 소멸되는 문제가 있음.

```
현재: 세션 → ConcurrentHashMap (메모리)
개선: 세션 → Redis (TTL 1시간, 서버 재시작 후에도 유지)
```

변경 대상:
- `ChatSessionStore.java` → `RedisTemplate` 기반으로 교체
- `build.gradle` → `spring-boot-starter-data-redis` 추가
- `docker-compose.yml` → Redis 서비스 추가
- `application.yml` → Redis 연결 설정 추가

기대 효과:
- 서버 재시작 후에도 대화 이어가기 가능
- 향후 서버 다중 인스턴스 운영 시 세션 공유 가능
- TTL 설정으로 오래된 세션 자동 정리

#### 1-2. 프로젝트 API 캐싱

프로젝트 데이터는 거의 변경되지 않으므로 매 요청마다 DB를 조회할 필요 없음.

```
현재: GET /api/projects → 매번 MySQL 쿼리
개선: GET /api/projects → Redis 캐시 HIT → MySQL 쿼리 생략
                          (캐시 MISS 시에만 DB 조회 후 Redis 저장)
```

변경 대상:
- `ProjectService.java` → `@Cacheable`, `@CacheEvict` 어노테이션 적용
- `PortfolioApplication.java` → `@EnableCaching` 추가

#### 1-3. Rate Limiting (OpenAI 비용 보호)

공개 배포 시 특정 세션에서 채팅을 과도하게 보내면 OpenAI 비용이 급증할 수 있음.
Redis Sliding Window 방식으로 분당 요청 횟수를 제한.

```
현재: 요청 제한 없음
개선: 세션당 분당 10회 제한 → 초과 시 안내 메시지 반환
```

변경 대상:
- `RateLimiter.java` (신규) → Redis increment + TTL 기반 카운터
- `ChatController.java` → 요청 처리 전 RateLimiter 체크

#### Redis 적용 시 docker-compose.yml 변경안

```yaml
services:
  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  qdrant_data:
  redis_data:
```

---

### Phase 2 — 서비스 분리

**목적**: 역할별 독립 배포, 장애 격리, 독립 스케일 아웃

#### 현재 구조의 한계

Spring Boot 단일 서버가 프로젝트 API + 채팅 + RAG + 임베딩을 모두 담당.
채팅 서비스는 OpenAI 호출로 응답이 느린 반면, 프로젝트 API는 단순 CRUD로 빠름.
두 책임이 하나의 서버에 묶여 있어 독립적인 확장이나 장애 격리가 불가능.

#### 분리 목표 구조

```
[Next.js Frontend]
        │
        ├── GET /api/projects  ──▶  [Portfolio API 서버 :8080]
        │                                 └── MySQL
        │
        └── POST /api/chat     ──▶  [Chat 서버 :8081]
                                          ├── Redis (세션)
                                          ├── Qdrant (벡터 검색)
                                          └── OpenAI API
```

#### 분리 시 각 서버의 책임

**Portfolio API 서버**
- 프로젝트 CRUD (`/api/projects`)
- 향후 관리자 기능 추가 시 이 서버에서 담당
- 의존: MySQL

**Chat 서버**
- 채팅 처리 및 SSE 스트리밍 (`/api/chat`)
- RAG 파이프라인 (문서 임베딩 + 검색)
- 의존: Redis, Qdrant, OpenAI API

#### 기대 효과

| 항목 | 효과 |
|------|------|
| 장애 격리 | Chat 서버 다운돼도 프로젝트 페이지 정상 동작 |
| 독립 확장 | 채팅 트래픽 증가 시 Chat 서버만 스케일 아웃 |
| 배포 독립성 | RAG 문서 수정 → Chat 서버만 재시작 |
| 관심사 분리 | 각 서버가 단일 책임만 가짐 |

#### 분리 작업 범위

- 현재 단일 `backend/` 를 `backend-api/`, `backend-chat/` 두 모듈로 분리
- 공통 DTO(Project 등)는 별도 모듈로 추출하거나 각 서버에 복제
- Next.js `lib/api.ts`에서 각 서버 엔드포인트를 분리하여 호출
- `docker-compose.yml`에 두 서버 컨테이너 정의

---

## 남은 작업

### 기능 완성
- [ ] `profile.md` 실제 정보 입력 (이름, 이메일, 자기소개)
- [ ] `skills.md` 실제 기술 스택으로 수정

### 아키텍처 개선
- [ ] **Phase 1-1** Redis 채팅 세션 저장소 교체
- [ ] **Phase 1-2** 프로젝트 API 캐싱 (`@Cacheable`)
- [ ] **Phase 1-3** Rate Limiting 구현
- [ ] **Phase 2** Portfolio API / Chat 서버 분리

### 운영
- [ ] 환경별 설정 분리 (`application-local.yml`, `application-prod.yml`)
- [ ] GitHub Actions CI/CD 파이프라인 구성
- [ ] 배포 (AWS / NCP)
