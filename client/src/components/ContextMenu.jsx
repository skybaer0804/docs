import { useState, useEffect, useRef } from 'preact/hooks';
import { Popover } from './Popover';
import { List } from './List';
import { ListItem } from './ListItem';
import { IconFilePlus, IconFolderPlus } from '@tabler/icons-preact';
import './ContextMenu.scss';

export function ContextMenu({ 
  x, 
  y, 
  isOpen, 
  onClose, 
  onCreateDocument, 
  onCreateFolder,
  targetId = null
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

  return (
    <div 
      ref={menuRef}
      className="context-menu" 
      style={{ top: y, left: x }}
    >
      <List>
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
      </List>
    </div>
  );
}

