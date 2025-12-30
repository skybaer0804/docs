import { getParentPathFromCurrentPath } from './docManagement';

describe('getParentPathFromCurrentPath', () => {
  test('should return /docs if currentPath is empty or null', () => {
    expect(getParentPathFromCurrentPath('')).toBe('/docs');
    expect(getParentPathFromCurrentPath(null)).toBe('/docs');
    expect(getParentPathFromCurrentPath(undefined)).toBe('/docs');
  });

  test('should return /docs if currentPath is root', () => {
    expect(getParentPathFromCurrentPath('/')).toBe('/docs');
  });

  test('should return same path if it is a directory in /docs', () => {
    expect(getParentPathFromCurrentPath('/docs/folder1')).toBe('/docs/folder1');
  });

  test('should return parent path if it is a file in /docs', () => {
    expect(getParentPathFromCurrentPath('/docs/test.md')).toBe('/docs');
    expect(getParentPathFromCurrentPath('/docs/folder1/test.md')).toBe('/docs/folder1');
  });

  test('should handle /category/ paths correctly', () => {
    expect(getParentPathFromCurrentPath('/category/folder1')).toBe('/docs/folder1');
    expect(getParentPathFromCurrentPath('/category/folder1/test.md')).toBe('/docs/folder1');
  });

  test('should handle paths without /docs prefix', () => {
    expect(getParentPathFromCurrentPath('folder1/test.md')).toBe('/docs/folder1');
    expect(getParentPathFromCurrentPath('/folder1/test.md')).toBe('/docs/folder1');
  });

  test('should return /docs for root level files', () => {
    expect(getParentPathFromCurrentPath('/docs/root-file.md')).toBe('/docs');
    expect(getParentPathFromCurrentPath('/category/root-file.md')).toBe('/docs');
  });
});


