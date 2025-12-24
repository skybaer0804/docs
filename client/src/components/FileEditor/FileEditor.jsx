import { useState, useEffect, useRef, useMemo } from 'preact/hooks';
import { IconX, IconSearch, IconFilePlus, IconFolderPlus, IconTrash, IconEdit, IconFile } from '@tabler/icons-preact';
import { FileTree } from './FileTree';
import { FileEditorContent } from './FileEditorContent';
import { useToast } from '../../contexts/ToastContext';
import { createDoc, updateDoc, deleteDoc } from '../../utils/api';
import { buildDirectoryTree } from '../../utils/treeUtils';
import { buildUserGroupedTree } from '../../utils/userTreeUtils';
import { navigationObserver } from '../../observers/NavigationObserver';
import { useDocsTreeQuery } from '../../hooks/useDocsTreeQuery';
import { useQueryClient } from '@tanstack/react-query';
import { docsKeys } from '../../query/queryKeys';
import './FileEditor.scss';

/**
 * FileEditor 모달 컴포넌트
 * 파일 생성, 수정, 삭제, 검색 기능을 제공하는 제네릭 파일 에디터
 */
export function FileEditor({ isOpen, onClose, userId, username }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedPaths, setExpandedPaths] = useState({});
  const [mutating, setMutating] = useState(false);
  const { showSuccess, showError } = useToast();
  const searchInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: nodes = [], isLoading } = useDocsTreeQuery({ enabled: isOpen });
  const loading = isLoading || mutating;

  const fileTree = useMemo(() => {
    if (!nodes || nodes.length === 0) return {};

    if (userId) {
      // 특정 사용자의 파일만 표시
      const userNodes = nodes.filter((node) => node.author_id === userId);
      return buildDirectoryTree(userNodes);
    }

    // 모든 사용자의 파일을 author_id별로 그룹화하여 표시
    const userMap = { [userId]: username };
    return buildUserGroupedTree(nodes, userMap);
  }, [nodes, userId, username]);

  // (Query 기반) isOpen 시점에 nodes를 로드하며, 트리는 useMemo로 구성됨

  // 검색 필터링
  const filteredTree = searchQuery
    ? filterTreeBySearch(fileTree, searchQuery)
    : fileTree;

  // 파일 선택 핸들러
  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  // 폴더 클릭 핸들러
  const handleFolderClick = (path) => {
    setExpandedPaths((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  // 파일 생성 핸들러
  const handleCreateFile = async (parentPath, name, content) => {
    try {
      setMutating(true);
      const result = await createDoc({
        type: 'FILE',
        parent_path: parentPath,
        name,
        content,
        is_public: false,
      });
      showSuccess('파일이 생성되었습니다');
      
      // FileEditor는 자체 트리를 관리하므로 navigationObserver 이벤트는 발생시키지 않음
      // (useDirectoryTree에서 중복 로드 방지)
      await queryClient.invalidateQueries({ queryKey: docsKeys.tree() });
    } catch (error) {
      showError(error.message || '파일 생성에 실패했습니다');
    } finally {
      setMutating(false);
    }
  };

  // 파일 수정 핸들러
  const handleUpdateFile = async (fileId, updates) => {
    try {
      setMutating(true);
      const result = await updateDoc(fileId, updates);
      showSuccess('파일이 수정되었습니다');
      
      // FileEditor는 자체 트리를 관리하므로 navigationObserver 이벤트는 발생시키지 않음
      // (useDirectoryTree에서 중복 로드 방지)
      await queryClient.invalidateQueries({ queryKey: docsKeys.tree() });
      // 수정된 파일 정보 업데이트
      if (selectedFile && selectedFile.id === fileId) {
        setSelectedFile({ ...selectedFile, ...updates });
      }
    } catch (error) {
      showError(error.message || '파일 수정에 실패했습니다');
    } finally {
      setMutating(false);
    }
  };

  // 파일 삭제 핸들러
  const handleDeleteFile = async (fileId) => {
    if (!confirm('정말 이 파일을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setMutating(true);
      await deleteDoc(fileId);
      showSuccess('파일이 삭제되었습니다');
      
      // FileEditor는 자체 트리를 관리하므로 navigationObserver 이벤트는 발생시키지 않음
      // (useDirectoryTree에서 중복 로드 방지)
      setSelectedFile(null);
      await queryClient.invalidateQueries({ queryKey: docsKeys.tree() });
    } catch (error) {
      showError(error.message || '파일 삭제에 실패했습니다');
    } finally {
      setMutating(false);
    }
  };

  // 검색어로 트리 필터링
  const filterTreeBySearch = (tree, query) => {
    const filtered = {};
    const lowerQuery = query.toLowerCase();

    const searchInNode = (node, path = '') => {
      const result = { _files: [] };

      // 파일 검색
      if (node._files) {
        result._files = node._files.filter(
          (file) =>
            file.title.toLowerCase().includes(lowerQuery) ||
            file.path.toLowerCase().includes(lowerQuery)
        );
      }

      // 폴더 검색
      Object.keys(node).forEach((key) => {
        if (key === '_files') return;
        const subNode = node[key];
        const subPath = path ? `${path}/${key}` : key;
        const filteredSubNode = searchInNode(subNode, subPath);

        // 하위에 파일이 있거나 폴더가 있으면 포함
        if (
          filteredSubNode._files.length > 0 ||
          Object.keys(filteredSubNode).filter((k) => k !== '_files').length > 0
        ) {
          result[key] = filteredSubNode;
        }
      });

      return result;
    };

    Object.keys(tree).forEach((key) => {
      const filteredNode = searchInNode(tree[key], key);
      if (
        filteredNode._files.length > 0 ||
        Object.keys(filteredNode).filter((k) => k !== '_files').length > 0
      ) {
        filtered[key] = filteredNode;
      }
    });

    return filtered;
  };

  if (!isOpen) return null;

  return (
    <div className="file-editor__overlay" onClick={(e) => e.target.classList.contains('file-editor__overlay') && onClose()}>
      <div className="file-editor__container">
        <div className="file-editor__header">
          <div className="file-editor__title">
            <h2>파일 시스템 {username && `- ${username}`}</h2>
          </div>
          <button className="file-editor__close" onClick={onClose} aria-label="닫기">
            <IconX size={20} />
          </button>
        </div>

        <div className="file-editor__body">
          {/* 좌측: 파일 트리 */}
          <div className="file-editor__sidebar">
            <div className="file-editor__search">
              <IconSearch size={18} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="파일 검색..."
                value={searchQuery}
                onInput={(e) => setSearchQuery(e.target.value)}
                className="file-editor__search-input"
              />
            </div>
            <FileTree
              tree={filteredTree}
              selectedFile={selectedFile}
              expandedPaths={expandedPaths}
              onFileSelect={handleFileSelect}
              onFolderClick={handleFolderClick}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
              loading={loading}
            />
          </div>

          {/* 우측: 파일 편집 영역 */}
          <div className="file-editor__content">
            {selectedFile ? (
              <FileEditorContent
                file={selectedFile}
                onUpdate={handleUpdateFile}
                onDelete={handleDeleteFile}
                loading={loading}
              />
            ) : (
              <div className="file-editor__empty">
                <IconFile size={48} />
                <p>파일을 선택하거나 새로 생성하세요</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

