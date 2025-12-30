import { useState, useCallback } from 'preact/hooks';

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState({
    x: 0,
    y: 0,
    isOpen: false,
    targetId: null
  });

  const handleContextMenu = useCallback((e, targetId = null) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      isOpen: true,
      targetId
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

