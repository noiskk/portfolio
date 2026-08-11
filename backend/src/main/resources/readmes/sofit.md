# SOFIT — 소상공인 성장가능성 기반 대출 플랫폼

> 소상공인의 비금융 데이터를 AI로 분석해 신용등급을 산출하고, 대출 신청부터 심사·실행까지 처리하는 디지털 포용금융 플랫폼.
> 우리FIS아카데미 최종프로젝트 **최우수상** (2026.04 ~ 2026.06, 팀 5명, 본인 역할: **Infra Leader**)

## 개요

- 서비스 구성: User 서비스(AWS, 고객 채널) / Admin 서비스(온프레미스, 은행원 내부망) 분리, AI 추론 서버(FastAPI · LightGBM · SHAP) 별도
- 인프라: AWS (VPC, 서브넷 6, ALB+WAF, CloudFront, S3, ElastiCache Redis, CodeDeploy, Secrets Manager, VPC Endpoint 5) + 학교 OpenStack 온프레미스
- DB: MySQL 8 InnoDB Cluster 3노드 + MySQL Router 사이드카
- CI/CD: Jenkins(온프레미스) → ECR → CodeDeploy Blue/Green (Canary 10% → 5분 → 100%)
- 모니터링: Prometheus · Loki · Grafana · Alertmanager (Slack 알림) / CloudWatch · CloudTrail
- 기록 문화: 의사결정 로그(ADR) 58건, 트러블슈팅 일지 30여 일치

## 담당 역할 (Infra Leader)

- AWS·OpenStack 하이브리드 인프라 전체 설계·구축
- WireGuard VPN, MySQL InnoDB Cluster 고가용성, CI/CD 파이프라인, 이중 트랙 로깅(감사/운영)
- 백엔드 기여: 마이비즈 대시보드 API, 약관 조회·동의 API, 심사결과·약정 API

## 핵심 의사결정

### 1. AWS Site-to-Site VPN 불가 → WireGuard로 연결 방향을 뒤집다
AWS의 User-API가 온프레미스 MySQL에 접근해야 했는데, 온프레미스가 학교 공인 IP 뒤 NAT 환경이라 AWS가 먼저 연결을 시도하는 표준 Site-to-Site VPN(VGW)을 쓸 수 없었다. 아웃바운드는 허용된다는 점에 착안해, WireGuard로 온프레미스가 AWS에 먼저 연결을 개시하고 PersistentKeepalive로 NAT 세션을 유지하는 방식으로 양방향 암호화 터널을 확보했다. 비용도 VGW 월 $36 대비 EC2 한 대(~$3)로 절감.

### 2. VPN 허브가 멀티 AZ 설계의 유일한 구멍 → AZ별 허브 Active-Active
EC2·ElastiCache는 2 AZ로 나눴는데 DB 경로만 단일 AZ의 VPN EC2를 지나고 있었다. AZ별 허브 2대 Active-Active로 바꾸고, 각 AZ의 인스턴스가 같은 AZ 허브로 나가게 했다. failover 자동화는 새로 만들지 않았다 — `/actuator/health`가 이미 DB 연결까지 검증하므로 허브가 죽으면 해당 AZ 인스턴스가 503을 내고 ALB가 자동 격리한다. MASQUERADE로 리턴 경로를 결정론적으로 만들어 앱의 DB_HOST는 하나로 유지, 애플리케이션 변경 0.

### 3. DB 장애를 겪고 InnoDB Cluster 3노드 — 자원은 스스로 확보
온프레미스 디스크 I/O 장애(커널이 파일시스템을 read-only로 전환)로 DB가 내려가는 일을 겪고 이중화를 도입했다. 자동 failover가 필요해 InnoDB Cluster(Group Replication)를 선택했고, 3노드인 이유는 다수결 기반이라 짝수 노드는 스플릿 브레인 위험이 있기 때문. vCPU 쿼터가 19/20으로 소진된 상태였는데, MySQL이 CPU보다 메모리(버퍼풀) 바운드라는 근거로 기존 4코어 인스턴스를 2코어로 줄여 신규 노드 자원을 자체 확보했다. Primary 강제 종료 → Secondary 자동 승격 → 서비스 연속성까지 검증 완료.

### 4. 감사 로그 — HMAC을 설계했다가 뺐다
전자금융감독규정의 접근기록 요건을 기준으로 "개인 식별 금융 데이터에 접근하는가"로 감사 대상을 선별하고, `@AuditLog` AOP로 비침투적으로 수집했다. 위변조 방지는 DB 트리거(BEFORE UPDATE/DELETE에서 SIGNAL)로 DB 레벨에서 차단했다. 처음 설계했던 HMAC 해시체인과 전용 계정 분리는 걷어냈다 — HMAC은 탐지 수단이지 방지 수단이 아니고(root가 데이터와 HMAC을 함께 재계산하면 우회), 전용 계정도 탈취되면 가짜 로그를 넣을 수 있어 위협 모델에 실제로 기여하지 않았다. "보안 장치는 많이 넣는 게 아니라 위협 모델에 실제로 대응하는 것만 남기는 게 설계."

