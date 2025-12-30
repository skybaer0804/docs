import { DirectoryTreeContainer } from '../containers/DirectoryTreeContainer';
import { useState, useRef } from 'preact/hooks';
import {
  IconPlus,
  IconLoader2,
  IconUserPlus,
  IconChevronRight,
  IconChevronDown,
  IconDots,
  IconEdit,
  IconDownload,
  IconPencil,
  IconTrash,
  IconFilePlus,
  IconFolderPlus,
  IconCheck,
} from '@tabler/icons-preact';
import { Popover } from './Popover';
import { List } from './List';
import { ListItem } from './ListItem';
import { useDnd } from '../contexts/DndContext';
import { useAuth } from '../contexts/AuthContext';
import { ContextMenu } from './ContextMenu';
import { useContextMenu } from '../hooks/useContextMenu';
import { Modal } from './Modal';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';
import { useDeleteDocMutation, useUpdateDocMutation } from '../hooks/useDocMutations';
import { useToast } from '../contexts/ToastContext';
import { navigationObserver } from '../observers/NavigationObserver';
import './DirectoryTree.scss';

/**
 * DirectoryTree Presenter 컴포넌트
 */
export function DirectoryTreePresenter({
  categorized,
  followingUsers = [],
  followingTrees = {},
  loadingTrees = {},
  currentPath,
  expandedPaths,
  onFolderClick,
  onUserClick,
  onFileClick,
  onNavigate,
  onCreateDocument,
  onCreateFolder,
  onEditDocument,
  onDownloadDocument,
  loading = false,
}) {
  const { user } = useAuth();
  const dnd = useDnd();
  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();
  const { showSuccess, showError } = useToast();
  const updateDocMutation = useUpdateDocMutation();
  const deleteDocMutation = useDeleteDocMutation();

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameTarget, setRenameTarget] = useState(null); // { id, title, type }
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, type }

  const handleRenameClick = (id, title, type) => {
    setRenameTarget({ id, title, type });
    setRenameValue(title);
    setRenameOpen(true);
  };

  const handleDeleteClick = (id, type) => {
    setDeleteTarget({ id, type });
    setConfirmOpen(true);
  };

  const handleRenameConfirm = async (e) => {
    if (e) e.preventDefault();
    if (!renameValue.trim() || !renameTarget) return;

    try {
      const name = renameTarget.type === 'file' ? `${renameValue.trim()}.md` : renameValue.trim();
      const result = await updateDocMutation.mutateAsync({
        id: renameTarget.id,
        data: { name },
      });
      showSuccess('이름이 변경되었습니다.');
      navigationObserver.notify(result.route || `/doc/${result.id}`, {
        type: renameTarget.type === 'file' ? 'file' : 'directory',
        action: 'update',
        file: result,
      });
      setRenameOpen(false);
    } catch (err) {
      showError(err.message || '이름 변경에 실패했습니다.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocMutation.mutateAsync({ id: deleteTarget.id });
      showSuccess('삭제되었습니다.');
      navigationObserver.notify('/', {
        type: deleteTarget.type === 'file' ? 'file' : 'directory',
        action: 'delete',
      });
      if (currentPath?.includes(deleteTarget.id) && onNavigate) {
        onNavigate('/');
      }
    } catch (e) {
      showError(e?.message || '삭제에 실패했습니다.');
    } finally {
      setConfirmOpen(false);
    }
  };

  const handleRenameCancel = () => {
    setRenameOpen(false);
    setRenameTarget(null);
  };

  const bindDragSource = (item) => ({
    ...(dnd.bindDragSource ? dnd.bindDragSource(item) : {}),
  });

  const bindDropTarget = (targetFolderId, targetFolderType) => {
    const normalizedTargetId = targetFolderId === 'null' ? null : targetFolderId;
    const canDrop = dnd.canDropTo(targetFolderId, targetFolderType);
    const isOver = dnd.dragOverId === normalizedTargetId;
    const isSuccess = dnd.dropSuccessId === normalizedTargetId;
    const isDragging = dnd.isDragging;

    return {
      dndHeaderClassName: `${isDragging && canDrop ? 'folder-item__header--droppable' : ''} ${
        isDragging && !canDrop ? 'folder-item__header--drop-disabled' : ''
      } ${isOver ? 'folder-item__header--drag-over' : ''} ${
        isSuccess ? 'folder-item__header--drop-success' : ''
      }`.trim(),
      dndTitle: isDragging ? (canDrop ? '여기로 이동 (드롭)' : '이 위치로는 이동할 수 없습니다') : '',
    };
  };

  function renderTree(node, path = '', level = 0, visited = new Set(), isSubscription = false) {
    const nodeKey = path || 'root';
    if (visited.has(nodeKey)) return null;
    visited.add(nodeKey);

    try {
      const keys = Object.keys(node).filter((key) => key !== '_files' && key !== '_meta');
      const files = node._files || [];

      if (keys.length === 0 && files.length === 0) return null;

      return (
        <ul class={level === 0 ? 'file-list' : 'sub-file-list'}>
          {files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              currentPath={currentPath}
              onFileClick={onFileClick}
              onEditDocument={onEditDocument}
              onDownloadDocument={onDownloadDocument}
              onRenameDocument={handleRenameClick}
              onDeleteDocument={handleDeleteClick}
              onNavigate={onNavigate}
              isSubscription={isSubscription}
              bindDragSource={bindDragSource}
              handleContextMenu={handleContextMenu}
              contextMenu={contextMenu}
              dnd={dnd}
            />
          ))}

          {keys.map((key) => {
            const subNode = node[key];
            const subId = subNode._meta?.id;
            const subPathStr = path ? `${path}/${key}` : key;
            const isSubExpanded = expandedPaths[subId] === true;
            const isSubcategoryActive = currentPath === `/folder/${subId}`;

            return (
              <FolderItem
                key={subId}
                level={level}
                subId={subId}
                subPath={subPathStr}
                keyName={key}
                isSubExpanded={isSubExpanded}
                isSubcategoryActive={isSubcategoryActive}
                onFolderClick={onFolderClick}
                onNavigate={onNavigate}
                currentRoute={currentPath}
                onCreateDocument={isSubscription ? null : onCreateDocument}
                onCreateFolder={isSubscription ? null : onCreateFolder}
                onRenameFolder={handleRenameClick}
                onDeleteFolder={handleDeleteClick}
                subNode={subNode}
                renderTree={renderTree}
                visited={visited}
                bindDragSource={bindDragSource}
                bindDropTarget={bindDropTarget}
                isSubscription={isSubscription}
                onContextMenu={handleContextMenu}
                contextMenu={contextMenu}
              />
            );
          })}
        </ul>
      );
    } finally {
      visited.delete(nodeKey);
    }
  }

  const handleCreateMyPage = () => {
    if (!user) onNavigate('/login');
    else onNavigate('/write');
  };

  if (!user) {
    return (
      <div className="directory-tree">
        <div className="directory-tree__guest-cta">
          <p className="directory-tree__guest-text">나만의 문서 저장소를 만들어보세요.</p>
          <button className="directory-tree__guest-btn" onClick={handleCreateMyPage}>
            문서 작성하기
          </button>
        </div>
      </div>
    );
  }

  const rootFiles = categorized?._files || [];
  const categoryKeys = Object.keys(categorized).filter((key) => key !== '_files' && key !== '_meta');

  return (
    <div
      class="directory-tree"
      onContextMenu={(e) => handleContextMenu(e, null)}
      data-dnd-drop-id="null"
      data-dnd-drop-type="DIRECTORY"
    >
      <div className="directory-tree__section">
        <div className="directory-tree__section-header">
          <h3 className="directory-tree__section-title">내 페이지</h3>
          {loading && <IconLoader2 className="directory-tree__loading-spinner" size={14} />}
        </div>

        {rootFiles.length === 0 && categoryKeys.length === 0 ? (
          <div className="directory-tree__empty-my-page" style="padding: 0 8px;">
            <button className="directory-tree__guest-btn" onClick={handleCreateMyPage}>
              문서 작성하기
            </button>
          </div>
        ) : (
          <>
            <ul class="file-list root-file-list">
              {rootFiles.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  currentPath={currentPath}
                  onFileClick={onFileClick}
                  onEditDocument={onEditDocument}
                  onDownloadDocument={onDownloadDocument}
                  onRenameDocument={handleRenameClick}
                  onDeleteDocument={handleDeleteClick}
                  onNavigate={onNavigate}
                  bindDragSource={bindDragSource}
                  handleContextMenu={handleContextMenu}
                  contextMenu={contextMenu}
                  dnd={dnd}
                />
              ))}
            </ul>

            {categoryKeys.map((category) => {
              const categoryData = categorized[category];
              const categoryId = categoryData._meta?.id;
              const isExpanded = expandedPaths[categoryId] === true;
              return (
                <FolderItem
                  key={categoryId}
                  level={0}
                  subId={categoryId}
                  subPath={category}
                  keyName={category}
                  isSubExpanded={isExpanded}
                  isSubcategoryActive={currentPath === `/folder/${categoryId}`}
                  onFolderClick={onFolderClick}
                  onNavigate={onNavigate}
                  currentRoute={currentPath}
                  onCreateDocument={onCreateDocument}
                  onCreateFolder={onCreateFolder}
                  onRenameFolder={handleRenameClick}
                  onDeleteFolder={handleDeleteClick}
                  subNode={categoryData}
                  renderTree={renderTree}
                  visited={new Set()}
                  isCategory={true}
                  bindDragSource={bindDragSource}
                  bindDropTarget={bindDropTarget}
                  onContextMenu={handleContextMenu}
                  contextMenu={contextMenu}
                />
              );
            })}
          </>
        )}
      </div>

      {followingUsers.length > 0 && (
        <div className="directory-tree__section">
          <h3 className="directory-tree__section-title">구독 페이지</h3>
          {followingUsers.map((u) => {
            const isUserExpanded = expandedPaths[`sub_${u.id}`] === true;
            return (
              <div key={u.id} className="category-section" data-expanded={isUserExpanded}>
                <div className={`category-header ${isUserExpanded ? 'active' : ''}`} onClick={() => onUserClick(u.id)}>
                  <span className="folder-icon">👤</span>
                  <span className="category-title">{u.document_title || u.username}</span>
                </div>
                {isUserExpanded && followingTrees[u.id] && (
                  <div className="category-content">
                    {renderTree(followingTrees[u.id], `sub_${u.id}`, 0, new Set(), true)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ContextMenu
        {...contextMenu}
        onClose={closeContextMenu}
        onCreateDocument={onCreateDocument}
        onCreateFolder={onCreateFolder}
        onEditDocument={onEditDocument}
        onDownloadDocument={onDownloadDocument}
        onRenameDocument={(id, title) => handleRenameClick(id, title, 'file')}
        onDeleteDocument={(id) => handleDeleteClick(id, 'file')}
        onRenameFolder={(id, name) => handleRenameClick(id, name, 'folder')}
        onDeleteFolder={(id) => handleDeleteClick(id, 'folder')}
      />

      <Modal
        isOpen={renameOpen}
        onClose={handleRenameCancel}
        title="제목 수정"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={handleRenameCancel}
              disabled={updateDocMutation.isPending}
            >
              취소
            </Button>
            <Button type="submit" form="directory-rename-form" variant="primary" loading={updateDocMutation.isPending}>
              <IconCheck size={16} />
              수정
            </Button>
          </>
        }
      >
        <div className="directory-create-modal">
          <form id="directory-rename-form" onSubmit={handleRenameConfirm} className="directory-create-modal__form">
            <div className="directory-create-modal__form-group">
              <label htmlFor="renameValue">새 이름</label>
              <input
                id="renameValue"
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
    </div>
  );
}

function FileItem({
  file,
  currentPath,
  onFileClick,
  onEditDocument,
  onDownloadDocument,
  onRenameDocument,
  onDeleteDocument,
  onNavigate,
  isSubscription,
  bindDragSource,
  handleContextMenu,
  contextMenu,
  dnd,
}) {
  const [hovered, setHovered] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const buttonRef = useRef(null);

  const handleDotsClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPopoverOpen(!popoverOpen);
  };

  const handleRenameClick = () => {
    onRenameDocument(file.id, file.title, 'file');
    setPopoverOpen(false);
  };

  const handleDeleteClick = () => {
    onDeleteDocument(file.id, 'file');
    setPopoverOpen(false);
  };

  const handleListItemClick = (callback) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    callback();
    setPopoverOpen(false);
  };

  return (
    <>
      <li
        key={file.id}
        class={`file-item ${currentPath === file.route ? 'active' : ''} ${
          dnd.dragItem?.id === file.id ? 'file-item--dragging' : ''
        } ${contextMenu.isOpen && contextMenu.targetId === file.id ? 'right-clicked' : ''}`}
        onClick={() => onFileClick(file)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onContextMenu={(e) => !isSubscription && handleContextMenu(e, file.id, 'file', file)}
        data-dnd-item-id={file.id}
        data-dnd-item-type="FILE"
        data-dnd-item-name={file.title}
        data-dnd-item-author-id={file.author_id}
        {...(!isSubscription ? bindDragSource(file) : {})}
      >
        <span class="file-icon">{file.ext === '.template' ? '📄' : '📝'}</span>
        <span class="file-name">{file.title}</span>
        {hovered && !isSubscription && (
          <button ref={buttonRef} class="folder-item__add-button" onClick={handleDotsClick}>
            <IconDots size={16} />
          </button>
        )}
      </li>

      <Popover isOpen={popoverOpen} onClose={() => setPopoverOpen(false)} anchorRef={buttonRef}>
        <List>
          <ListItem icon={<IconEdit size={18} />} onClick={handleListItemClick(() => onEditDocument(file.id))}>
            편집
          </ListItem>
          <ListItem icon={<IconDownload size={18} />} onClick={handleListItemClick(() => onDownloadDocument(file))}>
            다운로드
          </ListItem>
          <ListItem icon={<IconPencil size={18} />} onClick={handleListItemClick(handleRenameClick)}>
            제목 수정
          </ListItem>
          <ListItem
            className="list-item--danger"
            icon={<IconTrash size={18} />}
            onClick={handleListItemClick(handleDeleteClick)}
          >
            삭제
          </ListItem>
        </List>
      </Popover>
    </>
  );
}

function FolderItem({
  level,
  subId,
  subPath,
  keyName,
  isSubExpanded,
  isSubcategoryActive,
  onFolderClick,
  onNavigate,
  currentRoute,
  onCreateDocument,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  subNode,
  renderTree,
  visited,
  isCategory = false,
  bindDragSource,
  bindDropTarget,
  isSubscription = false,
  onContextMenu,
  contextMenu,
}) {
  const [hovered, setHovered] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const buttonRef = useRef(null);

  const meta = subNode?._meta;
  const drop = bindDropTarget ? bindDropTarget(subId, 'DIRECTORY') : { dndHeaderClassName: '' };

  const keys = Object.keys(subNode || {}).filter((key) => key !== '_files' && key !== '_meta');
  const files = subNode?._files || [];
  const isEmpty = keys.length === 0 && files.length === 0;

  const handleFolderClick = (e) => {
    if (!e.target.closest('.folder-item__add-button')) {
      onFolderClick(subId, subPath);
    }
  };

  const handleDotsClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPopoverOpen(!popoverOpen);
  };

  const handleCreateDocument = () => {
    setPopoverOpen(false);
    if (onCreateDocument) onCreateDocument(subId);
  };

  const handleCreateFolder = () => {
    setPopoverOpen(false);
    if (onCreateFolder) onCreateFolder(subId);
  };

  const handleRenameClick = () => {
    onRenameFolder(subId, keyName, 'folder');
    setPopoverOpen(false);
  };

  const handleDeleteClick = () => {
    onDeleteFolder(subId, 'folder');
    setPopoverOpen(false);
  };

  const handleListItemClick = (callback) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    callback();
    setPopoverOpen(false);
  };

  const isRightClicked = contextMenu && contextMenu.isOpen && contextMenu.targetId === subId;

  const headerClass = isCategory
    ? `category-header ${isSubcategoryActive ? 'active' : ''} ${isRightClicked ? 'right-clicked' : ''}`
    : `subcategory-header ${isSubcategoryActive ? 'active' : ''} ${level > 0 ? 'nested' : ''} ${
        isRightClicked ? 'right-clicked' : ''
      }`;

  const dndAttributes = !isSubscription
    ? {
        'data-dnd-drop-id': subId,
        'data-dnd-drop-type': 'DIRECTORY',
        'data-dnd-item-id': subId,
        'data-dnd-item-type': 'DIRECTORY',
        'data-dnd-item-name': keyName,
        'data-dnd-item-author-id': meta?.author_id,
        ...(bindDragSource
          ? bindDragSource({ id: subId, type: 'DIRECTORY', name: keyName, author_id: meta?.author_id })
          : {}),
      }
    : {};

  return (
    <>
      <li class="subcategory-item" data-expanded={isSubExpanded}>
        <div
          class={`${headerClass} ${drop.dndHeaderClassName}`}
          onClick={handleFolderClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onContextMenu={(e) => !isSubscription && onContextMenu(e, subId, 'folder', { id: subId, name: keyName })}
          {...dndAttributes}
        >
          <span class="folder-icon">📁</span>
          <span class={isCategory ? 'category-title' : 'subcategory-title'}>{keyName}</span>
          {!isSubscription && hovered ? (
            <button ref={buttonRef} class="folder-item__add-button" onClick={handleDotsClick}>
              <IconDots size={16} />
            </button>
          ) : (
            !isEmpty && (
              <span className="folder-item__chevron">
                {isSubExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
              </span>
            )
          )}
        </div>
        {!isEmpty && (
          <div class={isCategory ? 'category-content' : 'subcategory-content'}>
            {isSubExpanded && renderTree(subNode, subPath, isCategory ? 0 : level + 1, visited, isSubscription)}
          </div>
        )}
      </li>
      <Popover isOpen={popoverOpen} onClose={() => setPopoverOpen(false)} anchorRef={buttonRef}>
        <List>
          <ListItem icon={<IconFilePlus size={18} />} onClick={handleListItemClick(handleCreateDocument)}>
            하위문서 생성
          </ListItem>
          <ListItem icon={<IconFolderPlus size={18} />} onClick={handleListItemClick(handleCreateFolder)}>
            하위폴더 생성
          </ListItem>
          <ListItem icon={<IconPencil size={18} />} onClick={handleListItemClick(handleRenameClick)}>
            제목 수정
          </ListItem>
          <ListItem
            className="list-item--danger"
            icon={<IconTrash size={18} />}
            onClick={handleListItemClick(handleDeleteClick)}
          >
            삭제
          </ListItem>
        </List>
      </Popover>
    </>
  );
}

export const DirectoryTree = DirectoryTreeContainer;
