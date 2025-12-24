import { render } from 'preact';
import { App } from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './query/queryClient';
import './style.scss';

render(
    <ToastProvider>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <App />
            </AuthProvider>
        </QueryClientProvider>
    </ToastProvider>,
    document.getElementById('app')
);

