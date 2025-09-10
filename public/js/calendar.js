// 캘린더 관리 JavaScript

let currentDate = new Date();
let eventsData = [];
let currentSelectedDate = null;
let isEditMode = false;
let editingEventId = null;
let isInitialized = false;

// 공연명 → 색상 매핑 (전역, 모든 달에서 공유)
let eventColorMap = {};

// 문자열을 고유 색상으로 변환
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360; // 0~359
    return `hsl(${hue}, 70%, 60%)`;
}

// 색상의 밝기 계산 (글자색 결정용)
function getBrightness(hexOrHsl) {
    // hsl이면 단순히 밝기 계산 대신 고정값 사용
    if (hexOrHsl.startsWith("hsl")) {
        return 120; // 중간 밝기로 가정 (검정/흰 글씨 구분용)
    }
    // hex 색상을 RGB로 변환
    const r = parseInt(hexOrHsl.slice(1, 3), 16);
    const g = parseInt(hexOrHsl.slice(3, 5), 16);
    const b = parseInt(hexOrHsl.slice(5, 7), 16);
    
    // 밝기 계산 (0-255)
    return (r * 299 + g * 587 + b * 114) / 1000;
}

// 로그인 상태 확인 함수 (auth.js에서 정의된 함수 사용)
function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const loginTime = sessionStorage.getItem('loginTime');
    
    if (!isLoggedIn) {
        // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
        window.location.href = '/login.html';
        return false;
    }
    
    // 세션 만료 확인 (24시간)
    if (loginTime) {
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - parseInt(loginTime);
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
            // 세션 만료 시 로그아웃
            sessionStorage.removeItem('isLoggedIn');
            sessionStorage.removeItem('loginTime');
            localStorage.removeItem('authToken');
            window.location.href = '/login.html';
            return false;
        }
    }
    
    return true;
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM 로드 완료, 초기화 시작');
    
    // 이미 초기화되었다면 중복 실행 방지
    if (isInitialized) {
        console.log('이미 초기화됨, 스킵');
        return;
    }
    
    try {
        // 로그인 상태 확인
        if (!checkLoginStatus()) {
            console.log('로그인 상태 확인 실패');
            return;
        }
        
        console.log('로그인 상태 확인 완료');
        
        // 사이드바 초기 상태 설정
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        if (sidebar && mainContent) {
            // 화면 크기에 따라 사이드바 초기 상태 설정
            if (window.innerWidth >= 1024) {
                sidebar.classList.add('open');
                mainContent.classList.add('sidebar-open');
            }
            console.log('사이드바 초기화 완료');
        }
        
        // 오늘 날짜로 설정
        goToToday();
        console.log('캘린더 날짜 설정 완료');
        
        // 이벤트 데이터 로드 및 캘린더 렌더링
        await loadEventsData();
        
        // 초기화 완료 플래그 설정
        isInitialized = true;
        console.log('전체 초기화 완료');
        
    } catch (error) {
        console.error('초기화 중 에러 발생:', error);
        // 에러가 발생해도 기본 캘린더는 표시
        renderCalendar();
        isInitialized = true;
    }
});

// 이벤트 데이터 로드
async function loadEventsData() {
    console.log('이벤트 데이터 로드 시작');
    
    try {
        const response = await fetch('/api/events');
        console.log('API 응답 상태:', response.status);
        
        if (response.ok) {
            eventsData = await response.json();
            console.log('이벤트 데이터 로드 성공:', eventsData.length, '개 이벤트');
        } else {
            console.warn('이벤트 데이터 로드 실패 - 상태코드:', response.status);
            eventsData = [];
        }
    } catch (error) {
        console.error('API 호출 실패:', error);
        eventsData = [];
    }
    
    // 데이터 로드 완료 후 캘린더 렌더링
    renderCalendar();
    console.log('캘린더 렌더링 완료');
}

// 사이드바 토글
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (sidebar && mainContent) {
        sidebar.classList.toggle('open');
        mainContent.classList.toggle('sidebar-open');
    }
}

// 월 변경
function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar();
}

// 오늘로 이동
function goToToday() {
    const today = new Date();
    currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
    console.log('현재 날짜 설정:', currentDate);
    renderCalendar();
}

