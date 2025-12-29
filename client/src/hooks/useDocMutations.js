import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDoc, updateDoc, deleteDoc, moveDoc } from '../utils/api';
import { docsKeys } from '../query/queryKeys';

function safeString(value) {
  return typeof value === 'string' ? value : '';
}

export function useCreateDocMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables) => {
      // variables가 { data } 형태로 올 수도 있고, 기존처럼 payload 자체로 올 수도 있음
      const payload = variables?.data ? variables.data : variables;
      return createDoc(payload);
    },
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: docsKeys.tree() });

      // 생성된 문서/폴더가 응답에 path를 포함하면, content 캐시도 미리 채워둠
      const createdPath = safeString(data?.path);
      if (createdPath) {
        queryClient.setQueryData(docsKeys.content(createdPath), data);
      }

      if (options.onSuccess) {
        await options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

export function useUpdateDocMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables) => updateDoc(variables.id, variables.data),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: docsKeys.tree() });

      // 수정된 문서가 응답에 path를 포함하면, content 캐시를 최신으로 갱신
      const updatedPath = safeString(variables?.path) || safeString(data?.path) || safeString(variables?.data?.path);
      if (updatedPath) {
        queryClient.setQueryData(docsKeys.content(updatedPath), data);
        await queryClient.invalidateQueries({ queryKey: docsKeys.content(updatedPath) });
      }

      if (options.onSuccess) {
        await options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

export function useDeleteDocMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables) => deleteDoc(variables.id),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: docsKeys.tree() });

      // 삭제된 문서의 path를 알고 있다면, content 캐시에서 제거
      const deletedPath = safeString(variables?.path);
      if (deletedPath) {
        queryClient.removeQueries({ queryKey: docsKeys.content(deletedPath) });
      }

      if (options.onSuccess) {
        await options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

export function useMoveDocMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables) => {
      const payload = variables?.data ? variables.data : variables;
      return moveDoc(payload);
    },
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: docsKeys.tree() });

      const oldPath = safeString(data?.oldPath || variables?.oldPath || variables?.data?.oldPath);
      const newPath = safeString(data?.newPath || variables?.newPath || variables?.data?.newPath);

      // 이동은 path가 바뀌므로 이전 path의 content 캐시는 제거, 새 path는 무효화(재조회 유도)
      if (oldPath) {
        queryClient.removeQueries({ queryKey: docsKeys.content(oldPath) });
      }
      if (newPath) {
        await queryClient.invalidateQueries({ queryKey: docsKeys.content(newPath) });
      }

      if (options.onSuccess) {
        await options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

export function useCreateFolderMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, parentPath, visibility_type = 'public' }) =>
      createDoc({
        type: 'DIRECTORY',
        parent_path: parentPath,
        name,
        content: null,
        visibility_type,
      }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: docsKeys.tree() });

      const createdPath = safeString(data?.path);
      if (createdPath) {
        queryClient.setQueryData(docsKeys.content(createdPath), data);
      }

      if (options.onSuccess) {
        await options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}
