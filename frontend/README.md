# Bible Viewer Frontend

React + TypeScript 기반 성경 뷰어입니다. 백엔드 FastAPI 서버의 장/절 API를 사용합니다.

## Scripts

```bash
npm install
npm start
npm test -- --watchAll=false
npm run build
```

기본 API 주소는 `http://127.0.0.1:8000`입니다. 다른 주소를 쓰려면 `.env`에 값을 지정합니다.

```bash
REACT_APP_API_BASE_URL=http://127.0.0.1:8000
```
