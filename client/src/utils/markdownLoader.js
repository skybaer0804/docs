import docsList from '../docs-list.json';
import { devLog, devWarn, devError } from './logger';

/**
 * 문서 파일 목록을 반환합니다.
 * @returns {Object} 파일 목록과 카테고리화된 구조
 */
export function getMarkdownFiles() {
    return docsList;
}

/**
 * 마크다운 파일의 내용을 가져옵니다.
 * UTF-8 인코딩을 명시적으로 처리하여 한글 등 특수문자 깨짐 문제를 방지합니다.
 * BOM(Byte Order Mark) 제거 및 Content-Type 헤더 확인을 포함합니다.
 *
 * @param {string} filePath - 가져올 파일의 경로 (예: /docs/Spark/Client/README.md)
 * @returns {Promise<string|null>} 파일 내용 또는 null (실패 시)
 */
export async function getMarkdownContent(filePath) {
    try {
        // 캐시 방지를 위해 타임스탬프 추가 (개발 모드에서만)
        const cacheBuster = import.meta.env.DEV ? `?t=${Date.now()}` : '';
        const fullPath = filePath + cacheBuster;

        const response = await fetch(fullPath, {
            headers: {
                Accept: 'text/plain, text/markdown, text/*',
            },
            cache: 'no-store', // 캐시 무시하여 항상 최신 파일 로드 및 인코딩 문제 방지
        });

        if (!response.ok) {
            devError(`파일 로드 실패: ${filePath} (상태 코드: ${response.status})`);
            return null;
        }

        // Content-Type 확인 (디버깅용)
        const contentType = response.headers.get('content-type') || '';
        const isReadme = filePath.toLowerCase().includes('readme');

        if (isReadme) {
            devLog(`[DEBUG] README.md 로드: ${filePath}`);
            devLog(`[DEBUG] Content-Type: ${contentType}`);
        }

        // 파일 인코딩 자동 감지 및 디코딩
        const arrayBuffer = await response.arrayBuffer();

        if (isReadme) {
            devLog(`[DEBUG] 파일 크기: ${arrayBuffer.byteLength} bytes`);
            devLog(
                `[DEBUG] 첫 10바이트:`,
                Array.from(new Uint8Array(arrayBuffer.slice(0, 10)))
                    .map((b) => `0x${b.toString(16).padStart(2, '0')}`)
                    .join(' ')
            );
        }

        // BOM(Byte Order Mark) 확인하여 인코딩 감지
        const bomBytes = new Uint8Array(arrayBuffer.slice(0, 4));
        let encoding = 'utf-8'; // 기본값
        let dataToDecode = arrayBuffer;
        let offset = 0;

        // UTF-16 LE BOM: 0xFF 0xFE
        if (bomBytes[0] === 0xff && bomBytes[1] === 0xfe) {
            encoding = 'utf-16le';
            offset = 2;
            if (isReadme) {
                devLog(`[DEBUG] UTF-16 LE BOM 감지됨`);
            }
        }
        // UTF-16 BE BOM: 0xFE 0xFF
        else if (bomBytes[0] === 0xfe && bomBytes[1] === 0xff) {
            encoding = 'utf-16be';
            offset = 2;
            if (isReadme) {
                devLog(`[DEBUG] UTF-16 BE BOM 감지됨`);
            }
        }
        // UTF-8 BOM: 0xEF 0xBB 0xBF
        else if (bomBytes[0] === 0xef && bomBytes[1] === 0xbb && bomBytes[2] === 0xbf) {
            encoding = 'utf-8';
            offset = 3;
            if (isReadme) {
                devLog(`[DEBUG] UTF-8 BOM 감지됨`);
            }
        }
        // UTF-32 LE BOM: 0xFF 0xFE 0x00 0x00
        else if (bomBytes[0] === 0xff && bomBytes[1] === 0xfe && bomBytes[2] === 0x00 && bomBytes[3] === 0x00) {
            encoding = 'utf-32le';
            offset = 4;
            if (isReadme) {
                devLog(`[DEBUG] UTF-32 LE BOM 감지됨`);
            }
        }

        dataToDecode = offset > 0 ? arrayBuffer.slice(offset) : arrayBuffer;

        if (isReadme) {
            devLog(`[DEBUG] 감지된 인코딩: ${encoding}, BOM 오프셋: ${offset}`);
        }

        // TextDecoder 옵션: fatal을 false로 설정하여 잘못된 바이트 시퀀스도 처리
        // ignoreBOM을 true로 설정하여 BOM을 무시하고 수동으로 처리
        const textDecoder = new TextDecoder(encoding, {
            fatal: false,
            ignoreBOM: true,
        });
        let content = textDecoder.decode(dataToDecode);

        // 추가 안전장치: 문자 레벨에서 BOM 제거 (혹시 모를 경우 대비)
        if (content.charCodeAt(0) === 0xfeff) {
            content = content.slice(1);
        }

        if (isReadme) {
            devLog(`[DEBUG] 디코딩된 내용 길이: ${content.length} 문자`);
            devLog(`[DEBUG] 첫 100자:`, content.substring(0, 100));
        }

        return content;
    } catch (error) {
        devError(`마크다운 파일 로드 중 오류 발생: ${filePath}`, error);
        return null;
    }
}
