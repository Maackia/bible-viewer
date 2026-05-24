# Bible Viewer

React + TypeScript 기반의 성경 뷰어 웹 애플리케이션입니다. FastAPI 백엔드와 React 프론트엔드로 구성되어, 구약 39권과 신약 27권을 빠르고 직관적으로 검색하고 읽을 수 있습니다.

## 주요 기능

- 📖 **구약 & 신약 전체 지원** — 66권 전부를 약어 및 한글명으로 검색 가능
- 🔄 **번역본 전환** — 개역개정 / 개역한글 두 번역본 실시간 교체
- 🔍 **본문 검색** — 절 번호 또는 키워드로 장 내 텍스트 필터링
- ⚙️ **읽기 설정** — 글자 크기 조절 (16~24px), 촘촘하게 보기 모드
- 📱 **반응형 레이아웃** — 좌측 책 목록 + 우측 본문 읽기 패널

## 프로젝트 구조

```
bible-viewer/
├── backend/              # FastAPI 서버
│   ├── main.py           # API 엔드포인트 (장 목록, 절 본문)
│   ├── requirements.txt  # Python 의존성
│   └── data/             # 성경 원문 데이터 (.txt)
│       ├── 개역개정_통합.txt
│       └── 개역한글_통합.txt
├── frontend/             # React + TypeScript 클라이언트
│   ├── src/App.tsx       # 메인 뷰어 컴포넌트
│   ├── package.json      # Node.js 의존성
│   └── ...
└── README.md
```

## 빠른 시작

### 1. 백엔드 실행

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

서버가 `http://127.0.0.1:8000`에서 실행됩니다.

> **인코딩 참고:** 성경 데이터 파일은 CP949 인코딩으로 저장되어 있습니다.

### 2. 프론트엔드 실행

```bash
cd frontend
npm install
npm start
```

브라우저에서 `http://localhost:3000`을 열어 Bible Viewer를 사용할 수 있습니다.

> **API 주소 변경:** `.env` 파일에 `REACT_APP_API_BASE_URL`을 설정하세요.
> ```
> REACT_APP_API_BASE_URL=http://127.0.0.1:8000
> ```

## API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET`  | `/bible/{version}/{book}/chapters` | 특정 권의 장 목록 반환 |
| `GET`  | `/bible/{version}/{book}/{chapter}` | 특정 장의 절 본문 반환 |

### 파라미터

- **version**: `개역개정` 또는 `개역한글`
- **book**: 성경 책 이름 (예: `창세기`, `요한복음`)
- **chapter**: 장 번호 (정수)

### 응답 예시

```json
{
  "version": "개역개정",
  "book": "요한복음",
  "chapter": 1,
  "verses": [
    { "verse": 1, "text": "태초에 말씀이 계시니라 이 말씀 ..." },
    { "verse": 2, "text": "이 말씀이 하나님과 함께 계셨으니 ..." }
  ]
}
```

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 19, TypeScript, React Bootstrap 5 |
| 백엔드 | FastAPI, Uvicorn |
| 데이터 | CP949 인코딩 성경 원문 텍스트 파일 |

## 라이선스

이 프로젝트는 개인적으로 개발된 성경 뷰어입니다.
