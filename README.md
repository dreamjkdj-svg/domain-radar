# DomainRadar 🚀

AI가 매일 수익 가능성 높은 만료 도메인을 추천해주는 서비스.

## 프로젝트 구조

```
domain-radar/
├── index.html                    # 프론트엔드
├── netlify/
│   └── functions/
│       └── analyze.js            # Netlify Function (Anthropic API 호출)
├── netlify.toml                  # Netlify 설정
└── README.md
```

---

## 배포 방법 (GitHub + Netlify, 10분)

### 1단계 — GitHub 레포지토리 생성
github.com/new 에서 새 레포 생성 (예: domain-radar)

### 2단계 — 코드 업로드

```bash
git init
git add .
git commit -m "init: DomainRadar"
git remote add origin https://github.com/YOUR_NAME/domain-radar.git
git push -u origin main
```

### 3단계 — Netlify 연결

1. app.netlify.com 접속 → GitHub 로그인
2. "Add new site" → "Import an existing project"
3. GitHub 선택 → domain-radar 레포 선택
4. Build settings:
   - Build command: 비워두기
   - Publish directory: . (점 하나)
5. "Deploy site" 클릭

### 4단계 — 환경변수 설정 (필수!)

Netlify 대시보드 → Site configuration → Environment variables → Add a variable

Key: ANTHROPIC_API_KEY
Value: sk-ant-api03-...

저장 후 Deploys → Trigger deploy 클릭.

### 5단계 — 서브도메인 확인

자동 생성 주소: https://your-site-name.netlify.app
도메인 변경: Site configuration → Domain management → Edit site name

---

## 제휴 링크 설정

index.html 내 PARTNERS 배열에서 URL 교체:

```js
const PARTNERS = [
  { id:'gabia',     url:'https://www.gabia.com/?utm_source=YOUR_ID' },
  { id:'namecheap', url:'https://namecheap.pxf.io/YOUR_LINK' },
  { id:'hostinger', url:'https://hostinger.com/?AFFILIATE=YOUR_ID' },
];
```

---

## 로컬 개발

```bash
npm install -g netlify-cli
netlify dev
```

.env 파일:
```
ANTHROPIC_API_KEY=sk-ant-xxx
```

브라우저: http://localhost:8888
