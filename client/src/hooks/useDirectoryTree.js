import { useState, useEffect, useMemo, useCallback, useRef } from 'preact/hooks';
import { buildDirectoryTree } from '../utils/treeUtils';
import { navigationObserver } from '../observers/NavigationObserver';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { docsKeys, subKeys } from '../query/queryKeys';
import { useDocsTreeQuery } from './useDocsTreeQuery';
import { fetchSubscriptionList, fetchUserDocs } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * DirectoryTree의 로직을 담당하는 Custom Hook
 */
export function useDirectoryTree(currentPath, onNavigate) {
    const [expandedPaths, setExpandedPaths] = useState({});
    const [followingTrees, setFollowingTrees] = useState({}); // userId -> tree
    const [loadingTrees, setLoadingTrees] = useState({}); // userId -> boolean
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const lastPathRef = useRef('');
    
    // 내 문서 트리
    const { data: nodes = [], isLoading: loading } = useDocsTreeQuery();
    const categorized = useMemo(() => buildDirectoryTree(nodes), [nodes]);

    // 내가 팔로잉하는 유저 리스트 (TanStack Query 적용하여 실시간 동기화 지원)
    const { data: followingUsers = [] } = useQuery({
        queryKey: subKeys.list(user?.id, 'following'),
        queryFn: () => fetchSubscriptionList(user.id, 'following'),
        enabled: !!user?.id,
        staleTime: 30 * 1000,
    });

    // 특정 유저의 트리 로드 (Lazy Load)
    const loadUserTree = useCallback(async (targetUserId) => {
        if (followingTrees[targetUserId] || loadingTrees[targetUserId]) return;

        setLoadingTrees(prev => ({ ...prev, [targetUserId]: true }));
        try {
            const userNodes = await fetchUserDocs(targetUserId);
            const tree = buildDirectoryTree(userNodes);
            setFollowingTrees(prev => ({ ...prev, [targetUserId]: tree }));
        } catch (err) {
            console.error('Failed to load user tree:', err);
        } finally {
            setLoadingTrees(prev => ({ ...prev, [targetUserId]: false }));
        }
    }, [followingTrees, loadingTrees]);

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
                        // 구독 관련 정보도 갱신이 필요할 수 있으나, 여기서는 필요시 추가
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
        if (!currentPath || currentPath === lastPathRef.current || Object.keys(categorized).length === 0) return;
        lastPathRef.current = currentPath;

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

    const handleUserClick = (targetUserId) => {
        const path = `sub_${targetUserId}`;
        const isExpanding = !expandedPaths[path];
        
        setExpandedPaths(prev => ({ ...prev, [path]: !prev[path] }));
        
        if (isExpanding) {
            loadUserTree(targetUserId);
        }
    };

    return {
        categorized,
        followingUsers,
        followingTrees,
        loadingTrees,
        expandedPaths,
        handleFolderClick,
        handleUserClick,
        handleClick,
        loading: loading
    };
}
