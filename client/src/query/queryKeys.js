export const docsKeys = {
  all: ['docs'],
  tree: () => [...docsKeys.all, 'tree'],
  content: (path) => [...docsKeys.all, 'content', path],
};

export const authKeys = {
  all: ['auth'],
  me: () => [...authKeys.all, 'me'],
};
