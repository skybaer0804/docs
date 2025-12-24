import { createContext } from 'preact';
import { useCallback, useContext, useMemo, useRef, useState } from 'preact/hooks';
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
  const { showSuccess, showError } = useToast();
  const moveMutation = useMoveDocMutation();

  const [dragItem, setDragItem] = useState(null); // { id, type, path, name, author_id }
  const [dragOverPath, setDragOverPath] = useState(''); // target folder docs path
  const [dropSuccessPath, setDropSuccessPath] = useState(''); // target folder docs path
  const [fly, setFly] = useState(null); // { fromRect, toRect, label }

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

  const getDropTargetFromPoint = useCallback((x, y) => {
    if (typeof document === 'undefined') return null;
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const target = el.closest?.('[data-dnd-drop-path]');
    return target || null;
  }, []);

  const canDropTo = useCallback(
    (targetParentPath) => {
      if (!dragItem) return false;
      return !isInvalidDrop({
        dragPath: dragItem.path,
        dragType: dragItem.type,
        targetParentPath,
      });
    },
    [dragItem],
  );

  const beginDrag = useCallback((item, sourceEl) => {
    setDragItem(item);
    setDragOverPath('');
    setDropSuccessPath('');
    try {
      fromRectRef.current = sourceEl?.getBoundingClientRect?.() || null;
    } catch {
      fromRectRef.current = null;
    }
  }, []);

  const endDrag = useCallback(() => {
    setDragOverPath('');
    // dragItem은 drop/cancel 모두에서 정리
    setDragItem(null);
    fromRectRef.current = null;
    touchDragRef.current.active = false;
    touchDragRef.current.pointerId = null;
    touchDragRef.current.sourceEl = null;
    touchDragRef.current.lastDropEl = null;
  }, []);

  const markDragOver = useCallback((targetPath) => {
    setDragOverPath(normalizePath(targetPath || ''));
  }, []);

  const clearDragOver = useCallback(() => {
    setDragOverPath('');
  }, []);

  const runDropSuccessEffect = useCallback((targetPath) => {
    const clean = normalizePath(targetPath || '');
    setDropSuccessPath(clean);
    window.setTimeout(() => {
      setDropSuccessPath((prev) => (prev === clean ? '' : prev));
    }, 550);
  }, []);

  const performMove = useCallback(
    async ({ targetParentPath, targetEl }) => {
      if (!dragItem) return;

      const cleanTarget = normalizePath(targetParentPath);
      if (!canDropTo(cleanTarget)) return;

      const toRect = (() => {
        try {
          return targetEl?.getBoundingClientRect?.() || null;
        } catch {
          return null;
        }
      })();

      try {
        const result = await moveMutation.mutateAsync({
          id: dragItem.id,
          target_parent_path: cleanTarget,
        });

        const oldPath = normalizePath(result?.oldPath || '');
        const newPath = normalizePath(result?.newPath || '');

        // 네비게이션 보정: 현재 보고 있던 경로가 이동 영향권이면 새 경로로 이동
        const nextRoute = mapRouteAfterMove({
          currentRoute,
          oldDocsPath: oldPath,
          newDocsPath: newPath,
        });
        if (nextRoute && typeof onNavigate === 'function') {
          onNavigate(nextRoute, { force: true });
        }

        // "넣는" 애니메이션(플라이) + 타겟 펄스
        const fromRect = fromRectRef.current;
        if (fromRect && toRect) {
          setFly({
            fromRect,
            toRect,
            label: dragItem.name || '이동',
          });
          window.setTimeout(() => setFly(null), 260);
        }
        runDropSuccessEffect(cleanTarget);

        showSuccess(result?.renamed ? `이동 완료 (자동 이름 변경: ${result?.name})` : '이동되었습니다.');
      } catch (e) {
        showError(e?.message || '이동에 실패했습니다.');
      } finally {
        endDrag();
      }
    },
    [canDropTo, currentRoute, dragItem, endDrag, moveMutation, onNavigate, runDropSuccessEffect, showError, showSuccess],
  );

  const dropTo = useCallback(
    (targetParentPath, targetEl) => {
      performMove({ targetParentPath, targetEl });
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

  const activateTouchDrag = useCallback(
    ({ pointerId, sourceEl, item }) => {
      // 이미 다른 드래그 중이면 무시
      if (!item || !sourceEl) return;

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

        const dropPath = dropEl?.getAttribute?.('data-dnd-drop-path') || '';
        if (dropPath) {
          markDragOver(dropPath);
        } else {
          clearDragOver();
        }
      };

      const onEnd = (e) => {
        if (e.pointerId !== touchDragRef.current.pointerId) return;
        const dropEl = touchDragRef.current.lastDropEl;
        const dropPath = dropEl?.getAttribute?.('data-dnd-drop-path') || '';

        if (dropPath && canDropTo(dropPath)) {
          dropTo(dropPath, dropEl);
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

          activateTouchDrag({ pointerId, sourceEl, item });
        }, 320);

        touchPreRef.current.timerId = timerId;
      },
    }),
    [activateTouchDrag, cancelTouchPre, moveMutation.isPending],
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
      dragOverPath,
      dropSuccessPath,
      beginDrag,
      endDrag,
      markDragOver,
      clearDragOver,
      dropTo,
      dropToParentOfCurrent,
      canDropTo,
      isDragging: !!dragItem,
      isMoving: moveMutation.isPending,
      bindTouchDragSource,
    }),
    [
      dragItem,
      dragOverPath,
      dropSuccessPath,
      beginDrag,
      endDrag,
      markDragOver,
      clearDragOver,
      dropTo,
      dropToParentOfCurrent,
      canDropTo,
      !!dragItem,
      moveMutation.isPending,
      bindTouchDragSource,
    ],
  );

  return (
    <DndContext.Provider value={value}>
      {children}
      <DndFlyLayer fly={fly} />
    </DndContext.Provider>
  );
}


