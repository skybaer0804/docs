import {
  normalizePath,
  routeToDocsPath,
  docsPathToCategoryRoute,
  getParentDocsPath,
  isInvalidDrop,
  mapRouteAfterMove,
} from './dndUtils';

describe('dndUtils', () => {
  test('normalizePath should collapse duplicate slashes', () => {
    expect(normalizePath('/docs//A///B')).toBe('/docs/A/B');
  });

  test('routeToDocsPath should map routes to /docs paths', () => {
    expect(routeToDocsPath('/')).toBe('/docs');
    expect(routeToDocsPath('/docs/A/B')).toBe('/docs/A/B');
    expect(routeToDocsPath('/category/A/B')).toBe('/docs/A/B');
    expect(routeToDocsPath('/login')).toBe('');
  });

  test('docsPathToCategoryRoute should map /docs to category route', () => {
    expect(docsPathToCategoryRoute('/docs')).toBe('/');
    expect(docsPathToCategoryRoute('/docs/A/B')).toBe('/category/A/B');
    expect(docsPathToCategoryRoute('/x')).toBe('');
  });

  test('getParentDocsPath should return parent under /docs', () => {
    expect(getParentDocsPath('/docs')).toBe('/docs');
    expect(getParentDocsPath('/docs/A')).toBe('/docs');
    expect(getParentDocsPath('/docs/A/B')).toBe('/docs/A');
  });

  test('isInvalidDrop should prevent moving directory into itself/descendant', () => {
    expect(isInvalidDrop({ dragPath: '/docs/A', dragType: 'DIRECTORY', targetParentPath: '/docs/A' })).toBe(true);
    expect(isInvalidDrop({ dragPath: '/docs/A', dragType: 'DIRECTORY', targetParentPath: '/docs/A/B' })).toBe(true);
    expect(isInvalidDrop({ dragPath: '/docs/A', dragType: 'DIRECTORY', targetParentPath: '/docs/B' })).toBe(false);
  });

  test('mapRouteAfterMove should map current route when it is affected', () => {
    expect(
      mapRouteAfterMove({ currentRoute: '/docs/A/file.md', oldDocsPath: '/docs/A', newDocsPath: '/docs/B' }),
    ).toBe('/docs/B/file.md');

    expect(
      mapRouteAfterMove({ currentRoute: '/category/A', oldDocsPath: '/docs/A', newDocsPath: '/docs/B' }),
    ).toBe('/category/B');

    expect(
      mapRouteAfterMove({ currentRoute: '/docs/C', oldDocsPath: '/docs/A', newDocsPath: '/docs/B' }),
    ).toBe(null);
  });
});


