import { DirectoryTreeContainer } from '../containers/DirectoryTreeContainer';
import { useState, useRef } from 'preact/hooks';
import { IconPlus, IconLoader2, IconUserPlus } from '@tabler/icons-preact';
import { Popover } from './Popover';
import { FileManageList } from './FileManageList';
import { useDnd } from '../contexts/DndContext';
import { useAuth } from '../contexts/AuthContext';
import { ContextMenu } from './ContextMenu';
import { useContextMenu } from '../hooks/useContextMenu';
import './DirectoryTree.scss';

/**
 * DirectoryTree Presenter 컴포넌트
 * 순수 UI 렌더링만 담당 (Props 기반)
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
  loading = false,
}) {
  const { user } = useAuth();
  const dnd = useDnd();
  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();

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

      return (
        <ul class={level === 0 ? 'file-list' : 'sub-file-list'}>
          {files.map((file) => (
            <li
              key={file.id}
              class={`file-item ${currentPath === file.route ? 'active' : ''} ${
                dnd.dragItem?.id === file.id ? 'file-item--dragging' : ''
              }`}
              onClick={() => onFileClick(file)}
              onContextMenu={(e) => !isSubscription && handleContextMenu(e, file.parent_id)}
              data-dnd-item-id={file.id}
              data-dnd-item-type="FILE"
              data-dnd-item-name={file.title}
              data-dnd-item-author-id={file.author_id}
              {...(!isSubscription ? bindDragSource(file) : {})}
            >
              <span class="file-icon">{file.ext === '.template' ? '📄' : '📝'}</span>
              <span class="file-name">{file.title}</span>
            </li>
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
                onCreateDocument={isSubscription ? null : onCreateDocument}
                onCreateFolder={isSubscription ? null : onCreateFolder}
                subNode={subNode}
                renderTree={renderTree}
                visited={visited}
                bindDragSource={bindDragSource}
                bindDropTarget={bindDropTarget}
                isSubscription={isSubscription}
                onContextMenu={handleContextMenu}
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

  const rootId = null;
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
                <li
                  key={file.id}
                  class={`file-item ${currentPath === file.route ? 'active' : ''} ${
                    dnd.dragItem?.id === file.id ? 'file-item--dragging' : ''
                  }`}
                  onClick={() => onFileClick(file)}
                  onContextMenu={(e) => handleContextMenu(e, null)}
                  data-dnd-item-id={file.id}
                  data-dnd-item-type="FILE"
                  data-dnd-item-name={file.title}
                  data-dnd-item-author-id={file.author_id}
                  {...bindDragSource(file)}
                >
                  <span class="file-icon">{file.ext === '.template' ? '📄' : '📝'}</span>
                  <span class="file-name">{file.title}</span>
                </li>
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
                  onCreateDocument={onCreateDocument}
                  onCreateFolder={onCreateFolder}
                  subNode={categoryData}
                  renderTree={renderTree}
                  visited={new Set()}
                  isCategory={true}
                  bindDragSource={bindDragSource}
                  bindDropTarget={bindDropTarget}
                  onContextMenu={handleContextMenu}
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
      />
    </div>
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
  onCreateDocument,
  onCreateFolder,
  subNode,
  renderTree,
  visited,
  isCategory = false,
  bindDragSource,
  bindDropTarget,
  isSubscription = false,
  onContextMenu,
}) {
  const [hovered, setHovered] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const buttonRef = useRef(null);

  const meta = subNode?._meta;
  const drop = bindDropTarget ? bindDropTarget(subId, 'DIRECTORY') : { dndHeaderClassName: '' };

  const handleFolderClick = (e) => {
    if (!e.target.closest('.folder-item__add-button')) {
      onFolderClick(subId, subPath);
    }
  };

  const handleAddClick = (e) => {
    e.stopPropagation();
    setPopoverOpen(true);
  };

  const handleCreateDocument = () => {
    setPopoverOpen(false);
    if (onCreateDocument) onCreateDocument(subId);
  };

  const handleCreateFolder = () => {
    setPopoverOpen(false);
    if (onCreateFolder) onCreateFolder(subId);
  };

  const headerClass = isCategory
    ? `category-header ${isSubcategoryActive ? 'active' : ''}`
    : `subcategory-header ${isSubcategoryActive ? 'active' : ''} ${level > 0 ? 'nested' : ''}`;

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
          onContextMenu={(e) => !isSubscription && onContextMenu(e, subId)}
          {...dndAttributes}
        >
          <span class="folder-icon">📁</span>
          <span class={isCategory ? 'category-title' : 'subcategory-title'}>{keyName}</span>
          {hovered && (onCreateDocument || onCreateFolder) && (
            <button ref={buttonRef} class="folder-item__add-button" onClick={handleAddClick}>
              <IconPlus size={16} />
            </button>
          )}
        </div>
        <div class={isCategory ? 'category-content' : 'subcategory-content'}>
          {isSubExpanded && renderTree(subNode, subPath, isCategory ? 0 : level + 1, visited, isSubscription)}
        </div>
      </li>
      <Popover isOpen={popoverOpen} onClose={() => setPopoverOpen(false)} anchorRef={buttonRef}>
        <FileManageList onCreateDocument={handleCreateDocument} onCreateFolder={handleCreateFolder} />
      </Popover>
    </>
  );
}

export const DirectoryTree = DirectoryTreeContainer;
