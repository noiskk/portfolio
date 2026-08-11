# Portfolio

Spring AI + RAG 기반 개인 포트폴리오 사이트.
방문자가 자연어로 질문하면 관련 문서를 벡터 검색해 LLM이 답변을 생성하는 챗봇이 메인이며, 프로젝트 목록/상세 페이지를 함께 제공한다.

---

## 프로젝트 구조

```
portfolio/
├── backend/          # Spring Boot (API 서버)
├── frontend/         # Next.js (UI, GitHub Pages 정적 배포)
└── .github/          # GitHub Actions (Pages 배포)
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Backend | Java 17, Spring Boot 3.4, Spring AI 1.0 |
| Database | MySQL 8.0, Spring Data JPA |
| Cache/Session | Redis 7 (세션 히스토리, API 캐시, Rate Limit) |
| Vector DB | Qdrant (Docker) |
| LLM | OpenAI gpt-4o-mini |
| Embedding | OpenAI text-embedding-3-small |
| Frontend | Next.js 16, TypeScript, Tailwind CSS |

---

## 아키텍처

```
[Next.js :3000]  ← GitHub Pages 정적 배포 (out/)
     │  POST /api/chat (SSE 스트리밍, 429 시 안내)
     │  GET  /api/projects
     ▼
[Spring Boot :8080]
     │
     ├── RateLimiter               → Redis ZSET (세션당 분당 10회, 슬라이딩 윈도우)
     │
     ├── ChatService
     │    ├── ChatSessionStore     → Redis List (TTL 1시간, 대화마다 갱신)
     │    ├── VectorStore.search() → Qdrant (Docker :6334, 유사도 임계값 0.35)
     │    └── ChatClient.prompt()  → OpenAI API
     │
     └── ProjectService            → MySQL (로컬 :3306)
          └── @Cacheable           → Redis 캐시 (TTL 10분, 재시딩 시 무효화)
