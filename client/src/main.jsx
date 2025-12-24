import { render } from 'preact';
import { App } from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import './style.scss';

render(
    <ToastProvider>
        <AuthProvider>
            <App />
        </AuthProvider>
    </ToastProvider>,
    document.getElementById('app')
);

