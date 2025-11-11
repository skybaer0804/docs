import { Router } from 'preact-router';
import { useState } from 'preact/hooks';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { DocPage } from './pages/DocPage';
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
        <Layout currentPath={currentPath} onNavigate={handleNavigate}>
            <Router onChange={handleRoute}>
                <Home path="/" />
                <DocPage path="/docs/:path*" />
                <DocPage path="/setup" />
            </Router>
        </Layout>
    );
}
