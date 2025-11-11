import { getMarkdownFiles } from '../utils/markdownLoader';

export function Home() {
    const { files } = getMarkdownFiles();

    // 첫 번째 파일로 리다이렉트하거나 환영 메시지 표시
    if (files.length > 0) {
        // 첫 번째 파일의 경로로 리다이렉트
        return (
            <div class="page">
                <div style="text-align: center; padding: 40px;">
                    <h1>Nodejs Documentation</h1>
                    <p style="margin-top: 20px; color: #666;">왼쪽 사이드바에서 문서를 선택해주세요.</p>
                </div>
            </div>
        );
    }

    return (
        <div class="page">
            <div style="text-align: center; padding: 40px;">
                <h1>Nodejs Documentation</h1>
                <p style="margin-top: 20px; color: #666;">문서가 없습니다.</p>
            </div>
        </div>
    );
}
