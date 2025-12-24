import { useState, useEffect } from 'preact/hooks';
import { useAuth } from '../contexts/AuthContext';
import { fetchDocContent, createDoc, updateDoc } from '../utils/api';
import { route } from 'preact-router';
import './EditorPage.scss';

/**
 * 문서 작성/수정 페이지
 * props:
 *  - mode: 'create' | 'edit'
 *  - path: 수정 시 문서 경로 (URL)
 */
export function EditorPage({ mode = 'create', path }) {
    const { user, loading: authLoading, supabase } = useAuth();
    
    // 폼 상태
    const [title, setTitle] = useState('');
    const [parentPath, setParentPath] = useState('/docs');
    const [content, setContent] = useState('# 제목\n\n내용을 입력하세요.');
    const [isPublic, setIsPublic] = useState(true);
    const [docId, setDocId] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 수정 모드일 때 데이터 로드
    useEffect(() => {
        if (mode === 'edit' && path) {
            setLoading(true);
            fetchDocContent(path)
                .then(doc => {
                    if (doc) {
                        setDocId(doc.id);
                        setTitle(doc.name.replace('.md', ''));
                        setContent(doc.content || '');
                        setIsPublic(doc.is_public);
                        // 부모 경로는 path에서 추출
                        const parts = doc.path.split('/');
                        parts.pop(); // 파일명 제거
                        setParentPath(parts.join('/'));
                    } else {
                        setError('문서를 찾을 수 없습니다.');
                    }
                })
                .catch(err => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [mode, path]);

    // 인증 체크
    if (authLoading) return <div>Loading auth...</div>;
    if (!user) {
        return <div className="editor-error">권한이 없습니다. 관리자만 접근 가능합니다.</div>;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Supabase 세션에서 토큰 가져오기
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (mode === 'create') {
                const name = `${title}.md`;
                await createDoc({
                    type: 'FILE',
                    parent_path: parentPath,
                    name,
                    content,
                    is_public: isPublic
                }, token);
                
                alert('문서가 생성되었습니다.');
                route(`${parentPath}/${name}`.replace('//', '/')); // 생성된 페이지로 이동
            } else {
                await updateDoc(docId, {
                    content,
                    is_public: isPublic,
                    name: `${title}.md` // 제목 수정 시 이름도 변경
                }, token);
                
                alert('문서가 수정되었습니다.');
                route(path); // 원래 페이지로 이동
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="editor-page">
            <h1>{mode === 'create' ? '새 문서 작성' : '문서 수정'}</h1>
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit} className="editor-form">
                <div className="form-row">
                    <div className="form-group">
                        <label>제목 (파일명)</label>
                        <input 
                            type="text" 
                            value={title} 
                            onInput={e => setTitle(e.target.value)} 
                            required 
                            placeholder="예: guide"
                        />
                        <span className="helper">.md 확장자는 자동 추가됩니다.</span>
                    </div>
                    
                    {mode === 'create' && (
                        <div className="form-group">
                            <label>상위 폴더 경로</label>
                            <input 
                                type="text" 
                                value={parentPath} 
                                onInput={e => setParentPath(e.target.value)} 
                                required 
                                placeholder="예: /docs/api"
                            />
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label>공개 여부</label>
                    <div className="checkbox-wrapper">
                        <input 
                            type="checkbox" 
                            checked={isPublic} 
                            onChange={e => setIsPublic(e.target.checked)} 
                        />
                        <span>전체 공개 (로그인 없이 열람 가능)</span>
                    </div>
                </div>

                <div className="form-group editor-area">
                    <label>내용 (Markdown)</label>
                    <textarea 
                        value={content} 
                        onInput={e => setContent(e.target.value)} 
                        required
                    ></textarea>
                </div>

                <div className="button-group">
                    <button type="button" onClick={() => window.history.back()} disabled={loading}>취소</button>
                    <button type="submit" className="primary" disabled={loading}>
                        {loading ? '저장 중...' : '저장하기'}
                    </button>
                </div>
            </form>
        </div>
    );
}




