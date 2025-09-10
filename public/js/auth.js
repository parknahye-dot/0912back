// 인증 관련 JavaScript

// 페이지 로드 시 로그인 상태 확인
document.addEventListener('DOMContentLoaded', function() {
    // 이미 로그인되어 있다면 메인 페이지로 이동
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = '/index.html';
    }
});

// 로그인 폼 처리
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    
    // 버튼 로딩 상태로 변경
    loginBtn.disabled = true;
    loginBtn.classList.add('loading');
    loginBtn.textContent = '로그인 중...';
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 로그인 성공
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            showToast('로그인 성공!', 'success');
            
            // 1초 후 메인 페이지로 이동
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1000);
        } else {
            // 로그인 실패
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('서버 연결에 실패했습니다.', 'error');
    } finally {
        // 버튼 상태 복원
        loginBtn.disabled = false;
        loginBtn.classList.remove('loading');
        loginBtn.textContent = '로그인';
    }
}

// 로그아웃 처리
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    showToast('로그아웃되었습니다.', 'info');
    
    setTimeout(() => {
        window.location.href = '/login.html';
    }, 1000);
}

// 로그인 상태 확인 (메인 페이지에서 사용)
function checkLoginStatus() {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// 토스트 메시지 표시
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}