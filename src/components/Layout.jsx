import { DirectoryTree } from './DirectoryTree';

export function Layout({ children, currentPath, onNavigate }) {
    return (
        <div class="layout">
            <div class="container">
                <header class="header">
                    <h1>Documentation</h1>
                </header>
                <div class="content-wrapper">
                    <aside class="sidebar">
                        <DirectoryTree currentPath={currentPath} onNavigate={onNavigate} />
                    </aside>
                    <main class="main-content">{children}</main>
                </div>
            </div>
        </div>
    );
}
