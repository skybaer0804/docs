import { useState, useEffect } from 'preact/hooks';
import { useUserSubscriptions } from '../hooks/useUserSubscriptions';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionTab } from '../components/SubscriptionTab';
import { UserSearchModal } from '../components/UserSearchModal';
import { IconUserPlus } from '@tabler/icons-preact';
import './SubscriptionManagementPage.scss';

export function SubscriptionManagementPage({ onNavigate }) {
  const { user, loading: authLoading } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  if (authLoading) return <div className="loading">로딩 중...</div>;
  if (!user) {
    if (onNavigate) onNavigate('/login');
    return null;
  }

  return (
    <div className="subscription-mgmt-page">
      <header className="subscription-mgmt-page__header">
        <div className="subscription-mgmt-page__header-content">
          <h1 className="subscription-mgmt-page__title">구독 관리</h1>
          <p className="subscription-mgmt-page__description">
            나를 팔로우하는 유저와 내가 팔로잉하는 유저를 관리할 수 있습니다.
          </p>
        </div>
        <button className="subscription-mgmt-page__search-btn" onClick={() => setIsSearchOpen(true)}>
          <IconUserPlus size={18} /> 유저 찾기
        </button>
      </header>

      <div className="subscription-mgmt-page__content">
        <SubscriptionTab userId={user.id} />
      </div>

      <UserSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onFollowSuccess={() => {
          // 필요 시 데이터 갱신 로직 추가
        }}
      />
    </div>
  );
}

