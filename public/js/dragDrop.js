// 드래그 앤 드롭 기능

let draggedEventId = null;
let draggedEventData = null;

// 드래그 시작
function handleDragStart(e) {
    draggedEventId = e.target.dataset.eventId;
    draggedEventData = eventsData.find(event => event.event_seq === draggedEventId);
    
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    
    // 드래그 이미지 설정
    const dragImage = e.target.cloneNode(true);
    dragImage.style.opacity = '0.8';
    dragImage.style.transform = 'rotate(3deg)';
    e.dataTransfer.setDragImage(dragImage, 0, 0);
}

// 드래그 종료
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    
    // 모든 드래그 오버 효과 제거
    document.querySelectorAll('.calendar-cell.drag-over').forEach(cell => {
        cell.classList.remove('drag-over');
    });
    
    draggedEventId = null;
    draggedEventData = null;
}

// 드래그 오버
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

// 드래그 엔터
function handleDragEnter(e) {
    e.preventDefault();
    if (e.target.classList.contains('calendar-cell')) {
        e.target.classList.add('drag-over');
    }
}

// 드래그 리브
function handleDragLeave(e) {
    if (e.target.classList.contains('calendar-cell') && !e.target.contains(e.relatedTarget)) {
        e.target.classList.remove('drag-over');
    }
}

// 드롭 처리
async function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const targetCell = e.target.closest('.calendar-cell');
    if (!targetCell || !draggedEventId || !draggedEventData) {
        return;
    }
    
    targetCell.classList.remove('drag-over');
    
    const targetDate = targetCell.dataset.date;
    if (!targetDate) {
        return;
    }
    
    // 현재 이벤트 날짜와 동일한 경우 처리하지 않음
    if (targetDate === draggedEventData.start_date && targetDate === draggedEventData.end_date) {
        return;
    }
    
    // 날짜 차이 계산
    const originalStart = new Date(draggedEventData.start_date);
    const originalEnd = new Date(draggedEventData.end_date);
    const duration = originalEnd.getTime() - originalStart.getTime();
    
    const newStartDate = new Date(targetDate);
    const newEndDate = new Date(newStartDate.getTime() + duration);
    
    // 확인 대화상자
    const originalStartStr = formatDateForDisplay(originalStart);
    const originalEndStr = formatDateForDisplay(originalEnd);
    const newStartStr = formatDateForDisplay(newStartDate);
    const newEndStr = formatDateForDisplay(newEndDate);
    
    let message = `'${draggedEventData.subject}' 공연을 이동하시겠습니까?\n\n`;
    message += `기존: ${originalStartStr}`;
    if (originalStartStr !== originalEndStr) {
        message += ` ~ ${originalEndStr}`;
    }
    message += `\n새 날짜: ${newStartStr}`;
    if (newStartStr !== newEndStr) {
        message += ` ~ ${newEndStr}`;
    }
    
    if (!confirm(message)) {
        return;
    }
    
    try {
        // 서버에 업데이트 요청
        const updatedEventData = {
            ...draggedEventData,
            start_date: formatDateForAPI(newStartDate),
            end_date: formatDateForAPI(newEndDate)
        };
        
        const response = await fetch(`/api/events/${draggedEventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedEventData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('공연 일정이 변경되었습니다.', 'success');
            loadEventsData(); // 데이터 새로고침
        } else {
            showToast('일정 변경에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('드롭 처리 오류:', error);
        showToast('서버 연결에 실패했습니다.', 'error');
    }
}

// 날짜 포맷팅 (표시용)
function formatDateForDisplay(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return `${year}.${month}.${day}(${weekday})`;
}

// 날짜 포맷팅 (API용)
function formatDateForAPI(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 모바일 터치 지원을 위한 추가 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    // 터치 디바이스 감지
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouchDevice) {
        let touchStartTime = 0;
        let longPressTimer = null;
        let isDragging = false;
        let touchStartElement = null;
        
        document.addEventListener('touchstart', function(e) {
            if (e.target.classList.contains('event-item')) {
                touchStartTime = Date.now();
                touchStartElement = e.target;
                
                // 롱 프레스 감지를 위한 타이머
                longPressTimer = setTimeout(() => {
                    isDragging = true;
                    e.target.classList.add('dragging');
                    // 햅틱 피드백 (지원되는 경우)
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                }, 500); // 500ms 롱 프레스
            }
        });
        
        document.addEventListener('touchmove', function(e) {
            if (isDragging) {
                e.preventDefault();
                
                // 터치 위치의 요소 찾기
                const touch = e.touches[0];
                const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                const targetCell = elementBelow ? elementBelow.closest('.calendar-cell') : null;
                
                // 드래그 오버 효과
                document.querySelectorAll('.calendar-cell.drag-over').forEach(cell => {
                    cell.classList.remove('drag-over');
                });
                
                if (targetCell && targetCell !== touchStartElement.closest('.calendar-cell')) {
                    targetCell.classList.add('drag-over');
                }
            }
        });
        
        document.addEventListener('touchend', function(e) {
            clearTimeout(longPressTimer);
            
            if (isDragging) {
                e.preventDefault();
                
                const touch = e.changedTouches[0];
                const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                const targetCell = elementBelow ? elementBelow.closest('.calendar-cell') : null;
                
                if (targetCell && touchStartElement) {
                    // 드롭 이벤트 시뮬레이션
                    draggedEventId = touchStartElement.dataset.eventId;
                    draggedEventData = eventsData.find(event => event.event_seq === draggedEventId);
                    
                    const mockDropEvent = {
                        preventDefault: () => {},
                        stopPropagation: () => {},
                        target: targetCell
                    };
                    
                    handleDrop(mockDropEvent);
                }
                
                // 클래스 정리
                document.querySelectorAll('.calendar-cell.drag-over').forEach(cell => {
                    cell.classList.remove('drag-over');
                });
                
                if (touchStartElement) {
                    touchStartElement.classList.remove('dragging');
                }
            }
            
            isDragging = false;
            touchStartElement = null;
        });
        
        document.addEventListener('touchcancel', function(e) {
            clearTimeout(longPressTimer);
            isDragging = false;
            touchStartElement = null;
            
            document.querySelectorAll('.calendar-cell.drag-over').forEach(cell => {
                cell.classList.remove('drag-over');
            });
            
            document.querySelectorAll('.event-item.dragging').forEach(item => {
                item.classList.remove('dragging');
            });
        });
    }
});