import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDoc, updateDoc, deleteDoc, moveDoc } from '../utils/api';
import { docsKeys } from '../query/queryKeys';

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
      if (variables.id) {
        await queryClient.invalidateQueries({ queryKey: docsKeys.detail(variables.id) });
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

      if (variables.id) {
        await queryClient.invalidateQueries({ queryKey: docsKeys.detail(variables.id) });
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
    mutationFn: ({ name, parent_id, visibility_type = 'public' }) =>
      createDoc({
        type: 'DIRECTORY',
        parent_id,
        name,
        content: null,
        visibility_type,
      }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: docsKeys.tree() });

      if (options.onSuccess) {
        await options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}
