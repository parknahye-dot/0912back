const express = require('express');
const path = require('path');
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
        const fs = require('fs');
        const data = fs.readFileSync(path.join(__dirname, 'public/data/data.json'), 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: '데이터를 불러올 수 없습니다.' });
    }
});

// 이벤트 저장 API
app.post('/api/events', (req, res) => {
    try {
        const fs = require('fs');
        const dataPath = path.join(__dirname, 'public/data/data.json');
        
        let events = [];
        if (fs.existsSync(dataPath)) {
            const data = fs.readFileSync(dataPath, 'utf8');
            events = JSON.parse(data);
        }
        
        const newEvent = {
            event_seq: String(Date.now()),
            ...req.body,
            created_at: new Date().toISOString()
        };
        
        events.push(newEvent);
        fs.writeFileSync(dataPath, JSON.stringify(events, null, 2));
        
        res.json({ success: true, event: newEvent });
    } catch (error) {
        res.status(500).json({ success: false, message: '이벤트 저장 실패' });
    }
});

// 이벤트 업데이트 API
app.put('/api/events/:id', (req, res) => {
    try {
        const fs = require('fs');
        const dataPath = path.join(__dirname, 'public/data/data.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        let events = JSON.parse(data);
        
        const eventIndex = events.findIndex(e => e.event_seq === req.params.id);
        if (eventIndex === -1) {
            return res.status(404).json({ success: false, message: '이벤트를 찾을 수 없습니다.' });
        }
        
        events[eventIndex] = { ...events[eventIndex], ...req.body, updated_at: new Date().toISOString() };
        fs.writeFileSync(dataPath, JSON.stringify(events, null, 2));
        
        res.json({ success: true, event: events[eventIndex] });
    } catch (error) {
        res.status(500).json({ success: false, message: '이벤트 업데이트 실패' });
    }
});

// 이벤트 삭제 API
app.delete('/api/events/:id', (req, res) => {
    try {
        const fs = require('fs');
        const dataPath = path.join(__dirname, 'public/data/data.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        let events = JSON.parse(data);
        
        const filteredEvents = events.filter(e => e.event_seq !== req.params.id);
        fs.writeFileSync(dataPath, JSON.stringify(filteredEvents, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: '이벤트 삭제 실패' });
    }
});

app.listen(PORT, () => {
    console.log(`백오피스 시스템이 http://localhost:${PORT} 에서 실행중입니다.`);
    console.log(`로그인 정보: admin / admin123`);
});