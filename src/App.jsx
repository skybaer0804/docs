import { Router } from 'preact-router';
import { useState } from 'preact/hooks';
import { LayoutContainer } from './containers/LayoutContainer';
import { Home } from './pages/Home';
import { DocPageContainer } from './containers/DocPageContainer';
import { route } from 'preact-router';

export function App() {
    const [currentPath, setCurrentPath] = useState('/');

    const handleRoute = (e) => {
        setCurrentPath(e.url);
    };

    const handleNavigate = (path) => {
        route(path);
    };

    return (
        <LayoutContainer currentPath={currentPath} onNavigate={handleNavigate}>
            <Router onChange={handleRoute}>
                <Home path="/" onNavigate={handleNavigate} />
                <DocPageContainer path="/category/:path*" />
                <DocPageContainer path="/docs/:path*" />
                <DocPageContainer path="/setup" />
            </Router>
        </LayoutContainer>
    );
}
