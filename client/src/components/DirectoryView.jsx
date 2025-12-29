import { DirectoryViewContainer } from '../containers/DirectoryViewContainer';
import { useRef, useState, useEffect, useCallback } from 'preact/hooks';
import { IconDotsVertical, IconTrash, IconPencil, IconCheck, IconX } from '@tabler/icons-preact';
import { Popover } from './Popover';
import { List } from './List';
import { ListItem } from './ListItem';
import { Button } from './Button';
import { Modal } from './Modal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useDeleteDocMutation, useUpdateDocMutation } from '../hooks/useDocMutations';
import { useDnd } from '../contexts/DndContext';
import { navigationObserver } from '../observers/NavigationObserver';
import { ConfirmDialog } from './ConfirmDialog';
import './DirectoryView.scss';

/**
 * DirectoryView Presenter 컴포넌트
 * 순수 UI 렌더링만 담당 (Props 기반)
 * TDD 친화적: Props만으로 렌더링하므로 테스트 용이
 */
export function DirectoryViewPresenter({
  categorized,
  displayType,
  displayData,
  currentRoute,
  onNavigate,
  onFolderClick,
  onFileClick,
}) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const deleteDocMutation = useDeleteDocMutation();
  const updateDocMutation = useUpdateDocMutation();
  const dnd = useDnd();

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTarget, setMenuTarget] = useState(null); // { type: 'folder'|'file', id, path, author_id, label }
  const menuButtonRef = useRef(null);

  // 삭제 관련 상태
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // 이름 수정 관련 상태
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameTarget, setRenameTarget] = useState(null);

  const canManage = (authorId) => {
    if (!user?.id) return false;
    if (!authorId) return false;
    return user.id === authorId;
  };

  const bindDragSource = useCallback(
    (item) => ({
      ...(dnd.bindDragSource ? dnd.bindDragSource(item) : {}),
    }),
    [dnd],
  );

  // 이벤트 위임: 모든 directory-grid에 단일 pointerdown 리스너 추가
  useEffect(() => {
    const handlePointerDown = (e) => {
      // directory-grid 내부인지 확인
      const gridEl = e.target.closest('.directory-grid');
      if (!gridEl) return;

      // 클릭 가능한 요소(버튼, 링크 등)는 드래그 대상에서 제외
      if (e.target.closest('button, a, [role="button"]')) {
        return;
      }

      // data-dnd-item-id 속성을 가진 요소 찾기
      const target = e.target.closest('[data-dnd-item-id]');
      if (!target) {
        return;
      }

      const itemId = target.getAttribute('data-dnd-item-id');
      const itemType = target.getAttribute('data-dnd-item-type');
      const itemPath = target.getAttribute('data-dnd-item-path');
      const itemName = target.getAttribute('data-dnd-item-name');
      const itemAuthorId = target.getAttribute('data-dnd-item-author-id');

      if (!itemId) return;

      // 해당 항목의 드래그 핸들러 가져오기
      const dragHandlers = bindDragSource({
        id: itemId,
        type: itemType,
        path: itemPath,
        name: itemName,
        author_id: itemAuthorId,
      });

      if (dragHandlers.onPointerDown) {
        // 드래그 핸들러 호출 (실제 드래그가 시작되면 이벤트를 처리함)
        dragHandlers.onPointerDown(e);
      }
    };

    // document에 이벤트 리스너 추가 (이벤트 위임)
    document.addEventListener('pointerdown', handlePointerDown, { passive: false });

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [bindDragSource]);

  const bindDropTarget = (targetFolderId, targetFolderType) => {
    const normalizedTargetId = targetFolderId === 'null' ? null : targetFolderId;
    const canDrop = dnd.canDropTo(targetFolderId, targetFolderType);
    const isOver = dnd.dragOverId === normalizedTargetId;
    const isSuccess = dnd.dropSuccessId === normalizedTargetId;
    const isDragging = dnd.isDragging;

    return {
      dndClassName: `${isDragging && canDrop ? 'directory-item--droppable' : ''} ${
        isDragging && !canDrop ? 'directory-item--drop-disabled' : ''
      } ${isOver ? 'directory-item--drag-over' : ''} ${isSuccess ? 'directory-item--drop-success' : ''}`.trim(),
      dndTitle: isDragging ? (canDrop ? '여기로 이동 (드롭)' : '이 위치로는 이동할 수 없습니다') : '',
    };
  };

  const openMenu = (e, target) => {
    e.preventDefault();
    e.stopPropagation();
    menuButtonRef.current = e.currentTarget;
    setMenuTarget(target);
    setMenuOpen(true);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setMenuTarget(null);
  };

  const getParentRouteFromDocsPath = (docsPath) => {
    if (!docsPath || typeof docsPath !== 'string') return '/';
    const parts = docsPath.split('/').filter(Boolean); // ['docs', ...]
    if (parts[0] !== 'docs') return '/';
    parts.pop();
    if (parts.length <= 1) return '/';
    return `/category/${parts.slice(1).join('/')}`;
  };

  const toDocsPath = (route) => {
    if (!route || typeof route !== 'string') return '';
    if (route.startsWith('/docs/')) return route;
    if (route.startsWith('/category/')) return route.replace('/category/', '/docs/');
    return '';
  };

  const navigateToParentOfDocsPath = (docsPath) => {
    const parentRoute = getParentRouteFromDocsPath(docsPath);
    if (onNavigate) {
      onNavigate(parentRoute);
      return;
    }
    if (!onFolderClick) return;
    if (parentRoute === '/') return;
    onFolderClick(parentRoute.replace('/category/', ''));
  };

  const handleCreateNew = () => {
    let parent = '/docs';
    if (displayType === 'directory' && displayData?.path) {
      // 구독 페이지인 경우(sub_로 시작) 해당 유저 폴더에 생성 시도 (백엔드에서 권한 체크됨)
      parent = `/docs/${displayData.path}`;
    }

    if (onNavigate) {
      onNavigate(`/write?parent=${encodeURIComponent(parent)}`);
    } else {
      navigationObserver.notify(`/write?parent=${encodeURIComponent(parent)}`);
    }
  };

  const handleDeleteClick = () => {
    if (!menuTarget?.id) return;
    if (!canManage(menuTarget.author_id)) return;

    const message =
      menuTarget.type === 'folder'
        ? '정말 이 폴더를 삭제하시겠습니까? (하위 항목도 함께 삭제됩니다)'
        : '정말 이 파일을 삭제하시겠습니까?';

    setDeleteTarget(menuTarget);
    setConfirmMessage(message);
    setConfirmOpen(true);
    closeMenu();
  };

  const handleRenameClick = () => {
    if (!menuTarget?.id) return;
    if (!canManage(menuTarget.author_id)) return;

    setRenameTarget(menuTarget);
    // 파일인 경우 .md 확장자 제거하여 표시
    const initialValue = menuTarget.type === 'file' ? menuTarget.label.replace(/\.md$/, '') : menuTarget.label;
    setRenameValue(initialValue);
    setRenameOpen(true);
    closeMenu();
  };

  const handleRenameConfirm = async (e) => {
    if (e) e.preventDefault();
    if (!renameTarget?.id || !renameValue.trim()) return;

    try {
      const newName = renameTarget.type === 'file' ? `${renameValue.trim()}.md` : renameValue.trim();

      const result = await updateDocMutation.mutateAsync({
        id: renameTarget.id,
        path: renameTarget.path,
        data: { name: newName },
      });

      showSuccess('이름이 변경되었습니다.');

      // 트리 업데이트 알림
      navigationObserver.notify(renameTarget.path, {
        type: renameTarget.type === 'folder' ? 'directory' : 'file',
        action: 'update',
        file: result,
      });

      setRenameOpen(false);
      setRenameTarget(null);
    } catch (err) {
      showError(err.message || '이름 변경에 실패했습니다.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;
    if (!canManage(deleteTarget.author_id)) return;

    try {
      await deleteDocMutation.mutateAsync({ id: deleteTarget.id, path: deleteTarget.path });
      showSuccess('삭제되었습니다.');

      // 현재 경로가 삭제 대상에 포함되면 상위로 이동
      const currentDocsPath = toDocsPath(currentRoute || '');
      if (!currentDocsPath) return;

      if (deleteTarget.type === 'folder' && currentDocsPath.startsWith(deleteTarget.path)) {
        navigateToParentOfDocsPath(deleteTarget.path);
      }

      if (deleteTarget.type === 'file' && currentDocsPath === deleteTarget.path) {
        navigateToParentOfDocsPath(deleteTarget.path);
      }
    } catch (e) {
      showError(e?.message || '삭제에 실패했습니다.');
    } finally {
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  let content = null;

  // 루트 레벨: 모든 카테고리 표시
  if (displayType === 'root') {
    const categoryKeys = Object.keys(categorized || {}).filter((key) => key !== '_files' && key !== '_meta');
    const rootFiles = categorized?._files || [];
    console.log('[DirectoryView] categorized:', categorized, 'categoryKeys:', categoryKeys, 'rootFiles:', rootFiles);

    if (categoryKeys.length === 0 && rootFiles.length === 0) {
      content = (
        <div class="directory-view">
          <div class="directory-view__empty" style="text-align: center; padding: 60px 20px;">
            <p style="color: #666; margin-bottom: 20px;">문서가 없습니다.</p>
            {user && (
              <Button variant="primary" onClick={handleCreateNew}>
                첫 문서 작성하기
              </Button>
            )}
          </div>
        </div>
      );
    } else {
      content = (
        <div class="directory-view">
          {dnd.isDragging && (
            <div class="directory-view__dnd-hint" role="note">
              폴더에만 드롭할 수 있어요. 상위로 빼기는 상단의 ⬆ 드롭존에 드롭하세요.
            </div>
          )}
          <div class="directory-grid">
            {categoryKeys.map((category) => {
              const meta = categorized?.[category]?._meta;
              const folderPath = meta?.path || `/docs/${category}`;
              const showMenu = meta && canManage(meta.author_id);
              const drop = bindDropTarget(meta?.id, 'DIRECTORY');
              const { dndClassName = '', dndTitle = '' } = drop || {};
              return (
                <div
                  key={category}
                  class={`directory-item folder-item ${dndClassName}`}
                  onClick={(e) => {
                    // 드래그 중이면 클릭 무시
                    if (dnd.isDragging) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    onFolderClick(category);
                  }}
                  title={dndTitle || category}
                  {...(meta
                    ? {
                        'data-dnd-drop-id': meta.id,
                        'data-dnd-drop-type': 'DIRECTORY',
                        'data-dnd-item-id': meta.id,
                        'data-dnd-item-type': 'DIRECTORY',
                        'data-dnd-item-path': folderPath,
                        'data-dnd-item-name': meta.name || category,
                        'data-dnd-item-author-id': meta.author_id,
                      }
                    : {})}
                >
                  <span class="item-icon">📁</span>
                  <span class="item-name">{category}</span>
                  {showMenu && (
                    <button
                      class="directory-item__menu-btn"
                      onClick={(e) =>
                        openMenu(e, {
                          type: 'folder',
                          id: meta.id,
                          path: folderPath,
                          author_id: meta.author_id,
                          label: category,
                        })
                      }
                      aria-label="폴더 메뉴"
                      title="폴더 메뉴"
                    >
                      <IconDotsVertical size={18} />
                    </button>
                  )}
                </div>
              );
            })}
            {rootFiles.map((file) => {
              const showMenu = canManage(file.author_id);
              return (
                <div
                  key={file.path}
                  class={`directory-item file-item ${dnd.dragItem?.id === file.id ? 'directory-item--dragging' : ''} ${
                    dnd.isDragging ? 'directory-item--not-droppable' : ''
                  }`}
                  onClick={(e) => {
                    // 드래그 중이면 클릭 무시
                    if (dnd.isDragging) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    onFileClick(file);
                  }}
                  title={dnd.isDragging ? '파일에는 드롭할 수 없습니다 (폴더만 가능)' : file.path}
                  data-dnd-item-id={file.id}
                  data-dnd-item-type="FILE"
                  data-dnd-item-path={file.path}
                  data-dnd-item-name={file.name || file.title}
                  data-dnd-item-author-id={file.author_id}
                >
                  <span class="item-icon">{file.ext === '.template' ? '📄' : '📝'}</span>
                  <span class="item-name">{file.title}</span>
                  {showMenu && (
                    <button
                      class="directory-item__menu-btn"
                      onClick={(e) =>
                        openMenu(e, {
                          type: 'file',
                          id: file.id,
                          path: file.path,
                          author_id: file.author_id,
                          label: file.title,
                        })
                      }
                      aria-label="파일 메뉴"
                      title="파일 메뉴"
                    >
                      <IconDotsVertical size={18} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  }

  // 디렉토리 레벨: 해당 디렉토리의 하위 항목 표시
  if (displayType === 'directory' && displayData) {
    const { path, node } = displayData;
    const subdirectories = Object.keys(node).filter((key) => key !== '_files' && key !== '_meta');
    const directFiles = node._files || [];

    if (subdirectories.length === 0 && directFiles.length === 0) {
      const isSubscribedPage = path?.startsWith('sub_');
      content = (
        <div class="directory-view">
          <div class="directory-view__empty" style="text-align: center; padding: 60px 20px;">
            <p style="color: #666; margin-bottom: 20px;">
              {isSubscribedPage ? '구독한 문서가 없습니다.' : '이 폴더는 비어 있습니다.'}
            </p>
            {!isSubscribedPage && (
              <Button variant="primary" onClick={handleCreateNew}>
                이 폴더에 문서 작성하기
              </Button>
            )}
          </div>
        </div>
      );
    } else {
      content = (
        <div class="directory-view">
          {dnd.isDragging && (
            <div class="directory-view__dnd-hint" role="note">
              폴더에만 드롭할 수 있어요. 상위로 빼기는 상단의 ⬆ 드롭존에 드롭하세요.
            </div>
          )}
          <div class="directory-grid">
            {subdirectories.map((subdir) => {
              const subPath = path ? `${path}/${subdir}` : subdir;
              const meta = node?.[subdir]?._meta;
              const folderPath = meta?.path || `/docs/${subPath}`;
              const showMenu = meta && canManage(meta.author_id);
              const drop = bindDropTarget(meta?.id, 'DIRECTORY');
              const { dndClassName = '', dndTitle = '' } = drop || {};
              return (
                <div
                  key={subdir}
                  class={`directory-item folder-item ${dndClassName}`}
                  onClick={() => onFolderClick(subPath)}
                  title={dndTitle || subPath}
                  {...(meta
                    ? {
                        'data-dnd-drop-id': meta.id,
                        'data-dnd-drop-type': 'DIRECTORY',
                        'data-dnd-item-id': meta.id,
                        'data-dnd-item-type': 'DIRECTORY',
                        'data-dnd-item-path': folderPath,
                        'data-dnd-item-name': meta.name || subdir,
                        'data-dnd-item-author-id': meta.author_id,
                      }
                    : {})}
                >
                  <span class="item-icon">📁</span>
                  <span class="item-name">{subdir}</span>
                  {showMenu && (
                    <button
                      class="directory-item__menu-btn"
                      onClick={(e) =>
                        openMenu(e, {
                          type: 'folder',
                          id: meta.id,
                          path: folderPath,
                          author_id: meta.author_id,
                          label: subdir,
                        })
                      }
                      aria-label="폴더 메뉴"
                      title="폴더 메뉴"
                    >
                      <IconDotsVertical size={18} />
                    </button>
                  )}
                </div>
              );
            })}
            {directFiles.map((file) => {
              const showMenu = canManage(file.author_id);
              return (
                <div
                  key={file.path}
                  class={`directory-item file-item ${dnd.dragItem?.id === file.id ? 'directory-item--dragging' : ''} ${
                    dnd.isDragging ? 'directory-item--not-droppable' : ''
                  }`}
                  onClick={(e) => {
                    // 드래그 중이면 클릭 무시
                    if (dnd.isDragging) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    onFileClick(file);
                  }}
                  title={dnd.isDragging ? '파일에는 드롭할 수 없습니다 (폴더만 가능)' : file.path}
                  data-dnd-item-id={file.id}
                  data-dnd-item-type="FILE"
                  data-dnd-item-path={file.path}
                  data-dnd-item-name={file.name || file.title}
                  data-dnd-item-author-id={file.author_id}
                >
                  <span class="item-icon">{file.ext === '.template' ? '📄' : '📝'}</span>
                  <span class="item-name">{file.title}</span>
                  {showMenu && (
                    <button
                      class="directory-item__menu-btn"
                      onClick={(e) =>
                        openMenu(e, {
                          type: 'file',
                          id: file.id,
                          path: file.path,
                          author_id: file.author_id,
                          label: file.title,
                        })
                      }
                      aria-label="파일 메뉴"
                      title="파일 메뉴"
                    >
                      <IconDotsVertical size={18} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  }

  return (
    <>
      {content}
      <Popover isOpen={menuOpen} onClose={closeMenu} anchorRef={menuButtonRef}>
        <List>
          <ListItem icon={<IconPencil size={18} />} onClick={handleRenameClick}>
            제목 수정
          </ListItem>
          <ListItem className="list-item--danger" icon={<IconTrash size={18} />} onClick={handleDeleteClick}>
            삭제
          </ListItem>
        </List>
      </Popover>

      {/* 이름 수정 모달 */}
      <Modal
        isOpen={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="제목 수정"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRenameOpen(false)}
              disabled={updateDocMutation.isPending}
            >
              취소
            </Button>
            <Button type="submit" form="rename-form" variant="primary" loading={updateDocMutation.isPending}>
              <IconCheck size={16} />
              수정
            </Button>
          </>
        }
      >
        <form id="rename-form" onSubmit={handleRenameConfirm} className="directory-create-modal__form">
          <div className="directory-create-modal__form-group">
            <label htmlFor="renameValue">새 제목</label>
            <input
              id="renameValue"
              type="text"
              value={renameValue}
              onInput={(e) => setRenameValue(e.target.value)}
              placeholder="새 제목을 입력하세요"
              required
              autoFocus
              disabled={updateDocMutation.isPending}
              className="directory-create-modal__input"
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="삭제 확인"
        message={confirmMessage}
        confirmText="삭제"
        cancelText="취소"
        confirmVariant="danger"
        loading={deleteDocMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (deleteDocMutation.isPending) return;
          setConfirmOpen(false);
          setDeleteTarget(null);
        }}
      />
    </>
  );
}

// 기존 API 호환성을 위한 기본 export (Container 사용)
export const DirectoryView = DirectoryViewContainer;
