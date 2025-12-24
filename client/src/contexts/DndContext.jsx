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
      isMoving: moveMutation.isPending,
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
      moveMutation.isPending,
    ],
  );

  return (
    <DndContext.Provider value={value}>
      {children}
      <DndFlyLayer fly={fly} />
    </DndContext.Provider>
  );
}


