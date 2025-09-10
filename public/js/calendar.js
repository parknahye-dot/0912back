// 캘린더 관리 JavaScript

let currentDate = new Date();
let eventsData = [];
let currentSelectedDate = null;
let isEditMode = false;
let editingEventId = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 로그인 상태 확인
    if (!checkLoginStatus()) return;
    
    // 초기화
    goToToday();
    loadEventsData();
    
    // 사이드바 초기 상태 설정
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    // 화면 크기에 따라 사이드바 초기 상태 설정
    if (window.innerWidth >= 1024) {
        sidebar.classList.add('open');
        mainContent.classList.add('sidebar-open');
    }
});

// 이벤트 데이터 로드
async function loadEventsData() {
    try {
        console.log('데이터를 로드합니다...');
        const response = await fetch('/api/events');
        
        if (response.ok) {
            eventsData = await response.json();
            console.log('로드된 이벤트 수:', eventsData.length);
            console.log('이벤트 데이터:', eventsData);
        } else {
            console.warn('이벤트 데이터 응답 오류:', response.status);
            eventsData = [];
        }
    } catch (error) {
        console.error('데이터 로드 실패:', error);
        eventsData = [];
        showToast('데이터를 불러올 수 없습니다.', 'error');
    }
    
    renderCalendar();
}

// 사이드바 토글
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    sidebar.classList.toggle('open');
    mainContent.classList.toggle('sidebar-open');
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
    renderCalendar();
}

// 캘린더 렌더링
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    
    // 현재 월 표시
    document.getElementById('currentMonth').textContent = 
        `${year}년 ${month + 1}월`;

    // 캘린더 그리드 생성
    const calendarGrid = document.getElementById('calendarGrid');
    
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
    
    document.getElementById('dayEventsTitle').textContent = `${dateStr} 공연 목록`;
    
    const body = document.getElementById('dayEventsBody');
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

    document.getElementById('dayEventsModal').classList.add('show');
}

// 일정 목록 모달 닫기
function closeDayEventsModal() {
    document.getElementById('dayEventsModal').classList.remove('show');
    currentSelectedDate = null;
}

// 검색 기능
function searchEvents() {
    const query = document.getElementById('searchInput').value.trim();
    
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
                document.getElementById('searchInput').value = '';
            };
            container.appendChild(item);
        });
    }

    container.classList.add('show');
}

// 검색 결과 숨기기
function hideSearchResults() {
    document.getElementById('searchResults').classList.remove('show');
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
    document.getElementById('createEventTitle').textContent = '새 공연 등록';
    
    // 폼 초기화
    const form = document.getElementById('eventForm');
    form.reset();
    
    // 기본값 설정
    if (currentSelectedDate) {
        const dateStr = currentSelectedDate.toISOString().split('T')[0];
        document.getElementById('start_date').value = dateStr;
        document.getElementById('end_date').value = dateStr;
    }
    
    document.getElementById('createEventModal').classList.add('show');
}

// 생성 모달 닫기
function closeCreateModal() {
    document.getElementById('createEventModal').classList.remove('show');
    isEditMode = false;
    editingEventId = null;
}

// 이벤트 저장
async function saveEvent() {
    const form = document.getElementById('eventForm');
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
            loadEventsData(); // 데이터 새로고침
        } else {
            showToast(result.message || '저장에 실패했습니다.', 'error');
        }
    } catch (error) {
        showToast('서버 연결에 실패했습니다.', 'error');
    }
}

// 현재 이벤트 삭제
async function deleteCurrentEvent() {
    if (!window.currentEventData) {
        showToast('삭제할 이벤트가 선택되지 않았습니다.', 'error');
        return;
    }
    
    if (!confirm('정말로 이 공연을 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/events/${window.currentEventData.event_seq}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('공연이 삭제되었습니다.', 'success');
            closeEventDetailModal();
            closeDayEventsModal();
            loadEventsData(); // 데이터 새로고침
        } else {
            showToast('삭제에 실패했습니다.', 'error');
        }
    } catch (error) {
        showToast('서버 연결에 실패했습니다.', 'error');
    }
}

// 토스트 메시지
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 윈도우 리사이즈 처리
window.addEventListener('resize', function() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (window.innerWidth < 1024) {
        sidebar.classList.remove('open');
        mainContent.classList.remove('sidebar-open');
    }
});

// 새로고침 시 오늘로 이동
window.addEventListener('beforeunload', function() {
    sessionStorage.setItem('shouldGoToToday', 'true');
});

window.addEventListener('load', function() {
    if (sessionStorage.getItem('shouldGoToToday')) {
        sessionStorage.removeItem('shouldGoToToday');
        goToToday();
    }
});