import { DirectoryViewContainer } from '../containers/DirectoryViewContainer';
import { useRef, useState, useEffect, useCallback } from 'preact/hooks';
import {
  IconDots,
  IconTrash,
  IconPencil,
  IconCheck,
  IconFilePlus,
  IconFolderPlus,
  IconEdit,
  IconDownload,
  IconEye,
} from '@tabler/icons-preact';
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
 */
export function DirectoryViewPresenter({
  categorized,
  displayType,
  displayData,
  currentRoute,
  onNavigate,
  onFolderClick,
  onFileClick,
  onCreateDocument,
  onCreateFolder,
  onEditDocument,
  onDownloadDocument,
}) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const deleteDocMutation = useDeleteDocMutation();
  const updateDocMutation = useUpdateDocMutation();
  const dnd = useDnd();

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTarget, setMenuTarget] = useState(null);
  const menuButtonRef = useRef(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameTarget, setRenameTarget] = useState(null);

  const canManage = (authorId) => user?.id === authorId;

  const bindDragSource = useCallback(
    (item) => ({
      ...(dnd.bindDragSource ? dnd.bindDragSource(item) : {}),
    }),
    [dnd],
  );

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

  const handleRenameConfirm = async (e) => {
    if (e) e.preventDefault();
    if (!renameTarget?.id || !renameValue.trim()) return;

    try {
      const newName = renameTarget.type === 'file' ? `${renameValue.trim()}.md` : renameValue.trim();
      const result = await updateDocMutation.mutateAsync({
        id: renameTarget.id,
        data: { name: newName },
      });

      showSuccess('이름이 변경되었습니다.');
      navigationObserver.notify(result.route || `/doc/${result.id}`, {
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

    try {
      await deleteDocMutation.mutateAsync({ id: deleteTarget.id });
      showSuccess('삭제되었습니다.');

      if (currentRoute?.includes(deleteTarget.id)) {
        onNavigate('/');
      }
    } catch (e) {
      showError(e?.message || '삭제에 실패했습니다.');
    } finally {
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  const renderItem = (name, nodeOrFile, isFolder) => {
    const meta = isFolder ? nodeOrFile._meta : nodeOrFile;
    const id = meta.id;
    const authorId = meta.author_id;
    const showMenu = canManage(authorId);

    const drop = isFolder ? bindDropTarget(id, 'DIRECTORY') : { dndClassName: '' };
    const dragHandlers = bindDragSource({
      id,
      type: isFolder ? 'DIRECTORY' : 'FILE',
      name: isFolder ? name : meta.title,
      author_id: authorId,
    });

    return (
      <div
        key={id}
        class={`directory-item ${isFolder ? 'folder-item' : 'file-item'} ${drop.dndClassName || ''}`}
        onClick={() => {
          if (dnd.isDragging) return;
          isFolder ? onFolderClick(id) : onFileClick(nodeOrFile);
        }}
        data-dnd-item-id={id}
        data-dnd-item-type={isFolder ? 'DIRECTORY' : 'FILE'}
        data-dnd-drop-id={isFolder ? id : undefined}
        data-dnd-drop-type={isFolder ? 'DIRECTORY' : undefined}
        {...dragHandlers}
      >
        <span class="item-icon">{isFolder ? '📁' : meta.ext === '.template' ? '📄' : '📝'}</span>
        <div class="item-info">
          <span class="item-name">{isFolder ? name : meta.title}</span>
          {!isFolder && (
            <div class="item-stats">
              <span class="item-stats__item" title="조회수">
                <IconEye size={12} /> {meta.view_count || 0}
              </span>
              <span class="item-stats__item" title="다운로드">
                <IconDownload size={12} /> {meta.download_count || 0}
              </span>
            </div>
          )}
        </div>
        {showMenu && (
          <button
            class="directory-item__menu-btn"
            onClick={(e) =>
              openMenu(e, {
                type: isFolder ? 'folder' : 'file',
                id,
                author_id: authorId,
                label: isFolder ? name : meta.title,
                raw: nodeOrFile,
              })
            }
          >
            <IconDots size={18} />
          </button>
        )}
      </div>
    );
  };

  let content = null;

  if (displayType === 'root') {
    const categoryKeys = Object.keys(categorized || {}).filter((key) => key !== '_files' && key !== '_meta');
    const rootFiles = categorized?._files || [];

    content = (
      <div class="directory-view">
        <div class="directory-grid">
          {categoryKeys.map((key) => renderItem(key, categorized[key], true))}
          {rootFiles.map((file) => renderItem(file.title, file, false))}
        </div>
      </div>
    );
  } else if (displayType === 'directory' && displayData) {
    const { node } = displayData;
    const subDirs = Object.keys(node).filter((key) => key !== '_files' && key !== '_meta');
    const directFiles = node._files || [];

    content = (
      <div class="directory-view">
        <div class="directory-grid">
          {subDirs.map((key) => renderItem(key, node[key], true))}
          {directFiles.map((file) => renderItem(file.title, file, false))}
        </div>
      </div>
    );
  }

  return (
    <>
      {content}
      <Popover isOpen={menuOpen} onClose={closeMenu} anchorRef={menuButtonRef}>
        <List>
          {menuTarget?.type === 'folder' ? (
            <>
              <ListItem
                icon={<IconFilePlus size={18} />}
                onClick={() => {
                  onCreateDocument(menuTarget.id);
                  closeMenu();
                }}
              >
                하위문서 생성
              </ListItem>
              <ListItem
                icon={<IconFolderPlus size={18} />}
                onClick={() => {
                  onCreateFolder(menuTarget.id);
                  closeMenu();
                }}
              >
                하위폴더 생성
              </ListItem>
            </>
          ) : (
            <>
              <ListItem
                icon={<IconEdit size={18} />}
                onClick={() => {
                  onEditDocument(menuTarget.id);
                  closeMenu();
                }}
              >
                편집
              </ListItem>
              <ListItem
                icon={<IconDownload size={18} />}
                onClick={() => {
                  onDownloadDocument(menuTarget.raw);
                  closeMenu();
                }}
              >
                다운로드
              </ListItem>
            </>
          )}
          <ListItem
            icon={<IconPencil size={18} />}
            onClick={() => {
              setRenameTarget(menuTarget);
              setRenameValue(menuTarget.label);
              setRenameOpen(true);
              closeMenu();
            }}
          >
            제목 수정
          </ListItem>
          <ListItem
            className="list-item--danger"
            icon={<IconTrash size={18} />}
            onClick={() => {
              setDeleteTarget(menuTarget);
              setConfirmOpen(true);
              closeMenu();
            }}
          >
            삭제
          </ListItem>
        </List>
      </Popover>

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
            <Button
              type="submit"
              form="directory-rename-form-view"
              variant="primary"
              loading={updateDocMutation.isPending}
            >
              <IconCheck size={16} />
              수정
            </Button>
          </>
        }
      >
        <div className="directory-create-modal">
          <form id="directory-rename-form-view" onSubmit={handleRenameConfirm} className="directory-create-modal__form">
            <div className="directory-create-modal__form-group">
              <label htmlFor="renameValueView">새 이름</label>
              <input
                id="renameValueView"
                type="text"
                value={renameValue}
                onInput={(e) => setRenameValue(e.target.value)}
                required
                autoFocus
                className="directory-create-modal__input"
              />
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="삭제 확인"
        message="정말 삭제하시겠습니까?"
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}

export const DirectoryView = DirectoryViewContainer;
