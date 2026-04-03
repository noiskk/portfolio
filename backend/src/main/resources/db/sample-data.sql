-- 샘플 프로젝트 데이터 (직접 수정해서 사용)
-- psql -U postgres -d portfolio -f sample-data.sql

INSERT INTO projects (title, description, period, github_url, demo_url)
VALUES (
    '포트폴리오 챗봇 사이트',
    'Spring AI와 RAG를 활용한 AI 챗봇 포트폴리오 사이트. 방문자가 자연어로 질문하면 관련 프로젝트/경험 정보를 답변합니다.',
    '2024.04',
    'https://github.com/username/portfolio',
    null
);

-- 기술 스택
INSERT INTO project_tech_stack (project_id, tech)
VALUES (1, 'Spring Boot'), (1, 'Spring AI'), (1, 'PGVector'), (1, 'Next.js'), (1, 'OpenAI API');

-- 주요 기능
INSERT INTO project_highlights (project_id, highlight)
VALUES
    (1, 'RAG 파이프라인 구현 (임베딩 → 벡터 검색 → LLM 답변)'),
    (1, 'PGVector를 활용한 코사인 유사도 기반 문서 검색'),
    (1, 'Next.js + Tailwind CSS 실시간 채팅 UI');
