import { useState, useEffect } from 'preact/hooks';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { updateProfile } from '../utils/api';
import { Button } from '../components/Button';
import { SubscriptionTab } from '../components/SubscriptionTab';
import { PushNotificationSetting } from '../components/PushNotificationSetting';
import './ProfilePage.scss';

/**
 * 프로필 페이지
 * document_title, personal_link 편집 가능 및 구독 관리 기능
 */
export function ProfilePage({ onNavigate }) {
  const { user, loading: authLoading, signIn } = useAuth();
  const { showSuccess, showError } = useToast();

  const [documentTitle, setDocumentTitle] = useState('');
  const [personalLink, setPersonalLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 사용자 정보 로드
  useEffect(() => {
    if (user) {
      setDocumentTitle(user.document_title || '');
      setPersonalLink(user.personal_link || '');
    }
  }, [user]);

  // 인증 체크
  if (authLoading) return <div>Loading...</div>;
  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-page__error">로그인이 필요합니다.</div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await updateProfile({
        document_title: documentTitle.trim() || null,
        personal_link: personalLink.trim() || null,
      });

      showSuccess('프로필이 업데이트되었습니다.');

      // 사용자 정보 업데이트를 위해 페이지 새로고침
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError(err.message);
      showError(err.message || '프로필 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onNavigate) {
      onNavigate('/');
    } else {
      window.history.back();
    }
  };

  return (
    <div className="profile-page">
      <h1 className="profile-page__title">내 정보 설정</h1>

      {error && <div className="profile-page__error">{error}</div>}

      <div className="profile-page__section">
        <h2 className="profile-page__section-title">알림 설정</h2>
        <PushNotificationSetting />
      </div>

      <div className="profile-page__section">
        <h2 className="profile-page__section-title">구독 관리</h2>
        <SubscriptionTab userId={user.id} />
      </div>

      <form onSubmit={handleSubmit} className="profile-page__form">
        <div className="profile-page__form-group">
          <label htmlFor="documentTitle">문서 제목</label>
          <input
            id="documentTitle"
            type="text"
            value={documentTitle}
            onInput={(e) => setDocumentTitle(e.target.value)}
            placeholder="예: Nodnjs Documentation"
            className="profile-page__input"
          />
          <span className="profile-page__helper">브레드크럼에 표시될 제목입니다. 비워두면 기본 제목이 표시됩니다.</span>
        </div>

        <div className="profile-page__form-group">
          <label htmlFor="personalLink">개인 링크</label>
          <input
            id="personalLink"
            type="url"
            value={personalLink}
            onInput={(e) => setPersonalLink(e.target.value)}
            placeholder="예: https://skybear.notion.site/..."
            className="profile-page__input"
          />
          <span className="profile-page__helper">브레드크럼 제목 옆 외부 링크 아이콘을 클릭하면 이동할 URL입니다.</span>
        </div>

        <div className="profile-page__footer">
          <Button type="button" variant="secondary" onClick={handleCancel} disabled={loading}>
            취소
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            저장하기
          </Button>
        </div>
      </form>
    </div>
  );
}
