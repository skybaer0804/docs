import { IconFile, IconFolder, IconFolderOpen, IconFilePlus, IconTrash } from '@tabler/icons-preact';
import { useState } from 'preact/hooks';

/**
 * FileTree 컴포넌트
 * 파일 트리를 재귀적으로 렌더링
 */
export function FileTree({
  tree,
  selectedFile,
  expandedPaths,
  onFileSelect,
  onFolderClick,
  onCreateFile,
  onDeleteFile,
  loading,
  onPathSelect,
  selectedPath,
}) {
  const [newFileName, setNewFileName] = useState('');
  const [creatingPath, setCreatingPath] = useState(null);

  const renderTree = (node, path = '', level = 0) => {
    const keys = Object.keys(node).filter((key) => key !== '_files' && key !== '_meta');
    const files = node._files || [];

    if (keys.length === 0 && files.length === 0 && level > 0) {
      return null;
    }

    return (
      <ul className={`file-tree__list ${level === 0 ? 'file-tree__list--root' : ''}`}>
        {/* 파일들 */}
        {files.map((file) => (
          <li
            key={file.id}
            className={`file-tree__item file-tree__item--file ${selectedFile?.id === file.id ? 'file-tree__item--selected' : ''
              }`}
            onClick={() => onFileSelect(file)}
            title={file.title}
          >
            <IconFile size={16} />
            <span className="file-tree__item-name">{file.title}</span>
            {onDeleteFile && (
              <button
                className="file-tree__item-action"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFile(file);
                }}
                title="삭제"
              >
                <IconTrash size={14} />
              </button>
            )}
          </li>
        ))}

        {/* 폴더들 */}
        {keys.map((key) => {
          const subPath = path ? `${path}/${key}` : key;
          const subNode = node[key];
          const isExpanded = expandedPaths[subPath] === true;
          const hasContent =
            subNode._files?.length > 0 || Object.keys(subNode).filter((k) => k !== '_files' && k !== '_meta').length > 0;

          if (!hasContent && level > 0) return null;

          return (
            <li key={key} className="file-tree__item file-tree__item--folder">
              <div
                className={`file-tree__folder-header ${onPathSelect && selectedPath === `/docs/${subPath}` ? 'file-tree__folder-header--selected' : ''
                  }`}
                onClick={() => {
                  onFolderClick(subPath);
                  if (onPathSelect) {
                    onPathSelect(`/docs/${subPath}`);
                  }
                }}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
              >
                {isExpanded ? <IconFolderOpen size={16} /> : <IconFolder size={16} />}
                <span className="file-tree__item-name">{key}</span>
                {onCreateFile && (
                  <button
                    className="file-tree__item-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreatingPath(subPath);
                    }}
                    title="파일 추가"
                  >
                    <IconFilePlus size={14} />
                  </button>
                )}
              </div>
              {isExpanded && (
                <div className="file-tree__folder-content">
                  {creatingPath === subPath && (
                    <div className="file-tree__create-form">
                      <input
                        type="text"
                        placeholder="파일명 입력..."
                        value={newFileName}
                        onInput={(e) => setNewFileName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newFileName.trim()) {
                            onCreateFile(subPath, newFileName.trim(), '');
                            setNewFileName('');
                            setCreatingPath(null);
                          } else if (e.key === 'Escape') {
                            setNewFileName('');
                            setCreatingPath(null);
                          }
                        }}
                        autoFocus
                        className="file-tree__create-input"
                      />
                    </div>
                  )}
                  {renderTree(subNode, subPath, level + 1)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  if (loading) {
    return (
      <div className="file-tree">
        <div className="file-tree__loading">로딩 중...</div>
      </div>
    );
  }

  const categoryKeys = Object.keys(tree);
  if (categoryKeys.length === 0) {
    return (
      <div className="file-tree">
        <div className="file-tree__empty">파일이 없습니다</div>
      </div>
    );
  }

  // username이 최상단에 있는지 확인 (author_id별 그룹화된 경우)
  const isUserGrouped = categoryKeys.some((key) => {
    const categoryData = tree[key];
    // user-grouped 형태: 최상단 키가 username이고, 그 값은 "root tree"로 _meta가 없음
    return typeof categoryData === 'object' && categoryData !== null && categoryData._meta === undefined;
  });

  return (
    <div className="file-tree">
      {categoryKeys.map((category) => {
        const categoryData = tree[category];
        const isExpanded = expandedPaths[category] === true;
        const isUserCategory = isUserGrouped && category !== 'undefined' && !categoryData._files;

        return (
          <div key={category} className={`file-tree__category ${isUserCategory ? 'file-tree__category--user' : ''}`}>
            <div
              className={`file-tree__category-header ${onPathSelect && selectedPath === `/docs/${category}` ? 'file-tree__category-header--selected' : ''
                } ${isUserCategory ? 'file-tree__category-header--user' : ''}`}
              onClick={() => {
                onFolderClick(category);
                if (onPathSelect) {
                  onPathSelect(`/docs/${category}`);
                }
              }}
            >
              {isExpanded ? <IconFolderOpen size={18} /> : <IconFolder size={18} />}
              <span className="file-tree__category-name">
                {isUserCategory ? `${category}의 디렉토리` : category}
              </span>
              {onCreateFile && !isUserCategory && (
                <button
                  className="file-tree__item-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreatingPath(category);
                  }}
                  title="파일 추가"
                >
                  <IconFilePlus size={14} />
                </button>
              )}
            </div>
            {isExpanded && (
              <div className="file-tree__category-content">
                {creatingPath === category && !isUserCategory && (
                  <div className="file-tree__create-form">
                    <input
                      type="text"
                      placeholder="파일명 입력..."
                      value={newFileName}
                      onInput={(e) => setNewFileName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newFileName.trim()) {
                          onCreateFile(category, newFileName.trim(), '');
                          setNewFileName('');
                          setCreatingPath(null);
                        } else if (e.key === 'Escape') {
                          setNewFileName('');
                          setCreatingPath(null);
                        }
                      }}
                      autoFocus
                      className="file-tree__create-input"
                    />
                  </div>
                )}
                {renderTree(categoryData, category, 0)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

