import { DirectoryTreeContainer } from '../containers/DirectoryTreeContainer';
import { useState, useRef } from 'preact/hooks';
import { IconPlus } from '@tabler/icons-preact';
import { Popover } from './Popover';
import { FileManageList } from './FileManageList';
import { useDnd } from '../contexts/DndContext';
import './DirectoryTree.scss';

/**
 * DirectoryTree Presenter 컴포넌트
 * 순수 UI 렌더링만 담당 (Props 기반)
 * TDD 친화적: Props만으로 렌더링하므로 테스트 용이
 */
export function DirectoryTreePresenter({
  categorized,
  currentPath,
  expandedPaths,
  onFolderClick,
  onFileClick,
  onCreateDocument,
  onCreateFolder,
  loading = false,
}) {
  const dnd = useDnd();

  const bindDragSource = (item) => ({
    draggable: true,
    onDragStart: (e) => {
      e.stopPropagation();
      e.dataTransfer.effectAllowed = 'move';
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
          {files.map((file) => (
            <li
              key={file.path}
              class={`file-item ${currentPath === file.route ? 'active' : ''} ${
                dnd.dragItem?.path === file.path ? 'file-item--dragging' : ''
              }`}
              onClick={() => onFileClick(file)}
              title={file.path}
              {...bindDragSource({
                id: file.id,
                type: 'FILE',
                path: file.path,
                name: file.name || file.title,
                author_id: file.author_id,
              })}
            >
              <span class="file-icon">{file.ext === '.template' ? '📄' : '📝'}</span>
              <span class="file-name">{file.title}</span>
            </li>
          ))}

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

  if (loading || categoryKeys.length === 0) {
    return (
      <div class="directory-tree">
        <div class="category-section">
          <div class="category-title">로딩 중...</div>
          <ul class="file-list">
            <li class="file-item">파일을 불러오는 중입니다...</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div class="directory-tree">
      {dnd.isDragging && (
        <div class="directory-tree__dnd-hint" role="note">
          폴더에만 드롭할 수 있어요. 상위로 빼기는 상단의 ⬆ 드롭존에 드롭하세요.
        </div>
      )}
      {categoryKeys
        .filter((category) => category !== '_files')
        .map((category) => {
          const categoryData = categorized[category];
          const categoryPath = category;
          const isExpanded = expandedPaths[categoryPath] === true; // 기본값 false

          const categoryRoute = `/category/${categoryPath}`;
          const isCategoryActive = currentPath === categoryRoute;

          return (
            <div key={category} class="category-section" data-expanded={isExpanded}>
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
  const drop = bindDropTarget ? bindDropTarget(folderDocsPath) : { dndHeaderClassName: '' };
  const { dndHeaderClassName = '', dndTitle = '', ...dropHandlers } = drop || {};

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
          data-dnd-drop-path={folderDocsPath}
          {...dropHandlers}
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
