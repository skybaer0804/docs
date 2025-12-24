import { DirectoryViewContainer } from '../containers/DirectoryViewContainer';
import { useRef, useState } from 'preact/hooks';
import { IconDotsVertical, IconTrash } from '@tabler/icons-preact';
import { Popover } from './Popover';
import { List } from './List';
import { ListItem } from './ListItem';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useDeleteDocMutation } from '../hooks/useDocMutations';
import { useDnd } from '../contexts/DndContext';
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

    const canManage = (authorId) => {
        if (!user?.id) return false;
        if (!authorId) return false;
        return user.id === authorId;
    };

    const bindDragSource = (item) => ({
        draggable: true,
        onDragStart: (e) => {
            e.stopPropagation();
            e.dataTransfer.effectAllowed = 'move';
            // Firefox 호환을 위해 setData 필요
            try {
                e.dataTransfer.setData('text/plain', item.path || '');
            } catch {
                // noop
            }
            dnd.beginDrag(item, e.currentTarget);
        },
        onDragEnd: () => dnd.endDrag(),
        ...(dnd.bindTouchDragSource ? dnd.bindTouchDragSource(item) : {}),
    });

    const bindDropTarget = (targetFolderDocsPath) => {
        const canDrop = dnd.canDropTo(targetFolderDocsPath);
        const isOver = dnd.dragOverPath === targetFolderDocsPath;
        const isSuccess = dnd.dropSuccessPath === targetFolderDocsPath;
        const isDragging = dnd.isDragging;

        return {
            onDragEnter: (e) => {
                if (!canDrop) return;
                e.preventDefault();
                dnd.markDragOver(targetFolderDocsPath);
            },
            onDragOver: (e) => {
                if (canDrop) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    dnd.markDragOver(targetFolderDocsPath);
                    return;
                }
                // 드롭 불가 타겟에서도 커서/힌트를 위해 dropEffect를 명시
                if (isDragging) {
                    try {
                        e.dataTransfer.dropEffect = 'none';
                    } catch {
                        // noop
                    }
                }
            },
            onDragLeave: () => {
                if (isOver) dnd.clearDragOver();
            },
            onDrop: (e) => {
                if (!canDrop) return;
                e.preventDefault();
                e.stopPropagation();
                dnd.dropTo(targetFolderDocsPath, e.currentTarget);
            },
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

    const handleDelete = async () => {
        if (!menuTarget?.id) return;
        if (!canManage(menuTarget.author_id)) return;

        const confirmMessage =
            menuTarget.type === 'folder'
                ? '정말 이 폴더를 삭제하시겠습니까? (하위 항목도 함께 삭제됩니다)'
                : '정말 이 파일을 삭제하시겠습니까?';

        if (!confirm(confirmMessage)) return;

        try {
            await deleteDocMutation.mutateAsync({ id: menuTarget.id, path: menuTarget.path });
            showSuccess('삭제되었습니다.');

            // 현재 경로가 삭제 대상에 포함되면 상위로 이동
            const currentDocsPath = toDocsPath(currentRoute || '');
            if (!currentDocsPath) return;

            if (menuTarget.type === 'folder' && currentDocsPath.startsWith(menuTarget.path)) {
                navigateToParentOfDocsPath(menuTarget.path);
            }

            if (menuTarget.type === 'file' && currentDocsPath === menuTarget.path) {
                navigateToParentOfDocsPath(menuTarget.path);
            }
        } catch (e) {
            showError(e?.message || '삭제에 실패했습니다.');
        } finally {
            closeMenu();
        }
    };

    let content = null;

    // 루트 레벨: 모든 카테고리 표시
    if (displayType === 'root') {
        const categoryKeys = Object.keys(categorized).filter((key) => key !== '_files' && key !== '_meta');
        if (categoryKeys.length === 0) {
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
                            const drop = bindDropTarget(folderPath);
                            const { dndClassName = '', dndTitle = '', ...dropHandlers } = drop || {};
                            return (
                                <div
                                    key={category}
                                    class={`directory-item folder-item ${dndClassName}`}
                                    onClick={() => onFolderClick(category)}
                                    title={dndTitle || category}
                                    data-dnd-drop-path={folderPath}
                                    {...dropHandlers}
                                    {...(meta
                                        ? bindDragSource({
                                              id: meta.id,
                                              type: 'DIRECTORY',
                                              path: folderPath,
                                              name: meta.name || category,
                                              author_id: meta.author_id,
                                          })
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
                        const drop = bindDropTarget(folderPath);
                        const { dndClassName = '', dndTitle = '', ...dropHandlers } = drop || {};
                        return (
                            <div
                                key={subdir}
                                class={`directory-item folder-item ${dndClassName}`}
                                onClick={() => onFolderClick(subPath)}
                                title={dndTitle || subPath}
                                data-dnd-drop-path={folderPath}
                                {...dropHandlers}
                                {...(meta
                                    ? bindDragSource({
                                          id: meta.id,
                                          type: 'DIRECTORY',
                                          path: folderPath,
                                          name: meta.name || subdir,
                                          author_id: meta.author_id,
                                      })
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
                    {directFiles.map((file) => (
                        <div
                            key={file.path}
                            class={`directory-item file-item ${dnd.dragItem?.path === file.path ? 'directory-item--dragging' : ''} ${
                                dnd.isDragging ? 'directory-item--not-droppable' : ''
                            }`}
                            onClick={() => onFileClick(file)}
                            title={dnd.isDragging ? '파일에는 드롭할 수 없습니다 (폴더만 가능)' : file.path}
                            onDragOver={(e) => {
                                if (!dnd.isDragging) return;
                                try {
                                    e.dataTransfer.dropEffect = 'none';
                                } catch {
                                    // noop
                                }
                            }}
                            {...bindDragSource({
                                id: file.id,
                                type: 'FILE',
                                path: file.path,
                                name: file.name || file.title,
                                author_id: file.author_id,
                            })}
                        >
                            <span class="item-icon">{file.ext === '.template' ? '📄' : '📝'}</span>
                            <span class="item-name">{file.title}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            {content}
            <Popover isOpen={menuOpen} onClose={closeMenu} anchorRef={menuButtonRef}>
                <List>
                    <ListItem icon={<IconTrash size={18} />} onClick={handleDelete}>
                        삭제
                    </ListItem>
                </List>
            </Popover>
        </>
    );
}

// 기존 API 호환성을 위한 기본 export (Container 사용)
export const DirectoryView = DirectoryViewContainer;
