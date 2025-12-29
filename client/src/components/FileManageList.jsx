import { useState } from 'preact/hooks';
import { IconFilePlus, IconFolderPlus } from '@tabler/icons-preact';
import { List } from './List';
import { ListItem } from './ListItem';
import './FileManageList.scss';

/**
 * FileManageList 컴포넌트
 * Sidebar 호버시 파일/폴더 생성 메뉴를 표시하는 컴포넌트
 * @param {Object} props
 * @param {Function} props.onCreateDocument - 문서 생성 핸들러
 * @param {Function} props.onCreateFolder - 폴더 생성 핸들러
 * @param {string} props.className - 추가 CSS 클래스명
 */
export function FileManageList({ onCreateDocument, onCreateFolder, className = '' }) {
  return (
    <div className={`file-manage-list ${className}`.trim()}>
      <List>
        <ListItem icon={<IconFilePlus size={18} />} onClick={onCreateDocument}>
          하위문서 생성
        </ListItem>
        <ListItem icon={<IconFolderPlus size={18} />} onClick={onCreateFolder}>
          하위폴더 생성
        </ListItem>
      </List>
    </div>
  );
}
