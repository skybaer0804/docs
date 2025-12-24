import { useState, useEffect } from 'preact/hooks';
import { IconX, IconSearch, IconCheck } from '@tabler/icons-preact';
import { FileTree } from './FileTree';
import { buildDirectoryTree } from '../../utils/treeUtils';
import { buildUserGroupedTree } from '../../utils/userTreeUtils';
import { useAuth } from '../../contexts/AuthContext';
import { useDocsTreeQuery } from '../../hooks/useDocsTreeQuery';
import './FileLocationModal.scss';

/**
 * FileLocationModal 컴포넌트
 * 파일 위치를 선택하는 모달 (EditorPage에서 사용)
 */
export function FileLocationModal({ isOpen, onClose, onSelect, currentPath = '/docs' }) {
  const { user } = useAuth();
  const { data: allNodes = [], isLoading: loading } = useDocsTreeQuery({ enabled: isOpen });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState(currentPath);
  const [expandedPaths, setExpandedPaths] = useState({});

  // 파일 트리 로드
  useEffect(() => {
    if (!isOpen) return;
    setSelectedPath(currentPath);
  }, [isOpen, currentPath]);

  // currentPath의 부모 경로들을 자동으로 펼치기
  useEffect(() => {
    if (!isOpen) return;
    if (!currentPath) return;
    const parts = currentPath.split('/').filter(Boolean);
    if (parts[0] === 'docs') parts.shift();

    const newExpanded = {};
    let accumulated = '';
    parts.forEach((part) => {
      const key = accumulated ? `${accumulated}/${part}` : part;
      accumulated = key;
      newExpanded[key] = true;
    });
    setExpandedPaths(newExpanded);
  }, [isOpen, currentPath]);

  // 폴더만 표시 (type이 'DIRECTORY'인 것만)
  const folders = allNodes.filter((node) => node.type === 'DIRECTORY');
  // author_id별로 그룹화하여 username 표시
  const userMap = {};
  const fileTree = buildUserGroupedTree(folders, userMap);

  // 검색 필터링
  const filteredTree = searchQuery ? filterTreeBySearch(fileTree, searchQuery) : fileTree;

  // 폴더 클릭 핸들러
  const handleFolderClick = (path) => {
    setExpandedPaths((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
    // 폴더 클릭 시 해당 경로 선택
    setSelectedPath(`/docs/${path}`);
  };

  // 경로 선택 핸들러
  const handlePathSelect = (path) => {
    setSelectedPath(path);
  };

  // 확인 핸들러
  const handleConfirm = () => {
    if (selectedPath && onSelect) {
      onSelect(selectedPath);
      onClose();
    }
  };

  // 검색어로 트리 필터링
  const filterTreeBySearch = (tree, query) => {
    const filtered = {};
    const lowerQuery = query.toLowerCase();

    const searchInNode = (node, path = '') => {
      const result = {};

      Object.keys(node).forEach((key) => {
        if (key === '_files' || key === '_meta') return;
        const subNode = node[key];
        const subPath = path ? `${path}/${key}` : key;

        // 검색어와 일치하는 폴더인지 확인
        if (key.toLowerCase().includes(lowerQuery) || subPath.toLowerCase().includes(lowerQuery)) {
          filtered[key] = subNode;
        } else {
          const filteredSubNode = searchInNode(subNode, subPath);
          if (Object.keys(filteredSubNode).length > 0) {
            filtered[key] = filteredSubNode;
          }
        }
      });

      return result;
    };

    Object.keys(tree).forEach((key) => {
      if (key.toLowerCase().includes(lowerQuery)) {
        filtered[key] = tree[key];
      } else {
        const filteredNode = searchInNode(tree[key], key);
        if (Object.keys(filteredNode).length > 0) {
          filtered[key] = filteredNode;
        }
      }
    });

    return filtered;
  };

  if (!isOpen) return null;

  return (
    <div
      className="file-location-modal__overlay"
      onClick={(e) => e.target.classList.contains('file-location-modal__overlay') && onClose()}
    >
      <div className="file-location-modal__container">
        <div className="file-location-modal__header">
          <h2 className="file-location-modal__title">파일 위치 선택</h2>
          <button className="file-location-modal__close" onClick={onClose} aria-label="닫기">
            <IconX size={20} />
          </button>
        </div>

        <div className="file-location-modal__body">
          <div className="file-location-modal__search">
            <IconSearch size={18} />
            <input
              type="text"
              placeholder="폴더 검색..."
              value={searchQuery}
              onInput={(e) => setSearchQuery(e.target.value)}
              className="file-location-modal__search-input"
            />
          </div>

          <div className="file-location-modal__tree">
            <FileTree
              tree={filteredTree}
              selectedFile={null}
              expandedPaths={expandedPaths}
              onFileSelect={null}
              onFolderClick={handleFolderClick}
              onCreateFile={null}
              onDeleteFile={null}
              loading={loading}
              onPathSelect={handlePathSelect}
              selectedPath={selectedPath}
            />
          </div>

          <div className="file-location-modal__selected">
            <span className="file-location-modal__selected-label">선택된 경로:</span>
            <span className="file-location-modal__selected-path">{selectedPath || '/docs'}</span>
          </div>
        </div>

        <div className="file-location-modal__footer">
          <button className="file-location-modal__cancel" onClick={onClose}>
            취소
          </button>
          <button className="file-location-modal__confirm" onClick={handleConfirm}>
            <IconCheck size={16} />
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
