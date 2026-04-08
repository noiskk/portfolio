# 💳 MSA 기반 카드 결제 승인 시스템

> POS → VAN → FDS → 카드사 → 은행으로 이어지는 실제 카드 결제 승인 흐름을 MSA로 구현한 프로젝트

---

## 📖 개요

POS 단말기에서 시작된 결제 요청이 VAN → FDS(이상거래탐지) → 카드사(결제처리) → 은행(출금)까지 이어지는 **카드 결제 승인 흐름**을 MSA(Microservice Architecture)로 구현한 프로젝트

각 서비스는 독립된 Spring Boot 애플리케이션으로 동작하며, POS-VAN 구간은 `ISO 8583` 프로토콜 기반 TCP 소켓 통신, 이후 구간은 `Spring Cloud OpenFeign`을 통해 서비스 간 HTTP 통신을 수행한다.

---

## 🏗️ 시스템 아키텍처

<img alt="MSA 카드 결제 승인 시퀀스 다이어그램" src="/images/payment-sequence-diagram.svg" />

---

## 📦 서비스 구성

| 서비스 | 포트 | 역할 | 레포지토리 |
|---|---|---|---|
| **pos-client** | `6060` | POS 단말기 시뮬레이터 (웹 UI, ISO 8583 메시지 생성, TCP 소켓 통신) | [pos-client](https://github.com/fisa-msa-project/pos-client) |
| **VAN-service** | `7070` | 결제 게이트웨이 (ISO 8583 수신, 유효성 검증, 카드사 라우팅) | [VAN-Service](https://github.com/fisa-msa-project/VAN-Service) |
| **card-fds-service** | `9090` | FDS 이상거래 탐지 (중복결제 차단, 카드 상태 검증) | [card-service](https://github.com/fisa-msa-project/card-service) |
| **card-payment-service** | `9091` | 카드 결제 승인 처리 (체크/신용 분기, 한도 검사, 승인 이력 저장) | [card-service](https://github.com/fisa-msa-project/card-service) |
| **bank-service** | `8080` | 계좌 및 출금 관리 (잔액 조회, 출금 처리, 동시성 제어) | [bank-service](https://github.com/fisa-msa-project/bank-service) |

---

## 💡 결제 승인 흐름

### 1. pos-client (POS 단말기)
- 웹 UI에서 카드번호, 결제금액, 가맹점ID를 입력받아 결제 요청
- ISO 8583 표준 전문(MTI 0200)을 생성하여 VAN 서버로 TCP 소켓 전송
- VAN으로부터 응답 전문(MTI 0210)을 수신하여 승인/거절 결과 표시

### 2. VAN-service (결제 게이트웨이)
- POS로부터 ISO 8583 전문을 TCP 소켓(7777)으로 수신
- 결제 요청 유효성 검증 (금액 0원 이하 반려)
- 요청 데이터를 카드사 규격으로 변환하여 FDS 서비스로 전달

### 3. card-fds-service (이상거래 탐지)
- **Rule 1**: 동일 카드로 3초 이내 재요청 시 중복결제로 판단하여 차단
- **Rule 2**: 카드 상태가 ACTIVE가 아닌 경우 (정지, 분실, 해지) 결제 차단
- 검증 통과 시 결제 처리 서비스로 요청 이관

### 4. card-payment-service (결제 승인 처리)
- **체크카드(DEBIT)**: 1회 결제 한도 검사 → bank-service 출금 API 호출
- **신용카드(CREDIT)**: 1회 결제 한도 검사 → 신용 잔여 한도 검증 → 사용액 누적
- 모든 결제 결과를 승인 이력(Authorization)으로 기록

### 5. bank-service (계좌 출금)
- 카드 번호로 연동 계좌를 조회하고 잔액 확인
- 비관적 락(Pessimistic Lock)을 적용하여 동시성 제어
- 출금 처리 및 트랜잭션 기록

---

## 🔧 기술 스택

| 구분 | 기술 |
|---|---|
| Language | Java 17 |
| Framework | Spring Boot 3.2.0 |
| POS-VAN 통신 | ISO 8583 (j8583) / TCP Socket |
| 서비스 간 통신 | Spring Cloud OpenFeign (Spring Cloud 2023.0.0) |
| 템플릿 엔진 | Thymeleaf (pos-client) |
| ORM | Spring Data JPA |
| Database | MySQL |
| API 문서 | Springdoc OpenAPI (Swagger) |
| Build | Gradle |