### 5. 감사 로그는 AOP, 운영 로그는 직접 작성
AOP는 메서드 경계(진입·종료·예외)만 안다. 감사 로그는 "누가/언제/무엇을/성공여부"라 경계 정보로 충분하지만, 운영 로그는 분기·중간 상태값·실패의 비즈니스적 원인 같은 메서드 내부 맥락이 필요해 자동화하지 않았다. TraceableEntity로 로그와 DB 레코드를 같은 traceId로 묶어 추적 가능하게 했다.

### 6. 배포는 CodeDeploy Blue/Green
대출 신청은 채널계 성격이라 배포 중 사용자마다 다른 버전이 응답하는 상황(Rolling의 버전 혼재)을 허용하기 어렵다. Blue/Green은 Target Group 전환만 되돌리면 롤백이 30초. Private Subnet이라 SSH가 안 되는데 CodeDeploy Agent는 VPC Endpoint로 지시를 폴링하므로 포트를 열 필요도 없다.

### 7. 상시 NAT 제거 → VPC Endpoint + 임시 NAT
런타임 통신 대상이 전부 AWS 서비스(ECR, S3, CodeDeploy, Secrets Manager)라 이들만 VPC Endpoint로 연결하고, NAT는 패키지 설치 순간에만 라우트를 붙였다 뗐다. 상시 NAT 대비 월 ~$85 절감, 평시에는 Private Subnet에 인터넷 경로 자체가 없어 공격 표면도 축소.

## 트러블슈팅

### 터널은 붙었는데 DB만 연결이 안 됐다
WireGuard 핸드셰이크는 성공했는데 Spring이 Communications link failure로 죽었다. VPN EC2에서 eth0 IP(3306)는 실패, 터널 IP는 성공하는 것을 확인 — eth0 IP 앞으로 온 패킷이 wg0으로 들어오니 DB가 자기 것으로 수신하지 않았던 것. DB_HOST와 라우트를 터널 IP로 바꿔 클라우드 쪽 설정만으로 해결했다. 온프레미스는 다른 팀원도 쓰는 운영 DB라 건드리지 않았다.

### TCP는 뚫렸는데 애플리케이션은 1분씩 멈췄다
온프레미스 Docker Redis에서 잘 돌던 앱이 ElastiCache로 옮기자 기동 실패. nc로 포트는 열려 있는데 RedisCommandTimeoutException. 원인은 ① ElastiCache의 전송 중 암호화(TLS)에 앱이 평문으로 접속해 핸드셰이크 교착 ② 관리형 Redis가 CONFIG 명령을 차단해 keyspace notification 초기화 실패. TLS 활성화 + ConfigureRedisAction.NO_OP 빈 등록으로 해결. "nc 성공은 L4까지의 이야기지 프로토콜 레벨 통신을 보장하지 않는다."

### CORS 에러가 200 OK로 위장돼 있었다
로그인 POST가 실패하는데 응답은 200, 본문은 React의 index.html. Spring Security allowedOrigins 누락으로 403이 났는데, CloudFront의 SPA용 커스텀 오류 페이지(403 → index.html 200)가 그 403을 삼켰다. curl로 ALB(오리진)에 직접 요청해 계층을 분리하며 범위를 좁혔다. "CDN 뒤에서는 상태 코드를 그대로 믿으면 안 된다."

### 빌드는 성공했는데 배포된 코드는 구버전이었다
제거한 컬럼을 Hibernate가 계속 SELECT에 넣었다. 실행 중 이미지 다이제스트와 레지스트리를 대조해 새 이미지가 push된 적 없음을 확인 — 공통 모듈 변경 PR과 참조부 수정 PR이 쪼개져 빌드가 깨졌고, 이후 파이프라인의 조건부 스킵(changeset)이 정상 모듈의 배포까지 건너뛰었다. "빌드 성공 ≠ 배포됨. 공통 모듈 변경과 참조부 수정은 같은 PR에서 원자적으로."

## 성과

- 우리FIS아카데미 최종프로젝트 최우수상
- Primary 강제 종료 시 자동 failover 및 서비스 연속성 검증 완료
- 의사결정 로그(ADR) 58건 — 설계 번복까지 기록해 판단 근거 추적 가능
