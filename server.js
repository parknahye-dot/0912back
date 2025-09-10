const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

// 정적 파일 서비스
app.use(express.static('public'));
app.use(express.json());

// 기본 라우트 - 로그인 페이지로 리다이렉트
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// 로그인 API
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // 간단한 로그인 검증 (실제로는 데이터베이스나 외부 인증 서비스 사용)
    if (username === 'admin' && password === 'admin123') {
        res.json({ success: true, message: '로그인 성공' });
    } else {
        res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 잘못되었습니다.' });
    }
});

// 이벤트 데이터 API
app.get('/api/events', (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'public/data/data.json');
        
        // 파일이 존재하지 않으면 빈 배열 반환
        if (!fs.existsSync(dataPath)) {
            return res.json([]);
        }
        
        const data = fs.readFileSync(dataPath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('데이터 로드 오류:', error);
        res.status(500).json({ error: '데이터를 불러올 수 없습니다.' });
    }
});

app.listen(PORT, () => {
    console.log(`백오피스 시스템이 http://localhost:${PORT} 에서 실행중입니다.`);
    console.log(`로그인 정보: admin / admin123`);
});