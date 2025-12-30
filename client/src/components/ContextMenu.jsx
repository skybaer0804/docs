import { useState, useEffect, useRef } from 'preact/hooks';
import { List } from './List';
import { ListItem } from './ListItem';
import {
  IconFilePlus,
  IconFolderPlus,
  IconEdit,
  IconDownload,
  IconPencil,
  IconTrash,
} from '@tabler/icons-preact';
import './ContextMenu.scss';

export function ContextMenu({
  x,
  y,
  isOpen,
  onClose,
  onCreateDocument,
  onCreateFolder,
  onEditDocument,
  onDownloadDocument,
  onRenameDocument,
  onDeleteDocument,
  onRenameFolder,
  onDeleteFolder,
  targetId = null,
  type = null,
  data = null,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 화면 경계를 벗어나지 않도록 좌표 조정
  const adjustedX = Math.min(x, window.innerWidth - 180);
  const adjustedY = Math.min(y, window.innerHeight - (type === 'file' ? 200 : 250));

  const renderContent = () => {
    if (type === 'file') {
      return (
        <>
          <ListItem
            icon={<IconEdit size={18} />}
            onClick={() => {
              onEditDocument(targetId);
              onClose();
            }}
          >
            편집
          </ListItem>
          <ListItem
            icon={<IconDownload size={18} />}
            onClick={() => {
              onDownloadDocument(data);
              onClose();
            }}
          >
            다운로드
          </ListItem>
          <ListItem
            icon={<IconPencil size={18} />}
            onClick={() => {
              onRenameDocument(targetId, data.title);
              onClose();
            }}
          >
            제목 수정
          </ListItem>
          <ListItem
            className="list-item--danger"
            icon={<IconTrash size={18} />}
            onClick={() => {
              onDeleteDocument(targetId);
              onClose();
            }}
          >
            삭제
          </ListItem>
        </>
      );
    }

    return (
      <>
        <ListItem
          icon={<IconFilePlus size={18} />}
          onClick={() => {
            onCreateDocument(targetId);
            onClose();
          }}
        >
          문서 생성
        </ListItem>
        <ListItem
          icon={<IconFolderPlus size={18} />}
          onClick={() => {
            onCreateFolder(targetId);
            onClose();
          }}
        >
          폴더 생성
        </ListItem>
        {type === 'folder' && (
          <>
            <ListItem
              icon={<IconPencil size={18} />}
              onClick={() => {
                onRenameFolder(targetId, data?.name);
                onClose();
              }}
            >
              제목 수정
            </ListItem>
            <ListItem
              className="list-item--danger"
              icon={<IconTrash size={18} />}
              onClick={() => {
                onDeleteFolder(targetId);
                onClose();
              }}
            >
              삭제
            </ListItem>
          </>
        )}
      </>
    );
  };

  return (
    <div ref={menuRef} className="context-menu" style={{ top: adjustedY, left: adjustedX }}>
      <List>{renderContent()}</List>
    </div>
  );
}
