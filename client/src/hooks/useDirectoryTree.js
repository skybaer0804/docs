import { useState, useEffect, useMemo } from 'preact/hooks';
import { buildDirectoryTree, buildSubscriptionTree } from '../utils/treeUtils';
import { navigationObserver } from '../observers/NavigationObserver';
import { useQueryClient } from '@tanstack/react-query';
import { docsKeys, subKeys } from '../query/queryKeys';
import { useDocsTreeQuery } from './useDocsTreeQuery';
import { useFollowingNodes } from './useFollowingNodes';

/**
 * DirectoryTree의 로직을 담당하는 Custom Hook
 */
export function useDirectoryTree(currentPath, onNavigate) {
    const [expandedPaths, setExpandedPaths] = useState({});
    const queryClient = useQueryClient();
    
    // 내 문서 트리
    const { data: nodes = [], isLoading: loading } = useDocsTreeQuery();
    const categorized = useMemo(() => buildDirectoryTree(nodes), [nodes]);

    // 구독한 유저들의 문서 트리
    const { data: followingNodes = [], isLoading: subLoading } = useFollowingNodes();
    const followingCategorized = useMemo(() => buildSubscriptionTree(followingNodes), [followingNodes]);

    // 문서 변경 이벤트 감지하여 트리 업데이트
    useEffect(() => {
        let debounceTimer = null;
        let isReloading = false;

        const handleDocumentChange = ({ action, type, path }) => {
            if ((type === 'file' || type === 'directory') && (action === 'create' || action === 'update' || action === 'delete')) {
                if (isReloading) return;

                if (debounceTimer) clearTimeout(debounceTimer);
                debounceTimer = setTimeout(async () => {
                    isReloading = true;
                    try {
                        await queryClient.invalidateQueries({ queryKey: docsKeys.tree() });
                        await queryClient.invalidateQueries({ queryKey: subKeys.followingNodes() });
                    } finally {
                        isReloading = false;
                        debounceTimer = null;
                    }
                }, 300);
            }
        };

        const unsubscribe = navigationObserver.subscribe(handleDocumentChange);
        return () => {
            unsubscribe();
            if (debounceTimer) clearTimeout(debounceTimer);
        };
    }, [queryClient]);

    // currentPath 변경 시 자동으로 부모 경로들을 펼치기
    useEffect(() => {
        if (!currentPath || Object.keys(categorized).length === 0) return;

        let parts = [];
        
        if (currentPath.startsWith('/category/')) {
            parts = currentPath.replace('/category/', '').split('/').filter(Boolean);
        } else {
            parts = currentPath.split('/').filter(Boolean);
            if (parts[0] === 'docs') {
                parts = parts.slice(1);
            }
            if (parts.length > 0) {
                const lastPart = parts[parts.length - 1];
                if (lastPart.includes('.') && !lastPart.startsWith('.')) {
                    parts = parts.slice(0, -1);
                }
            }
        }
        
        const newExpanded = {};
        let accumulated = '';
        
        parts.forEach((part, index) => {
            const key = index === 0 ? part : `${accumulated}/${part}`;
            accumulated = key;
            newExpanded[key] = true;
        });

        setExpandedPaths(prev => ({ ...prev, ...newExpanded }));
        
    }, [currentPath, categorized]);

    const handleFolderClick = (path) => {
        setExpandedPaths((prev) => ({
            ...prev,
            [path]: !prev[path],
        }));

        const categoryRoute = `/category/${path}`;
        if (onNavigate) {
            onNavigate(categoryRoute);
        }
        navigationObserver.notify(categoryRoute, { type: 'folder' });
    };

    const handleClick = (file) => {
        if (onNavigate) {
            onNavigate(file.route);
        }
        navigationObserver.notify(file.route, { type: 'file', file });
    };

    return {
        categorized,
        followingCategorized,
        expandedPaths,
        handleFolderClick,
        handleClick,
        loading: loading || subLoading
    };
}
