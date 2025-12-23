import { jest } from '@jest/globals';
import { resolvePath, findTargetFile, MarkdownParser } from './MarkdownLogic';

describe('MarkdownLogic (TDD)', () => {
    describe('resolvePath', () => {
        it('should return absolute path as is', () => {
            expect(resolvePath('/docs/a.md', '/docs/b.md')).toBe('/docs/b.md');
        });

        it('should resolve simple relative path', () => {
            expect(resolvePath('/docs/a/index.md', './b.md')).toBe('/docs/a/b.md');
        });

        it('should resolve parent directory reference (..)', () => {
            expect(resolvePath('/docs/a/b/index.md', '../c.md')).toBe('/docs/a/c.md');
        });

        it('should handle complex relative paths', () => {
            expect(resolvePath('/docs/frontend/react/hooks.md', '../../backend/node.md')).toBe('/docs/backend/node.md');
        });
    });

    describe('findTargetFile', () => {
        const files = [
            { route: '/docs/guide', path: '/docs/guide.md' },
            { route: '/docs/api', path: '/docs/api.md' },
        ];

        it('should find file by exact route match', () => {
            const result = findTargetFile(files, '/docs/guide');
            expect(result).toEqual(files[0]);
        });

        it('should find file by appending .md extension if not found', () => {
            const mockFiles = [{ route: '/docs/guide.md' }];
            const result = findTargetFile(mockFiles, '/docs/guide');
            expect(result).toEqual(mockFiles[0]);
        });

        it('should return null if file not found', () => {
            const result = findTargetFile(files, '/docs/unknown');
            expect(result).toBeNull();
        });
    });

    describe('MarkdownParser', () => {
        let mockMarked;
        let mockRenderer;

        beforeEach(() => {
            // Mock Renderer
            mockRenderer = {
                link: null,
                table: null,
            };

            // Mock marked library
            mockMarked = {
                Renderer: jest.fn(() => mockRenderer),
                setOptions: jest.fn(),
                parse: jest.fn((content) => `parsed-${content}`),
            };
        });

        it('should throw error if marked library is not provided', () => {
            expect(() => new MarkdownParser()).toThrow('marked library is required');
        });

        it('should initialize with provided marked library', () => {
            new MarkdownParser(mockMarked);
            expect(mockMarked.Renderer).toHaveBeenCalled();
            expect(mockMarked.setOptions).toHaveBeenCalled();
        });

        it('should parse content using marked.parse', () => {
            const parser = new MarkdownParser(mockMarked);
            const result = parser.parse('test content');
            expect(mockMarked.parse).toHaveBeenCalledWith('test content');
            expect(result).toBe('parsed-test content');
        });

        it('should configure custom renderer for links', () => {
            new MarkdownParser(mockMarked);
            // Verify link renderer is set
            expect(typeof mockRenderer.link).toBe('function');

            // Test external link
            const externalLink = mockRenderer.link('https://google.com', 'Google', 'Link');
            expect(externalLink).toContain('target="_blank"');

            // Test internal link
            const internalLink = mockRenderer.link('about.md', 'About', 'Link');
            expect(internalLink).toContain('data-href="about.md"');
            expect(internalLink).toContain('javascript:void(0)');
        });
    });
});
