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

// 이벤트 저장 API
app.post('/api/events', (req, res) => {
    try {
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
        
        // 디렉토리가 없으면 생성
        const dataDir = path.dirname(dataPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(dataPath, JSON.stringify(events, null, 2));
        
        res.json({ success: true, event: newEvent });
    } catch (error) {
        console.error('이벤트 저장 오류:', error);
        res.status(500).json({ success: false, message: '이벤트 저장 실패' });
    }
});

// 이벤트 업데이트 API
app.put('/api/events/:id', (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'public/data/data.json');
        
        if (!fs.existsSync(dataPath)) {
            return res.status(404).json({ success: false, message: '데이터 파일을 찾을 수 없습니다.' });
        }
        
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
        console.error('이벤트 업데이트 오류:', error);
        res.status(500).json({ success: false, message: '이벤트 업데이트 실패' });
    }
});

// 이벤트 삭제 API
app.delete('/api/events/:id', (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'public/data/data.json');
        
        if (!fs.existsSync(dataPath)) {
            return res.status(404).json({ success: false, message: '데이터 파일을 찾을 수 없습니다.' });
        }
        
        const data = fs.readFileSync(dataPath, 'utf8');
        let events = JSON.parse(data);
        
        const filteredEvents = events.filter(e => e.event_seq !== req.params.id);
        
        if (filteredEvents.length === events.length) {
            return res.status(404).json({ success: false, message: '삭제할 이벤트를 찾을 수 없습니다.' });
        }
        
        fs.writeFileSync(dataPath, JSON.stringify(filteredEvents, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        console.error('이벤트 삭제 오류:', error);
        res.status(500).json({ success: false, message: '이벤트 삭제 실패' });
    }
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
    console.error('서버 오류:', err.stack);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
});

// 404 핸들러
app.use((req, res) => {
    res.status(404).json({ error: '페이지를 찾을 수 없습니다.' });
});

app.listen(PORT, () => {
    console.log(`\n🚀 백오피스 시스템이 실행중입니다!`);
    console.log(`📱 접속 URL: http://localhost:${PORT}`);
    console.log(`🔐 로그인 정보: admin / admin123\n`);
    
    // 데이터 폴더 체크
    const dataDir = path.join(__dirname, 'public/data');
    if (!fs.existsSync(dataDir)) {
        console.log('📁 데이터 폴더를 생성합니다...');
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // 샘플 데이터 체크
    const dataPath = path.join(dataDir, 'data.json');
    if (!fs.existsSync(dataPath)) {
        console.log('📄 샘플 데이터 파일을 생성합니다...');
        const sampleData = [
            {
                "event_seq": "8540",
                "event_gubun": "공연",
                "subject": "마이크 스턴 밴드 내한공연 - 대구",
                "start_date": "2025-09-21",
                "end_date": "2025-09-21",
                "place": "베리어스재즈클럽 대구",
                "event_area": "수성구",
                "host": "",
                "contact": "010-6399-4156",
                "pay_gubun": "유료",
                "pay": "55,000",
                "homepage": "https://tickets.interpark.com/goods/25012219",
                "content": "Mike Stern Band in Daegue<br>마이크 스턴 밴드 내한공연 - 대구<br><br>2025. 9. 21. SUN 5PM<br>대구 베리어스 재즈클럽<br><br>예매처 : NOL 티켓(인터파크)<br>티켓가 : 전석 55,000원<br>"
            }
        ];
        fs.writeFileSync(dataPath, JSON.stringify(sampleData, null, 2));
    }
});