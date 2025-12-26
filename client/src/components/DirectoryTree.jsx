import { DirectoryTreeContainer } from '../containers/DirectoryTreeContainer';
import { useState, useRef } from 'preact/hooks';
import { IconPlus, IconLoader2, IconUserPlus } from '@tabler/icons-preact';
import { Popover } from './Popover';
import { FileManageList } from './FileManageList';
import { useDnd } from '../contexts/DndContext';
import { useAuth } from '../contexts/AuthContext';
import './DirectoryTree.scss';

/**
 * DirectoryTree Presenter 컴포넌트
 * 순수 UI 렌더링만 담당 (Props 기반)
 * TDD 친화적: Props만으로 렌더링하므로 테스트 용이
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
  onCreateDocument,
  onCreateFolder,
  loading = false,
}) {
  const { user } = useAuth();
  const dnd = useDnd();

  const bindDragSource = (item) => ({
    ...(dnd.bindDragSource ? dnd.bindDragSource(item) : {}),
  });

  const bindDropTarget = (targetFolderId, targetFolderType) => {
    // targetFolderId가 null이면 실제 null로 비교 (루트 대응)
    const normalizedTargetId = targetFolderId === 'null' ? null : targetFolderId;
    
    // stale closure 방지를 위해 Ref 사용 가능하면 사용, 아니면 state 사용
    // DirectoryTree는 매번 렌더링되므로 state 기반 canDropTo도 동작함
    const canDrop = dnd.canDropTo(targetFolderId, targetFolderType);
    const isOver = dnd.dragOverId === normalizedTargetId;
    const isSuccess = dnd.dropSuccessId === normalizedTargetId;
    const isDragging = dnd.isDragging;

    return {
      dndHeaderClassName: `${isDragging && canDrop ? 'folder-item__header--droppable' : ''} ${
        isDragging && !canDrop ? 'folder-item__header--drop-disabled' : ''
      } ${isOver ? 'folder-item__header--drag-over' : ''} ${isSuccess ? 'folder-item__header--drop-success' : ''}`.trim(),
      dndTitle: isDragging ? (canDrop ? '여기로 이동 (드롭)' : '이 위치로는 이동할 수 없습니다') : '',
    };
  };

  // 재귀적으로 트리 렌더링 (순환 참조 방지)
  function renderTree(node, path = '', level = 0, visited = new Set()) {
    // 순환 참조 방지: 이미 방문한 노드는 건너뛰기
    const nodeKey = path || 'root';
    if (visited.has(nodeKey)) {
      console.warn('Circular reference detected in directory tree:', path);
      return null;
    }
    visited.add(nodeKey);

    try {
      // 정렬 제거: 원본 순서 유지 (대소문자, 한글 그대로 표시)
      const keys = Object.keys(node).filter((key) => key !== '_files' && key !== '_meta');
      const files = node._files || [];

      if (keys.length === 0 && files.length === 0) {
        visited.delete(nodeKey);
        return null;
      }

      const result = (
        <ul class={level === 0 ? 'file-list' : 'sub-file-list'}>
          {/* 파일들 */}
          {files.map((file) => {
            // 파일의 부모 경로를 드롭 타겟으로 설정

            return (
              <li
                key={file.path}
                class={`file-item ${currentPath === file.route ? 'active' : ''} ${
                  dnd.dragItem?.id === file.id ? 'file-item--dragging' : ''
                }`}
                onClick={() => onFileClick(file)}
                title={file.path}
                data-dnd-item-id={file.id}
                data-dnd-item-type="FILE"
                data-dnd-item-path={file.path}
                data-dnd-item-name={file.name || file.title}
                data-dnd-item-author-id={file.author_id}
              >
                <span class="file-icon">{file.ext === '.template' ? '📄' : '📝'}</span>
                <span class="file-name">{file.title}</span>
              </li>
            );
          })}

          {/* 하위 디렉토리들 */}
          {keys.map((key) => {
            const subPath = path ? `${path}/${key}` : key;
            const subNode = node[key];

            // subNode가 유효한지 확인
            if (!subNode || typeof subNode !== 'object') {
              return null;
            }

            // NOTE:
            // - DB(nodes) 기반에선 "빈 폴더"도 존재할 수 있음
            // - 기존 hasContent 로직은 빈 폴더를 Sidebar에서 숨겨버려 폴더 생성 직후 안 보이는 문제가 있었음
            // - _meta(폴더 메타)가 있으면 빈 폴더라도 렌더링하도록 허용
            const hasRenderableFolderMeta = Boolean(subNode?._meta);
            const hasFiles = (subNode._files?.length || 0) > 0;
            const hasSubFolders = Object.keys(subNode).filter((k) => k !== '_files' && k !== '_meta').length > 0;

            if (!hasRenderableFolderMeta && !hasFiles && !hasSubFolders) return null;

            const isSubExpanded = expandedPaths[subPath] === true; // 기본값 false

            const subcategoryRoute = `/category/${subPath}`;
            const isSubcategoryActive = currentPath === subcategoryRoute;

            return (
              <FolderItem
                key={key}
                level={level}
                subPath={subPath}
                keyName={key}
                isSubExpanded={isSubExpanded}
                isSubcategoryActive={isSubcategoryActive}
                onFolderClick={onFolderClick}
                onCreateDocument={onCreateDocument}
                onCreateFolder={onCreateFolder}
                subNode={subNode}
                renderTree={renderTree}
                visited={visited}
                bindDragSource={bindDragSource}
                bindDropTarget={bindDropTarget}
              />
            );
          })}
        </ul>
      );

      visited.delete(nodeKey);
      return result;
    } catch (error) {
      visited.delete(nodeKey);
      console.error('Error rendering tree node:', path, error);
      return null;
    }
  }

  // 정렬 제거: 원본 순서 유지 (대소문자, 한글 그대로 표시)
  const categoryKeys = Object.keys(categorized);

  const handleCreateMyPage = () => {
    onNavigate('/register');
  };

  // 비회원용 사이드바 뷰
  if (!user) {
    return (
      <div className="directory-tree">
        <div className="directory-tree__guest-cta">
          <p className="directory-tree__guest-text">나만의 문서 저장소를 만들어보세요.</p>
          <button className="directory-tree__guest-btn" onClick={handleCreateMyPage}>
            내 페이지 만들기
          </button>
        </div>
      </div>
    );
  }

  // 루트 레벨(/docs) 드롭 타겟 설정 - null은 루트를 의미
  const rootId = null;
  const rootType = 'DIRECTORY';
  const canDropToRoot = dnd.canDropTo(rootId, rootType);
  const isDragOverRoot = dnd.dragOverId === rootId;
  const isDropSuccessRoot = dnd.dropSuccessId === rootId;

  const rootFiles = categorized?._files || [];

  return (
    <div
      class={`directory-tree ${isDragOverRoot && dnd.isDragging ? 'directory-tree--drag-over-root' : ''}`}
      data-dnd-drop-id={rootId === null ? 'null' : rootId}
      data-dnd-drop-type={rootType}
    >
      {dnd.isDragging && (
        <div class="directory-tree__dnd-hint" role="note">
          폴더나 파일에 드롭할 수 있어요. 브레드크럼의 경로에도 드롭 가능합니다.
        </div>
      )}

      {/* 내 페이지 섹션 */}
      <div className="directory-tree__section">
        <div className="directory-tree__section-header">
          <h3 className="directory-tree__section-title">내 페이지</h3>
          {loading && <IconLoader2 className="directory-tree__loading-spinner" size={14} />}
        </div>
        {rootFiles.length > 0 && (
          <ul class="file-list root-file-list">
            {rootFiles.map((file) => (
              <li
                key={file.path}
                class={`file-item ${currentPath === file.route ? 'active' : ''} ${
                  dnd.dragItem?.id === file.id ? 'file-item--dragging' : ''
                }`}
                onClick={() => onFileClick(file)}
                title={file.path}
                data-dnd-item-id={file.id}
                data-dnd-item-type="FILE"
                data-dnd-item-path={file.path}
                data-dnd-item-name={file.name || file.title}
                data-dnd-item-author-id={file.author_id}
                {...(dnd.bindDragSource ? dnd.bindDragSource(file) : {})}
              >
                <span class="file-icon">{file.ext === '.template' ? '📄' : '📝'}</span>
                <span class="file-name">{file.title}</span>
              </li>
            ))}
          </ul>
        )}

        {categoryKeys
          .filter((category) => category !== '_files')
          .map((category) => {
            const categoryData = categorized[category];
            const categoryPath = category;
            const isExpanded = expandedPaths[categoryPath] === true;

            const categoryRoute = `/category/${categoryPath}`;
            const isCategoryActive = currentPath === categoryRoute;

            const categoryMeta = categoryData?._meta;
            return (
              <div
                key={category}
                class="category-section"
                data-expanded={isExpanded}
                {...(categoryMeta ? {
                  'data-dnd-drop-id': categoryMeta.id,
                  'data-dnd-drop-type': 'DIRECTORY',
                } : {})}
              >
                <FolderItem
                  level={0}
                  subPath={categoryPath}
                  keyName={category}
                  isSubExpanded={isExpanded}
                  isSubcategoryActive={isCategoryActive}
                  onFolderClick={onFolderClick}
                  onCreateDocument={onCreateDocument}
                  onCreateFolder={onCreateFolder}
                  subNode={categoryData}
                  renderTree={renderTree}
                  visited={new Set()}
                  isCategory={true}
                  bindDragSource={bindDragSource}
                  bindDropTarget={bindDropTarget}
                />
              </div>
            );
          })}
      </div>

      {/* 구독 페이지 섹션 */}
      {followingUsers.length > 0 && (
        <div className="directory-tree__section">
          <h3 className="directory-tree__section-title">구독 페이지</h3>
          {followingUsers.map((u) => {
            const userId = u.id;
            const username = u.username;
            const docTitle = u.document_title || username;
            const isUserExpanded = expandedPaths[`sub_${userId}`] === true;
            const userTree = followingTrees[userId];
            const isLoading = loadingTrees[userId];

            return (
              <div key={userId} className="category-section" data-expanded={isUserExpanded}>
                <div
                  className={`category-header ${isUserExpanded ? 'active' : ''}`}
                  onClick={() => onUserClick(userId)}
                >
                  <span className="folder-icon">👤</span>
                  <span className="category-title">{docTitle}</span>
                  {isLoading && <span className="directory-tree__loading-icon">...</span>}
                </div>
                {isUserExpanded && userTree && (
                  <div className="category-content">
                    {renderTree(userTree, `sub_${userId}`, 0, new Set())}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * FolderItem 컴포넌트
 * 폴더 항목 렌더링 및 호버시 + 아이콘 표시
 */
function FolderItem({
  level,
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
}) {
  const [hovered, setHovered] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const buttonRef = useRef(null);

  const meta = subNode?._meta;
  const folderDocsPath = meta?.path || `/docs/${subPath}`;
  const drop = bindDropTarget ? bindDropTarget(meta?.id, 'DIRECTORY') : { dndHeaderClassName: '' };
  const { dndHeaderClassName = '', dndTitle = '' } = drop || {};

  const handleFolderClick = (e) => {
    // + 아이콘 클릭이 아닌 경우에만 폴더 클릭 처리
    if (!e.target.closest('.folder-item__add-button')) {
      onFolderClick(subPath);
    }
  };

  const handleAddClick = (e) => {
    e.stopPropagation();
    setPopoverOpen(true);
  };

  const handleCreateDocument = () => {
    setPopoverOpen(false);
    if (onCreateDocument) {
      onCreateDocument(`/docs/${subPath}`);
    }
  };

  const handleCreateFolder = () => {
    setPopoverOpen(false);
    if (onCreateFolder) {
      // 하위 디렉토리 생성시 현재 경로(subPath)를 그대로 사용
      onCreateFolder(`/docs/${subPath}`);
    }
  };

  const headerClass = isCategory
    ? `category-header ${isSubcategoryActive ? 'active' : ''}`
    : `${level === 0 ? 'subcategory-header' : 'subcategory-header nested'} ${isSubcategoryActive ? 'active' : ''}`;

  return (
    <>
      <li
        class={level === 0 && !isCategory ? 'subcategory-item' : isCategory ? '' : 'subcategory-item nested'}
        data-expanded={isSubExpanded}
      >
        <div
          class={`${headerClass} ${dndHeaderClassName}`}
          onClick={handleFolderClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          title={dndTitle || subPath}
          data-dnd-drop-id={meta?.id}
          data-dnd-drop-type="DIRECTORY"
          {...(meta && bindDragSource
            ? bindDragSource({
                id: meta.id,
                type: 'DIRECTORY',
                path: folderDocsPath,
                name: meta.name || keyName,
                author_id: meta.author_id,
              })
            : {})}
        >
          <span class="folder-icon">📁</span>
          <span class={isCategory ? 'category-title' : 'subcategory-title'}>{keyName}</span>
          {hovered && (onCreateDocument || onCreateFolder) && (
            <button
              ref={buttonRef}
              class="folder-item__add-button"
              onClick={handleAddClick}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="파일/폴더 추가"
              title="파일/폴더 추가"
            >
              <IconPlus size={16} />
            </button>
          )}
        </div>
        {!isCategory && <div class="subcategory-content">{renderTree(subNode, subPath, level + 1, visited)}</div>}
      </li>
      {isCategory && <div class="category-content">{renderTree(subNode, subPath, 0, visited)}</div>}
      <Popover isOpen={popoverOpen} onClose={() => setPopoverOpen(false)} anchorRef={buttonRef}>
        <FileManageList onCreateDocument={handleCreateDocument} onCreateFolder={handleCreateFolder} />
      </Popover>
    </>
  );
}

// 기존 API 호환성을 위한 기본 export (Container 사용)
export const DirectoryTree = DirectoryTreeContainer;