```

### RAG 파이프라인

```
앱 시작 시 (Indexing):
  documents/*.md + readmes/*.md
  → TokenTextSplitter(500토큰, 100토큰 overlap) → Embedding → Qdrant 저장
  (시작마다 기존 컬렉션 삭제 후 재임베딩 → 문서 수정 즉시 반영)

요청 시 (Retrieval + Generation):
  질문 + 히스토리 → 검색 쿼리 보정 → 유사도 검색 (Top-4, 임계값 0.35)
  → event:sources 로 출처(파일명) 먼저 전송
  → 검색 청크 + 대화 히스토리 → LLM 프롬프트 → SSE 스트리밍 응답
  → 프론트가 답변 하단에 "참고 문서" 칩 표시
```

---

## 실행 방법

### 사전 준비
- OpenAI API Key
- MySQL 서버 실행 (로컬)
- Docker (Qdrant + Redis 실행용)

### 환경변수 설정

`backend/.env` 파일 (`.env.example` 참고):
```
OPENAI_API_KEY=sk-...
DB_PASSWORD=...
```

### 실행

```bash
# 1. Qdrant + Redis 실행
cd backend
docker-compose up -d

# 2. 백엔드 실행 (테이블 생성 + 프로젝트 데이터 초기화 + 문서 임베딩)
./gradlew bootRun

# 3. 프론트 실행 (새 터미널)
cd ../frontend
npm run dev
```

접속: http://localhost:3000

---

## 주요 기능

### 챗봇 (`/`)
- 대화 히스토리를 함께 전송해 맥락 유지 (Redis, 서버 재시작에도 유지)
- 답변마다 근거가 된 참고 문서 표시 (RAG 출처 추적)
- 유사도 임계값으로 관련 정보가 없는 질문은 직접 문의 안내
- 세션당 분당 10회 요청 제한 (OpenAI 비용 보호)
- 하단 플로팅 채팅바: 메시지 전송 시 채팅창이 위로 올라오는 UX

### 프로젝트 목록 (`/projects`)
- MySQL에서 프로젝트 목록 조회 (Redis 캐시)
- 기술 스택 태그, GitHub/Demo 링크

### 프로젝트 상세 (`/projects/[id]`)
- 담당 역할, Highlights, Tech Stack, Troubleshooting, README 토글

---

## 파일별 역할

### Backend

| 파일 | 역할 |
|------|------|
| `IngestionRunner.java` | 앱 시작 시 Qdrant 컬렉션 삭제 → 문서 재임베딩 (실패해도 앱은 기동) |
| `DocumentIngester.java` | `documents/*.md` + `readmes/*.md` 청킹 → Qdrant 저장 |
| `ChatService.java` | 검색 쿼리 보정 → 임계값 유사도 검색 → 출처 이벤트 + LLM 스트리밍 |
| `ChatSessionStore.java` | 세션별 대화 히스토리 Redis 저장 (TTL 1시간) |
| `RateLimiter.java` | Redis ZSET 슬라이딩 윈도우, 세션당 분당 10회 |
| `CacheConfig.java` | RedisCacheManager (JSON 직렬화, TTL 10분) |
| `ProjectService.java` | 프로젝트 조회 (`@Cacheable`) + README 이미지 경로 변환 |
| `DataInitializer.java` | 앱 시작 시 프로젝트 데이터 재시딩 + 캐시 무효화 |
| `StringListConverter.java` | List<String> ↔ JSON 컬럼 변환 |

### Frontend

| 파일 | 역할 |
|------|------|
| `FloatingChat.tsx` | 하단 플로팅 채팅바 + 채팅창 (Client Component) |
| `MessageBubble.tsx` | 메시지 말풍선 (Markdown 렌더링 + 참고 문서 칩) |
| `HeroSection.tsx` | 메인 페이지 프로필/소개 섹션 |
| `ProjectsSection.tsx` | 메인 페이지 프로젝트 미리보기 (클라이언트 페칭) |
| `ProjectDetail.tsx` | 프로젝트 상세 (클라이언트 페칭 + 오프라인 안내) |
| `lib/api.ts` | 백엔드 API 래퍼 (SSE content/sources 이벤트 파싱, 429 처리) |

---

## 콘텐츠 수정 방법

### 챗봇 정보 수정
`backend/src/main/resources/documents/`, `readmes/` 폴더의 md 파일 수정 후 백엔드 재시작.

| 파일 | 내용 |
|------|------|
| `documents/profile.md` | 이름, 이메일, 자기소개, 학력, 자격증 |
| `documents/skills.md` | 기술 스택 |
| `documents/projects.md` | 프로젝트 요약 (RAG용) |
| `readmes/*.md` | 프로젝트별 상세 README (RAG + 상세 페이지 토글) |

### 프로젝트 카드 수정
`DataInitializer.java`에서 초기 데이터 수정 후 재시작 (TRUNCATE 후 재시딩).
프로젝트 개수가 바뀌면 `frontend/app/projects/[id]/page.tsx`의 `generateStaticParams` ID 목록도 함께 수정.

---

## 배포

### 프론트엔드 — GitHub Pages (구성 완료)

`main` 브랜치의 `frontend/**` 변경 시 `.github/workflows/deploy-pages.yml`이 정적 빌드 후 Pages에 배포한다.

저장소 설정 필요:
1. Settings → Pages → Source를 **GitHub Actions**로
2. Settings → Variables → `NEXT_PUBLIC_API_URL`에 백엔드 공개 HTTPS 주소 (백엔드 배포 후)
   - 미설정 시 사이트는 뜨지만 챗봇/프로젝트 데이터는 오프라인 안내 표시

### 백엔드 — 예정

GitHub Pages는 HTTPS이므로 백엔드도 **HTTPS 엔드포인트**가 필요하다 (mixed content 차단).
계획: EC2(또는 NCP) + 도메인 + Let's Encrypt(Caddy/nginx) → `application-prod.yml` 프로필로 기동.
접속 정보는 전부 환경변수 주입 (`.env.example` 참고).

---

## 아키텍처 발전 계획

### Phase 1 — Redis 도입 ✅ (완료)

- ✅ 채팅 세션 저장소: ConcurrentHashMap → Redis List (TTL 1시간)
- ✅ 프로젝트 API 캐싱: `@Cacheable` + RedisCacheManager (TTL 10분)
- ✅ Rate Limiting: ZSET 슬라이딩 윈도우, 세션당 분당 10회 → 429

### Phase 2 — 서비스 분리 (계획)

Spring Boot 단일 서버가 프로젝트 API + 채팅 + RAG를 모두 담당하고 있다.
채팅은 OpenAI 호출로 느리고 프로젝트 API는 단순 CRUD로 빠르므로, 역할별 분리로 장애 격리·독립 확장이 가능하다.

```
[Next.js Frontend]
        ├── GET /api/projects  ──▶  [Portfolio API 서버 :8080]
        │                                 └── MySQL, Redis(캐시)
        └── POST /api/chat     ──▶  [Chat 서버 :8081]
                                          ├── Redis (세션·Rate Limit)
                                          ├── Qdrant (벡터 검색)
                                          └── OpenAI API
```

| 항목 | 효과 |
|------|------|
| 장애 격리 | Chat 서버 다운돼도 프로젝트 페이지 정상 동작 |
| 독립 확장 | 채팅 트래픽 증가 시 Chat 서버만 스케일 아웃 |
| 배포 독립성 | RAG 문서 수정 → Chat 서버만 재시작 |

작업 범위: `backend/` → `backend-api/` + `backend-chat/` 모듈 분리, 공통 DTO 추출, 프론트 엔드포인트 분리, docker-compose 정의.

---

## 테스트

```bash
cd backend
docker-compose up -d   # Redis 필요 (없으면 관련 테스트는 skip)
./gradlew test
```

Phase 1 Redis 동작을 로컬 Redis 대상으로 검증한다 — 세션 저장/복원과 TTL, Rate Limit 경계(10회 허용 / 11번째 차단), 세션별 독립 집계, 같은 밀리초 동시 요청 집계.

---

## 남은 작업

- [ ] 백엔드 공개 배포 (EC2/NCP + HTTPS) → Pages의 `NEXT_PUBLIC_API_URL` 설정
- [ ] **Phase 2** Portfolio API / Chat 서버 분리
- [ ] RAG 고도화: LLM 기반 검색 쿼리 재작성 (현재는 직전 질문 문자열 결합)
- [ ] Hybrid Search (BM25 키워드 + 벡터) — 고유명사 검색 정확도 개선
