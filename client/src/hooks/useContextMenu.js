import { useState, useCallback } from 'preact/hooks';

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState({
    x: 0,
    y: 0,
    isOpen: false,
    targetId: null,
    type: null,
    data: null
  });

  const handleContextMenu = useCallback((e, targetId = null, type = null, data = null) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      isOpen: true,
      targetId,
      type,
      data
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    contextMenu,
    handleContextMenu,
    closeContextMenu
  };
}