// 캘린더 렌더링
function renderCalendar() {
    console.log('캘린더 렌더링 시작');
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    
    // 현재 월 표시
    const currentMonthElement = document.getElementById('currentMonth');
    if (currentMonthElement) {
        currentMonthElement.textContent = `${year}년 ${month + 1}월`;
    }

    // 캘린더 그리드 생성
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) {
        console.error('calendarGrid 요소를 찾을 수 없습니다');
        return;
    }
    
    // 헤더 제외하고 기존 셀들 제거
    const headerCells = Array.from(calendarGrid.querySelectorAll('.calendar-header-cell'));
    calendarGrid.innerHTML = '';
    headerCells.forEach(cell => calendarGrid.appendChild(cell));

    // 첫 번째 날과 마지막 날 계산
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // 6주간의 날짜 생성
    for (let i = 0; i < 42; i++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + i);
        
        const cell = createCalendarCell(cellDate, month);
        calendarGrid.appendChild(cell);
    }
    
    console.log('캘린더 렌더링 완료');
}

// 캘린더 셀 생성
function createCalendarCell(date, currentMonth) {
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    cell.dataset.date = date.toISOString().split('T')[0];
    
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isCurrentMonth = date.getMonth() === currentMonth;
    
    if (isToday) cell.classList.add('today');
    if (!isCurrentMonth) cell.classList.add('other-month');

    const dateNumber = document.createElement('div');
    dateNumber.className = 'date-number';
    dateNumber.textContent = date.getDate();
    cell.appendChild(dateNumber);

    // 해당 날짜의 이벤트들 추가
    const dayEvents = getEventsForDate(date);
    dayEvents.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        eventElement.textContent = event.subject;
        eventElement.dataset.eventId = event.event_seq;
        eventElement.draggable = true;
        
        // 공연명별 색상 매핑 (전역 eventColorMap 사용)
        if (!eventColorMap[event.subject]) {
            eventColorMap[event.subject] = stringToColor(event.subject);
        }
        const bgColor = eventColorMap[event.subject];
        eventElement.style.backgroundColor = bgColor;

        // 글자색 자동 반전
        const brightness = getBrightness(bgColor);
        eventElement.style.color = brightness > 150 ? "#000" : "#fff";
        
        eventElement.onclick = (e) => {
            e.stopPropagation();
            showEventDetail(event);
        };
        
        // 드래그 이벤트 리스너 추가
        eventElement.addEventListener('dragstart', handleDragStart);
        eventElement.addEventListener('dragend', handleDragEnd);
        
        cell.appendChild(eventElement);
    });

    // 셀 클릭 이벤트
    cell.onclick = () => {
        if (!isCurrentMonth) {
            // 다른 달의 날짜를 클릭하면 해당 달로 이동
            currentDate = new Date(date.getFullYear(), date.getMonth(), 1);
            renderCalendar();
            return;
        }
        showDayEvents(date);
    };
    
    // 드롭 이벤트 리스너 추가
    cell.addEventListener('dragover', handleDragOver);
    cell.addEventListener('drop', handleDrop);
    cell.addEventListener('dragenter', handleDragEnter);
    cell.addEventListener('dragleave', handleDragLeave);

    return cell;
}

// 특정 날짜의 이벤트 가져오기
function getEventsForDate(date) {
    if (!Array.isArray(eventsData)) {
        return [];
    }
    
    const dateStr = date.toISOString().split('T')[0];
    return eventsData.filter(event => {
        const startDate = event.start_date;
        const endDate = event.end_date;
        return dateStr >= startDate && dateStr <= endDate;
    });
}

// 일정 목록 모달 표시
function showDayEvents(date) {
    currentSelectedDate = date;
    const events = getEventsForDate(date);
    const dateStr = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    
    const titleElement = document.getElementById('dayEventsTitle');
    if (titleElement) {
        titleElement.textContent = `${dateStr} 공연 목록`;
    }
    
    const body = document.getElementById('dayEventsBody');
    if (!body) return;
    
    body.innerHTML = '';

    if (events.length === 0) {
        body.innerHTML = '<div style="text-align: center; color: #6b7280; padding: 2rem;">등록된 공연이 없습니다.</div>';
    } else {
        events.forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.className = 'event-list-item';
            eventItem.innerHTML = `
                <div class="event-list-title">${event.subject}</div>
                <div class="event-list-info">${event.place} | ${event.event_area} | ${event.pay_gubun}</div>
            `;
            eventItem.onclick = () => showEventDetail(event);
            body.appendChild(eventItem);
        });
    }

    const modal = document.getElementById('dayEventsModal');
    if (modal) {
        modal.classList.add('show');
    }
}

