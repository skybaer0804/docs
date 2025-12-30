export const docsKeys = {
  all: ['docs'],
  tree: () => [...docsKeys.all, 'tree'],
  userTree: (userId) => [...docsKeys.all, 'tree', 'user', userId],
  content: (path) => [...docsKeys.all, 'content', path],
  detail: (id) => [...docsKeys.all, 'detail', id],
};

export const authKeys = {
  all: ['auth'],
  me: () => [...authKeys.all, 'me'],
};

export const subKeys = {
  all: ['subscriptions'],
  followingNodes: () => [...subKeys.all, 'following-nodes'],
  stats: (userId) => [...subKeys.all, 'stats', userId],
  list: (userId, type) => [...subKeys.all, 'list', userId, type],
};