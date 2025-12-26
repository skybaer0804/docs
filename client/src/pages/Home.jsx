import { DirectoryView } from '../components/DirectoryView';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { IconBook, IconUsers, IconEdit } from '@tabler/icons-preact';
import './Home.scss';

export function Home({ onNavigate }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="home-landing">
        <section className="home-landing__hero">
          <h1 className="home-landing__title">지식의 연결, 나만의 문서 공간</h1>
          <p className="home-landing__subtitle">
            문서를 작성하고, 관심 있는 유저를 구독하여 지식을 넓혀보세요.
          </p>
          <div className="home-landing__actions">
            <Button variant="primary" size="large" onClick={() => onNavigate('/register')}>
              지금 시작하기 (무료)
            </Button>
            <Button variant="secondary" size="large" onClick={() => onNavigate('/login')}>
              로그인
            </Button>
          </div>
        </section>

        <section className="home-landing__features">
          <div className="home-landing__feature">
            <IconEdit size={40} className="home-landing__feature-icon" />
            <h3>쉬운 문서 작성</h3>
            <p>마크다운 기반으로 깔끔하고 빠르게 기록하세요.</p>
          </div>
          <div className="home-landing__feature">
            <IconUsers size={40} className="home-landing__feature-icon" />
            <h3>유저 구독</h3>
            <p>영감을 주는 유저를 구독하고 소식을 받아보세요.</p>
          </div>
          <div className="home-landing__feature">
            <IconBook size={40} className="home-landing__feature-icon" />
            <h3>지식 관리</h3>
            <p>계층형 폴더 구조로 지식을 체계적으로 관리하세요.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div class="page">
      <DirectoryView currentRoute="/" onNavigate={onNavigate} />
    </div>
  );
}
