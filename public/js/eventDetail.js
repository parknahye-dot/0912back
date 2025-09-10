// eventDetail.js - 공연 상세 모달 관리

let currentEventData = null;

/**
 * 공연 상세 모달 표시
 * @param {Object} event - 공연 데이터 객체
 */
function showEventDetailModal(event) {
    currentEventData = event;
    
    // 모달 제목 설정 (공연명 모달)
    document.getElementById('eventDetailTitle').textContent = `${event.subject} 상세정보`;
    
    // 모달 내용 생성
    const modalBody = document.getElementById('eventDetailBody');
    modalBody.innerHTML = createEventDetailContent(event);
    
    // 모달 표시
    document.getElementById('eventDetailModal').classList.add('show');
}

/**
 * 공연 상세 모달 내용만 닫기
 */
function closeEventDetailModalOnly() {
    document.getElementById('eventDetailModal').classList.remove('show');
    currentEventData = null;
}

/**
 * 공연 상세 정보 HTML 생성
 * @param {Object} event - 공연 데이터 객체
 * @returns {string} HTML 문자열
 */
function createEventDetailContent(event) {
    // 날짜 포맷팅
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        const weekday = weekdays[date.getDay()];
        return `${year}.${month}.${day} (${weekday})`;
    };

    // 가격