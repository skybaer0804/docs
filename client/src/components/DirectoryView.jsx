import { DirectoryViewContainer } from '../containers/DirectoryViewContainer';
import { useRef, useState, useEffect, useCallback } from 'preact/hooks';
import { IconDotsVertical, IconTrash } from '@tabler/icons-preact';
import { Popover } from './Popover';
import { List } from './List';
import { ListItem } from './ListItem';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useDeleteDocMutation } from '../hooks/useDocMutations';
import { useDnd } from '../contexts/DndContext';
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
    const dnd = useDnd();

    const [menuOpen, setMenuOpen] = useState(false);
    const [menuTarget, setMenuTarget] = useState(null); // { type: 'folder'|'file', id, path, author_id, label }
    const menuButtonRef = useRef(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);

    const canManage = (authorId) => {
        if (!user?.id) return false;
        if (!authorId) return false;
        return user.id === authorId;
    };

    const bindDragSource = useCallback((item) => ({
        ...(dnd.bindDragSource ? dnd.bindDragSource(item) : {}),
    }), [dnd]);
    
    
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
                    <div style="text-align: center; padding: 40px;">
                        <p style="color: #666;">문서가 없습니다.</p>
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
                                    {...(meta ? {
                                        'data-dnd-drop-id': meta.id,
                                        'data-dnd-drop-type': 'DIRECTORY',
                                        'data-dnd-item-id': meta.id,
                                        'data-dnd-item-type': 'DIRECTORY',
                                        'data-dnd-item-path': folderPath,
                                        'data-dnd-item-name': meta.name || category,
                                        'data-dnd-item-author-id': meta.author_id,
                                    } : {})}
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
                        {rootFiles.map((file) => (
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
                            </div>
                        ))}
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
                                {...(meta ? {
                                    'data-dnd-drop-id': meta.id,
                                    'data-dnd-drop-type': 'DIRECTORY',
                                    'data-dnd-item-id': meta.id,
                                    'data-dnd-item-type': 'DIRECTORY',
                                    'data-dnd-item-path': folderPath,
                                    'data-dnd-item-name': meta.name || subdir,
                                    'data-dnd-item-author-id': meta.author_id,
                                } : {})}
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
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <>
            {content}
            <Popover isOpen={menuOpen} onClose={closeMenu} anchorRef={menuButtonRef}>
                <List>
                    <ListItem className="list-item--danger" icon={<IconTrash size={18} />} onClick={handleDeleteClick}>
                        삭제
                    </ListItem>
                </List>
            </Popover>
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
