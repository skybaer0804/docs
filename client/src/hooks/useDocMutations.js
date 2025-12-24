import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDoc, updateDoc, deleteDoc } from '../utils/api';
import { docsKeys } from '../query/queryKeys';

export function useCreateDocMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createDoc(data),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: docsKeys.tree() });
      if (options.onSuccess) {
        await options.onSuccess(...args);
      }
    },
    ...options,
  });
}

export function useUpdateDocMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateDoc(id, data),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: docsKeys.tree() });
      if (options.onSuccess) {
        await options.onSuccess(...args);
      }
    },
    ...options,
  });
}

export function useDeleteDocMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }) => deleteDoc(id),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: docsKeys.tree() });
      if (options.onSuccess) {
        await options.onSuccess(...args);
      }
    },
    ...options,
  });
}

export function useCreateFolderMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, parentPath, isPublic = true }) =>
      createDoc({
        type: 'DIRECTORY',
        parent_path: parentPath,
        name,
        content: null,
        is_public: isPublic,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: docsKeys.tree() });
      if (options.onSuccess) {
        await options.onSuccess(...args);
      }
    },
    ...options,
  });
}