// 일정 목록 모달 닫기
function closeDayEventsModal() {
    const modal = document.getElementById('dayEventsModal');
    if (modal) {
        modal.classList.remove('show');
    }
    currentSelectedDate = null;
}

// 검색 기능
function searchEvents() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    
    if (!query) {
        showToast('검색어를 입력하세요.', 'warning');
        hideSearchResults();
        return;
    }

    const results = eventsData.filter(event => 
        event.subject.toLowerCase().includes(query.toLowerCase()) ||
        event.place.toLowerCase().includes(query.toLowerCase()) ||
        event.event_area.toLowerCase().includes(query.toLowerCase())
    );

    showSearchResults(results, query);
}

// 검색 결과 표시
function showSearchResults(results, query) {
    const container = document.getElementById('searchResults');
    if (!container) return;
    
    container.innerHTML = '';

    if (results.length === 0) {
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #6b7280;">검색 결과가 없습니다.</div>';
    } else {
        results.forEach(event => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <div class="search-result-title">${event.subject}</div>
                <div class="search-result-info">${event.start_date} | ${event.place} | ${event.event_area}</div>
            `;
            item.onclick = () => {
                goToEventDate(event);
                hideSearchResults();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) searchInput.value = '';
            };
            container.appendChild(item);
        });
    }

    container.classList.add('show');
}

// 검색 결과 숨기기
function hideSearchResults() {
    const container = document.getElementById('searchResults');
    if (container) {
        container.classList.remove('show');
    }
}

// 이벤트 날짜로 이동
function goToEventDate(event) {
    const eventDate = new Date(event.start_date);
    currentDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), 1);
    renderCalendar();
    
    // 잠시 후 모달 표시
    setTimeout(() => {
        showEventDetail(event);
    }, 100);
}

// 검색 입력 엔터 처리
function handleSearchKeypress(event) {
    if (event.key === 'Enter') {
        searchEvents();
    }
}

// 생성 모달 표시
function showCreateModal() {
    isEditMode = false;
    editingEventId = null;
    
    const titleElement = document.getElementById('createEventTitle');
    if (titleElement) {
        titleElement.textContent = '새 공연 등록';
    }
    
    // 폼 초기화
    const form = document.getElementById('eventForm');
    if (form) {
        form.reset();
    }
    
    // 기본값 설정
    if (currentSelectedDate) {
        const dateStr = currentSelectedDate.toISOString().split('T')[0];
        const startDateInput = document.getElementById('start_date');
        const endDateInput = document.getElementById('end_date');
        
        if (startDateInput) startDateInput.value = dateStr;
        if (endDateInput) endDateInput.value = dateStr;
    }
    
    const modal = document.getElementById('createEventModal');
    if (modal) {
        modal.classList.add('show');
    }
}

// 생성 모달 닫기
function closeCreateModal() {
    const modal = document.getElementById('createEventModal');
    if (modal) {
        modal.classList.remove('show');
    }
    isEditMode = false;
    editingEventId = null;
}

// 이벤트 저장
async function saveEvent() {
    const form = document.getElementById('eventForm');
    if (!form) return;
    
    const formData = new FormData(form);
    
    // 필수 필드 검증
    const subject = formData.get('subject');
    const startDate = formData.get('start_date');
    const endDate = formData.get('end_date');
    const place = formData.get('place');
    
    if (!subject || !startDate || !endDate || !place) {
        showToast('필수 항목을 모두 입력해주세요.', 'error');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showToast('종료일은 시작일보다 늦어야 합니다.', 'error');
        return;
    }
    
    const eventData = {
        event_gubun: formData.get('event_gubun') || '공연',
        subject: subject,
        start_date: startDate,
        end_date: endDate,
        place: place,
        event_area: formData.get('event_area') || '',
        host: formData.get('host') || '',
        contact: formData.get('contact') || '',
        pay_gubun: formData.get('pay_gubun') || '유료',
        pay: formData.get('pay') || '',
        homepage: formData.get('homepage') || '',
        content: formData.get('content') || ''
    };
    
    try {
        let response;
        if (isEditMode && editingEventId) {
            // 수정
            response = await fetch(`/api/events/${editingEventId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });
        } else {
            // 생성
            response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast(isEditMode ? '공연이 수정되었습니다.' : '공연이 등록되었습니다.', 'success');
            closeCreateModal();
            await loadEventsData(); // 데이터 새로고침
        } else {
            showToast(result.message || '저장에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('저장 에러:', error);
        showToast('서버 연결에 실패했습니다.', 'error');
    }
}

// 현재 이벤트 삭제
async
