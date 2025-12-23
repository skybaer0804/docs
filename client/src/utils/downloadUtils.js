/**
 * 파일 다운로드 유틸리티 함수
 */

/**
 * 파일을 다운로드합니다.
 * @param {string} filePath - 다운로드할 파일의 경로 (예: /docs/style/README.md)
 * @param {string} fileName - 다운로드될 파일명 (예: README.md)
 */
export async function downloadFile(filePath, fileName) {
    try {
        // 파일 내용 가져오기
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        const content = await response.text();

        // Blob 생성
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });

        // 다운로드 링크 생성
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';

        // DOM에 추가하고 클릭
        document.body.appendChild(link);
        link.click();

        // 정리
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading file:', error);
        alert('파일 다운로드 중 오류가 발생했습니다.');
    }
}
