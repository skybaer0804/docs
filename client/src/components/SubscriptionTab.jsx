import { useState, useEffect } from 'preact/hooks';
import { useUserSubscriptions } from '../hooks/useUserSubscriptions';
import { useSubscription } from '../hooks/useSubscription';
import { Button } from './Button';
import './SubscriptionTab.scss';

export function SubscriptionTab({ userId }) {
  const { stats, followers, following, loading, loadList, loadStats } = useUserSubscriptions(userId);
  const { handleUnfollow, loading: subLoading } = useSubscription();
  const [activeSubTab, setActiveSubTab] = useState('following'); // 'followers' or 'following'

  useEffect(() => {
    loadList(activeSubTab);
  }, [activeSubTab, loadList]);

  const onUnfollowComplete = () => {
    loadStats();
    loadList('following');
  };

  return (
    <div className="subscription-tab">
      <div className="subscription-tab__stats">
        <div className="subscription-tab__stat-item">
          <span className="subscription-tab__stat-value">{stats.followers_count}</span>
          <span className="subscription-tab__stat-label">팔로워</span>
        </div>
        <div className="subscription-tab__stat-item">
          <span className="subscription-tab__stat-value">{stats.following_count}</span>
          <span className="subscription-tab__stat-label">팔로잉</span>
        </div>
      </div>

      <div className="subscription-tab__nav">
        <button
          className={`subscription-tab__nav-btn ${activeSubTab === 'following' ? 'subscription-tab__nav-btn--active' : ''}`}
          onClick={() => setActiveSubTab('following')}
        >
          내가 팔로잉하는 유저
        </button>
        <button
          className={`subscription-tab__nav-btn ${activeSubTab === 'followers' ? 'subscription-tab__nav-btn--active' : ''}`}
          onClick={() => setActiveSubTab('followers')}
        >
          나를 팔로워하는 유저
        </button>
      </div>

      <div className="subscription-tab__content">
        {loading ? (
          <div className="subscription-tab__loading">로딩 중...</div>
        ) : (
          <ul className="subscription-tab__list">
            {(activeSubTab === 'following' ? following : followers).length === 0 ? (
              <li className="subscription-tab__empty">리스트가 비어있습니다.</li>
            ) : (
              (activeSubTab === 'following' ? following : followers).map((u) => (
                <li key={u.id} className="subscription-tab__item">
                  <div className="subscription-tab__user-info">
                    <span className="subscription-tab__username">{u.username}</span>
                    <span className="subscription-tab__doc-title">{u.document_title || '문서 제목 없음'}</span>
                  </div>
                  {activeSubTab === 'following' && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleUnfollow(u.id, onUnfollowComplete)}
                      disabled={subLoading}
                    >
                      언팔로우
                    </Button>
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}




