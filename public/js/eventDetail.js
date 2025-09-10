// 공연 상세 모달 관리

// 전역 변수로 현재 이벤트 데이터 저장
window.currentEventData = null;

/**
 * 공연 상세 모달 표시
 * @param {Object} event - 공연 데이터 객체
 */
function showEventDetail(event) {
    window.currentEventData = event;
    
    // 모달 제목 설정
    document.getElementById('eventDetailTitle').textContent = `${event.subject}`;
    
    // 모달 내용 생성
    const modalBody = document.getElementById('eventDetailBody');
    modalBody.innerHTML = createEventDetailContent(event);
    
    // 일정 목록 모달이 열려있다면 오른쪽으로 슬라이드
    const dayEventsModal = document.querySelector('#dayEventsModal .modal');
    if (dayEventsModal && document.getElementById('dayEventsModal').classList.contains('show')) {
        dayEventsModal.style.transform = 'translateX(20rem)';
    }
    
    // 모달 표시
    document.getElementById('eventDetailModal').classList.add('show');
}

/**
 * 공연 상세 모달 닫기
 */
function closeEventDetailModal() {
    document.getElementById('eventDetailModal').classList.remove('show');
    
    // 일정 목록 모달 원위치
    const dayEventsModal = document.querySelector('#dayEventsModal .modal');
    if (dayEventsModal) {
        dayEventsModal.style.transform = 'translateX(0)';
    }
    
    window.currentEventData = null;
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

    // 가격 포맷팅
    const formatPrice = (price) => {
        if (!price || price === '0' || price === '') return '정보 없음';
        // 숫자만 추출해서 콤마 추가
        const numOnly = price.replace(/[^\d]/g, '');
        if (numOnly) {
            return numOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원';
        }
        return price;
    };

    // HTML 템플릿
    return `
        <div class="event-detail-container">
            <div class="detail-section">
                <h4 class="detail-section-title">기본 정보</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>이벤트 구분</label>
                        <span class="detail-badge">${event.event_gubun || '공연'}</span>
                    </div>
                    <div class="detail-item">
                        <label>유료/무료</label>
                        <span class="detail-badge ${event.pay_gubun === '무료' ? 'free' : 'paid'}">${event.pay_gubun || '유료'}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4 class="detail-section-title">일정 정보</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>시작일</label>
                        <span>${formatDate(event.start_date)}</span>
                    </div>
                    <div class="detail-item">
                        <label>종료일</label>
                        <span>${formatDate(event.end_date)}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4 class="detail-section-title">장소 정보</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>공연장</label>
                        <span>${event.place || '정보 없음'}</span>
                    </div>
                    <div class="detail-item">
                        <label>지역</label>
                        <span>${event.event_area || '정보 없음'}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4 class="detail-section-title">주최/연락처</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>주최</label>
                        <span>${event.host || '정보 없음'}</span>
                    </div>
                    <div class="detail-item">
                        <label>연락처</label>
                        <span>${event.contact || '정보 없음'}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4 class="detail-section-title">가격 정보</h4>
                <div class="detail-item full-width">
                    <label>티켓 가격</label>
                    <span class="price-info">${formatPrice(event.pay)}</span>
                </div>
            </div>

            ${event.homepage ? `
            <div class="detail-section">
                <h4 class="detail-section-title">홈페이지</h4>
                <div class="detail-item full-width">
                    <a href="${event.homepage}" target="_blank" rel="noopener noreferrer" class="homepage-link">
                        ${event.homepage}
                        <svg width="14" height="14" fill="currentColor" style="margin-left: 0.25rem;">
                            <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                            <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
                        </svg>
                    </a>
                </div>
            </div>
            ` : ''}

            ${event.content && event.content.trim() ? `
            <div class="detail-section">
                <h4 class="detail-section-title">상세 내용</h4>
                <div class="detail-content">
                    ${event.content.replace(/\n/g, '<br>').replace(/<br><br>/g, '<br>')}
                </div>
            </div>
            ` : ''}

            <div class="detail-section">
                <h4 class="detail-section-title">관리 정보</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>이벤트 ID</label>
                        <span class="event-id">${event.event_seq}</span>
                    </div>
                    ${event.created_at ? `
                    <div class="detail-item">
                        <label>등록일</label>
                        <span>${formatDate(event.created_at.split('T')[0])}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
        
        <style>
            .event-detail-container {
                font-size: 0.875rem;
                line-height: 1.5;
            }
            
            .detail-section {
                margin-bottom: 2rem;
                padding: 1rem;
                background-color: #f8fafc;
                border-radius: 0.5rem;
                border-left: 4px solid #4f46e5;
            }
            
            .detail-section:last-child {
                margin-bottom: 0;
            }
            
            .detail-section-title {
                font-size: 1rem;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
            }
            
            .detail-section-title::before {
                content: '';
                width: 4px;
                height: 1rem;
                background-color: #4f46e5;
                margin-right: 0.5rem;
                border-radius: 2px;
            }
            
            .detail-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
            }
            
            .detail-item {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }
            
            .detail-item.full-width {
                grid-column: 1 / -1;
            }
            
            .detail-item label {
                font-weight: 500;
                color: #6b7280;
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            .detail-item span {
                color: #1f2937;
                font-weight: 400;
            }
            
            .detail-badge {
                display: inline-block;
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
                font-size: 0.75rem;
                font-weight: 500;
                background-color: #e5e7eb;
                color: #374151;
            }
            
            .detail-badge.free {
                background-color: #d1fae5;
                color: #065f46;
            }
            
            .detail-badge.paid {
                background-color: #fee2e2;
                color: #991b1b;
            }
            
            .price-info {
                font-size: 1.1rem;
                font-weight: 600;
                color: #dc2626;
            }
            
            .homepage-link {
                color: #4f46e5;
                text-decoration: none;
                display: flex;
                align-items: center;
                transition: color 0.2s;
                word-break: break-all;
            }
            
            .homepage-link:hover {
                color: #4338ca;
                text-decoration: underline;
            }
            
            .detail-content {
                background-color: white;
                padding: 1rem;
                border-radius: 0.375rem;
                border: 1px solid #e5e7eb;
                color: #374151;
                line-height: 1.6;
                white-space: pre-wrap;
            }
            
            .event-id {
                font-family: monospace;
                background-color: #f3f4f6;
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
                font-size: 0.75rem;
            }
            
            @media (max-width: 640px) {
                .detail-grid {
                    grid-template-columns: 1fr;
                }
                
                .detail-section {
                    padding: 0.75rem;
                }
                
                .event-detail-container {
                    font-size: 0.8rem;
                }
            }
        </style>
    `;
}