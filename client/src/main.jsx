import { render } from 'preact';
import { App } from './App';
import { AuthProvider } from './contexts/AuthContext';
import './style.scss';

render(
    <AuthProvider>
        <App />
    </AuthProvider>,
    document.getElementById('app')
);

