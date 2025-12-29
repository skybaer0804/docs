import { createContext } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useMoveDocMutation } from '../hooks/useDocMutations';
import { DndFlyLayer } from '../components/DndFlyLayer';
import { getParentDocsPath, isInvalidDrop, mapRouteAfterMove, normalizePath, routeToDocsPath } from '../utils/dndUtils';

const DndContext = createContext(null);

export function useDnd() {
  const ctx = useContext(DndContext);
  if (!ctx) throw new Error('useDnd must be used within DndProvider');
  return ctx;
}

/**
 * DnD 상태/로직 캡슐화 Provider
 * - prop 전달 최소화: DirectoryView/DirectoryTree/Breadcrumb 등에서 공용으로 사용
 */
export function DndProvider({ children, currentRoute, onNavigate }) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const moveMutation = useMoveDocMutation();

  const [dragItem, setDragItem] = useState(null); // { id, type, name, author_id }
  const dragItemRef = useRef(null); // stale closure 방지용
  const [dragOverId, setDragOverId] = useState(null); // target folder id
  const [dropSuccessId, setDropSuccessId] = useState(null); // target folder id

  const fromRectRef = useRef(null);
  const touchDragRef = useRef({
    active: false,
    pointerId: null,
    sourceEl: null,
    lastDropEl: null,
  });
  const touchPreRef = useRef({
    timerId: null,
    pointerId: null,
    startX: 0,
    startY: 0,
    moved: false,
    sourceEl: null,
    item: null,
    cleanup: null,
  });

  const mousePreRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    sourceEl: null,
    item: null,
    cleanup: null,
  });

  const suppressClickRef = useRef({
    until: 0,
    sourceEl: null,
  });

  const cursorRestoreRef = useRef({
    cursor: '',
    userSelect: '',
  });

  useEffect(() => {
    // 드래그 직후 발생하는 클릭(네비게이션)을 억제해서 "드래그하려다 클릭" 버그를 방지
    const handleClickCapture = (e) => {
      const now = Date.now();
      const until = suppressClickRef.current.until || 0;
      const sourceEl = suppressClickRef.current.sourceEl;
      if (!sourceEl) return;
      if (now > until) return;
      if (!sourceEl.contains?.(e.target)) return;

      e.preventDefault();
      e.stopPropagation();

      suppressClickRef.current.until = 0;
      suppressClickRef.current.sourceEl = null;
    };

    document.addEventListener('click', handleClickCapture, true);
    return () => document.removeEventListener('click', handleClickCapture, true);
  }, []);

  const getDropTargetFromPoint = useCallback((x, y) => {
    if (typeof document === 'undefined') return null;
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const target = el.closest?.('[data-dnd-drop-id]');
    return target || null;
  }, []);

  const canDropTo = useCallback(
    (targetParentId, targetType, currentDragItem = dragItem) => {
      const item = currentDragItem;
      if (!item) return false;

      // 타인 페이지 노드는 드래그/드롭 대상에서 제외 (author_id 체크)
      if (user && item.author_id && item.author_id !== user.id) return false;

      // 'null' 문자열을 실제 null로 취급 (루트 폴더)
      const targetId = targetParentId === 'null' ? null : targetParentId;

      // DIRECTORY 타입만 드롭 가능
      if (targetType !== 'DIRECTORY') return false;
      // 자기 자신으로는 드롭 불가
      if (item.id === targetId) return false;
      // 자기 자신의 하위로는 드롭 불가 (DIRECTORY인 경우)
      if (item.type === 'DIRECTORY' && targetId === item.id) return false;
      return true;
    },
    [dragItem],
  );

  const beginDrag = useCallback((item, sourceEl) => {
    setDragItem(item);
    dragItemRef.current = item;
    setDragOverId(null);
    setDropSuccessId(null);
    try {
      fromRectRef.current = sourceEl?.getBoundingClientRect?.() || null;
    } catch {
      fromRectRef.current = null;
    }
  }, []);

  const endDrag = useCallback(() => {
    setDragOverId(null);
    // dragItem은 drop/cancel 모두에서 정리
    setDragItem(null);
    dragItemRef.current = null;
    fromRectRef.current = null;
    touchDragRef.current.active = false;
    touchDragRef.current.pointerId = null;
    touchDragRef.current.sourceEl = null;
    touchDragRef.current.lastDropEl = null;

    // 커서/선택 복원
    try {
      if (typeof document !== 'undefined') {
        document.body.style.cursor = cursorRestoreRef.current.cursor || '';
        document.body.style.userSelect = cursorRestoreRef.current.userSelect || '';
        // important 제거
        document.body.style.removeProperty('cursor');
      }
    } catch {
      // noop
    }
  }, []);

  const markDragOver = useCallback((targetId) => {
    // 'null' 문자열은 실제 null로 변환하여 저장 (루트 폴더 액티브 상태 대응)
    const finalId = targetId === 'null' ? null : targetId;
    setDragOverId(finalId);
  }, []);

  const clearDragOver = useCallback(() => {
    setDragOverId(null);
  }, []);

  const runDropSuccessEffect = useCallback((targetId) => {
    const finalId = targetId === 'null' ? null : targetId;
    setDropSuccessId(finalId);
    window.setTimeout(() => {
      setDropSuccessId((prev) => (prev === finalId ? null : prev));
    }, 550);
  }, []);

  const performMove = useCallback(
    async ({ targetParentId }) => {
      // state 대신 ref 사용 가능성 고려 (performMove는 비동기 시점에 호출됨)
      const currentItem = dragItemRef.current;
      if (!currentItem) return;

      // 'null' 문자열을 실제 null로 변환 (루트 폴더)
      const finalTargetId = targetParentId === 'null' ? null : targetParentId;

      // 클라이언트 로그: 드래그앤드롭 시작

      try {
        const result = await moveMutation.mutateAsync({
          id: currentItem.id,
          target_parent_id: finalTargetId,
        });

        // 클라이언트 로그: 드래그앤드롭 성공

        // 플라이 애니메이션
        runDropSuccessEffect(targetParentId);

        // 현재 경로 자동 매핑 (이동 시 URL 연동)
        const nextRoute = mapRouteAfterMove({
          currentRoute,
          oldDocsPath: currentItem.path,
          newDocsPath: result.path,
        });
        if (nextRoute && onNavigate) {
          onNavigate(nextRoute, { replace: true });
        }

        showSuccess('파일 위치가 변경되었습니다.');
      } catch (e) {
        // 클라이언트 로그: 드래그앤드롭 실패
        console.error('[DnD Client] 드래그앤드롭 실패:', {
          itemId: currentItem.id,
          itemName: currentItem.name,
          targetParentId: finalTargetId,
          error: e?.message,
          timestamp: new Date().toISOString(),
        });
        showError(e?.message || '이동에 실패했습니다.');
      } finally {
        endDrag();
      }
    },
    [currentRoute, onNavigate, endDrag, moveMutation, runDropSuccessEffect, showError, showSuccess],
  );

  const dropTo = useCallback(
    (targetParentId) => {
      performMove({ targetParentId });
    },
    [performMove],
  );

  const cancelTouchPre = useCallback(() => {
    const pre = touchPreRef.current;
    if (pre.timerId) {
      window.clearTimeout(pre.timerId);
    }
    if (typeof pre.cleanup === 'function') {
      pre.cleanup();
    }
    touchPreRef.current = {
      timerId: null,
      pointerId: null,
      startX: 0,
      startY: 0,
      moved: false,
      sourceEl: null,
      item: null,
      cleanup: null,
    };
  }, []);

  const cancelMousePre = useCallback(() => {
    const pre = mousePreRef.current;
    if (typeof pre.cleanup === 'function') {
      pre.cleanup();
    }
    mousePreRef.current = {
      pointerId: null,
      startX: 0,
      startY: 0,
      sourceEl: null,
      item: null,
      cleanup: null,
    };
  }, []);

  const activatePointerDrag = useCallback(
    ({ pointerId, sourceEl, item }) => {
      // 이미 다른 드래그 중이면 무시
      if (!item || !sourceEl) {
        return;
      }

      // 커서/선택 상태 저장 + 드래그 모드 진입
      try {
        cursorRestoreRef.current = {
          cursor: document.body.style.cursor || '',
          userSelect: document.body.style.userSelect || '',
        };
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
        // 모든 요소에 커서 적용
        document.body.style.setProperty('cursor', 'grabbing', 'important');
      } catch {
        // noop
      }

      beginDrag(item, sourceEl);
      touchDragRef.current.active = true;
      touchDragRef.current.pointerId = pointerId;
      touchDragRef.current.sourceEl = sourceEl;
      touchDragRef.current.lastDropEl = null;

      try {
        sourceEl.setPointerCapture?.(pointerId);
      } catch {
        // noop
      }

      const onMove = (e) => {
        if (!touchDragRef.current.active) return;
        if (e.pointerId !== touchDragRef.current.pointerId) return;
        // 드래그 중 스크롤 방지
        e.preventDefault();

        const dropEl = getDropTargetFromPoint(e.clientX, e.clientY);
        touchDragRef.current.lastDropEl = dropEl;

        const dropId = dropEl?.getAttribute?.('data-dnd-drop-id');
        const dropType = dropEl?.getAttribute?.('data-dnd-drop-type');

        if (dropId) {
          // stale closure 방지를 위해 dragItemRef.current 사용
          const canDrop = canDropTo(dropId, dropType, dragItemRef.current);
          if (canDrop) {
            markDragOver(dropId);
          } else {
            clearDragOver();
          }
        } else {
          clearDragOver();
        }
      };

      const onEnd = (e) => {
        if (e.pointerId !== touchDragRef.current.pointerId) return;
        const dropEl = touchDragRef.current.lastDropEl;
        const dropId = dropEl?.getAttribute?.('data-dnd-drop-id');
        const dropType = dropEl?.getAttribute?.('data-dnd-drop-type');

        // 드래그 후 클릭 억제 (특히 onClick 네비게이션이 걸린 리스트에서 중요)
        suppressClickRef.current.until = Date.now() + 450;
        suppressClickRef.current.sourceEl = sourceEl;

        if (dropId && canDropTo(dropId, dropType, dragItemRef.current)) {
          dropTo(dropId);
        } else {
          endDrag();
        }

        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onEnd);
        window.removeEventListener('pointercancel', onEnd);
      };

      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onEnd, { passive: true });
      window.addEventListener('pointercancel', onEnd, { passive: true });
    },
    [beginDrag, canDropTo, clearDragOver, dropTo, endDrag, getDropTargetFromPoint, markDragOver],
  );

  // 모바일/터치 폴백: 롱프레스(기본 320ms)로 드래그 시작
  const bindTouchDragSource = useCallback(
    (item) => ({
      onPointerDown: (e) => {
        if (!e || (e.pointerType !== 'touch' && e.pointerType !== 'pen')) return;
        if (!item) return;
        if (moveMutation.isPending) return;

        // 기존 대기 상태 정리
        cancelTouchPre();

        const sourceEl = e.currentTarget;
        const pointerId = e.pointerId;
        const startX = e.clientX;
        const startY = e.clientY;

        const onPreMove = (ev) => {
          if (ev.pointerId !== pointerId) return;
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          if (Math.hypot(dx, dy) > 10) {
            touchPreRef.current.moved = true;
            cancelTouchPre();
          }
        };
        const onPreEnd = (ev) => {
          if (ev.pointerId !== pointerId) return;
          cancelTouchPre();
        };

        window.addEventListener('pointermove', onPreMove, { passive: true });
        window.addEventListener('pointerup', onPreEnd, { passive: true });
        window.addEventListener('pointercancel', onPreEnd, { passive: true });

        const cleanup = () => {
          window.removeEventListener('pointermove', onPreMove);
          window.removeEventListener('pointerup', onPreEnd);
          window.removeEventListener('pointercancel', onPreEnd);
        };

        touchPreRef.current = {
          timerId: null,
          pointerId,
          startX,
          startY,
          moved: false,
          sourceEl,
          item,
          cleanup,
        };

        // 롱프레스 후 드래그 활성화
        const timerId = window.setTimeout(() => {
          // 이동해서 취소된 경우 방지
          if (touchPreRef.current.pointerId !== pointerId) return;
          if (touchPreRef.current.moved) return;

          cleanup();
          touchPreRef.current.cleanup = null;

          activatePointerDrag({ pointerId, sourceEl, item });
        }, 320);

        touchPreRef.current.timerId = timerId;
      },
    }),
    [activatePointerDrag, cancelTouchPre, moveMutation.isPending],
  );

  // 데스크톱(마우스) 폴백: "살짝 이동하면" 드래그 시작 (HTML5 Drag가 막힌 환경에서도 동작)
  const bindMouseDragSource = useCallback(
    (item) => ({
      onPointerDown: (e) => {
        if (!e || e.pointerType !== 'mouse') {
          return;
        }
        if (!item) {
          return;
        }
        if (moveMutation.isPending) {
          return;
        }
        if (typeof e.button === 'number' && e.button !== 0) {
          return; // 좌클릭만
        }

        cancelMousePre();

        // 이벤트 위임을 사용하는 경우 currentTarget이 없을 수 있으므로 target을 사용
        const sourceEl = e.currentTarget || e.target;
        const pointerId = e.pointerId;
        const startX = e.clientX;
        const startY = e.clientY;

        const onPreMove = (ev) => {
          if (ev.pointerId !== pointerId) return;
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          const distance = Math.hypot(dx, dy);
          if (distance > 4) {
            cancelMousePre();
            // native 텍스트 드래그/선택 방지
            if (ev.cancelable) ev.preventDefault();
            activatePointerDrag({ pointerId, sourceEl, item });
          }
        };
        const onPreEnd = (ev) => {
          if (ev.pointerId !== pointerId) return;
          cancelMousePre();
        };

        window.addEventListener('pointermove', onPreMove, { passive: false });
        window.addEventListener('pointerup', onPreEnd, { passive: true });
        window.addEventListener('pointercancel', onPreEnd, { passive: true });

        const cleanup = () => {
          window.removeEventListener('pointermove', onPreMove);
          window.removeEventListener('pointerup', onPreEnd);
          window.removeEventListener('pointercancel', onPreEnd);
        };

        mousePreRef.current = {
          pointerId,
          startX,
          startY,
          sourceEl,
          item,
          cleanup,
        };
      },
    }),
    [activatePointerDrag, cancelMousePre, moveMutation.isPending],
  );

  const bindDragSource = useCallback(
    (item) => {
      if (!item) {
        return {};
      }
      const touchHandlers = bindTouchDragSource ? bindTouchDragSource(item) : {};
      const mouseHandlers = bindMouseDragSource ? bindMouseDragSource(item) : {};
      const handlers = {
        ...touchHandlers,
        ...mouseHandlers,
      };
      return handlers;
    },
    [bindMouseDragSource, bindTouchDragSource],
  );

  const dropToParentOfCurrent = useCallback(
    (targetEl) => {
      const currentDocs = routeToDocsPath(currentRoute);
      if (!currentDocs) return;
      const parent = getParentDocsPath(currentDocs);
      if (!parent) return;
      dropTo(parent, targetEl);
    },
    [currentRoute, dropTo],
  );

  const value = useMemo(
    () => ({
      dragItem,
      dragOverId,
      dropSuccessId,
      beginDrag,
      endDrag,
      markDragOver,
      clearDragOver,
      dropTo,
      canDropTo,
      isDragging: !!dragItem,
      isMoving: moveMutation.isPending,
      bindTouchDragSource,
      bindDragSource,
      dragItemRef, // Ref 노출 추가
    }),
    [
      dragItem,
      dragOverId,
      dropSuccessId,
      beginDrag,
      endDrag,
      markDragOver,
      clearDragOver,
      dropTo,
      canDropTo,
      moveMutation.isPending,
      bindTouchDragSource,
      bindDragSource,
    ],
  );

  return (
    <DndContext.Provider value={value}>
      {children}
      {/* 플라이 레이어 제거 - 문서 드래그시 info 표시 안함 */}
    </DndContext.Provider>
  );
}
