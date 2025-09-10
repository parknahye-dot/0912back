// 인증 관리 JavaScript

// 로그인 처리
async function handleLogin(event) {
    event.preventDefault();
    
    const loginBtn = document.getElementById('loginBtn');
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showToast('아이디와 비밀번호를 입력해주세요.', 'error');
        return;
    }
    
    // 로딩 상태 표시
    loginBtn.disabled = true;
    loginBtn.textContent = '로그인 중...';
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 로그인 성공 시 토큰 저장
            if (result.token) {
                localStorage.setItem('authToken', result.token);
            }
            
            // 세션 스토리지에도 로그인 상태 저장
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('loginTime', new Date().getTime().toString());
            
            showToast('로그인 성공!', 'success');
            
            // 잠시 후 메인 페이지로 이동
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1000);
            
        } else {
            showToast(result.message || '로그인에 실패했습니다.', 'error');
        }
        
    } catch (error) {
        console.error('로그인 에러:', error);
        
        // 개발 환경에서 테스트 계정 처리
        if (username === 'admin' && password === 'admin123') {
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('loginTime', new Date().getTime().toString());
            showToast('로그인 성공! (개발 모드)', 'success');
            
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1000);
        } else {
            showToast('서버 연결 실패. 테스트 계정을 사용해보세요.', 'error');
        }
    } finally {
        // 로딩 상태 해제
        loginBtn.disabled = false;
        loginBtn.textContent = '로그인';
    }
}

// 로그인 상태 확인
function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const loginTime = sessionStorage.getItem('loginTime');
    const authToken = localStorage.getItem('authToken');
    
    if (!isLoggedIn) {
        return false;
    }
    
    // 세션 만료 확인 (24시간)
    if (loginTime) {
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - parseInt(loginTime);
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
            // 세션 만료
            logout();
            return false;
        }
    }
    
    return true;
}

// 로그아웃
function logout() {
    // 로컬 스토리지 및 세션 스토리지 정리
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('loginTime');
    
    // 로그인 페이지로 리다이렉트
    window.location.href = '/login.html';
}

// 페이지 로드 시 로그인 상태 확인
function initAuth() {
    const currentPath = window.location.pathname;
    
    // 로그인 페이지가 아닌 경우에만 로그인 상태 확인
    if (currentPath !== '/login.html') {
        if (!checkLoginStatus()) {
            // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
            window.location.href = '/login.html';
            return false;
        }
    }
    
    return true;
}

// 토스트 메시지 (로그인 페이지용)
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    } else {
        // 토스트 요소가 없으면 alert 사용
        alert(message);
    }
}

// Enter 키 처리
document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        const loginForm = document.querySelector('.login-form');
        if (loginForm) {
            handleLogin(event);
        }
    }
});

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 이미 로그인된 상태에서 로그인 페이지에 접근한 경우
    if (window.location.pathname === '/login.html' && checkLoginStatus()) {
        window.location.href = '/index.html';
    }
});