import { render } from 'preact';
import { App } from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { StudyTimerProvider } from './contexts/StudyTimerContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './query/queryClient';
import './style.scss';

render(
    <ToastProvider>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <StudyTimerProvider>
                    <App />
                </StudyTimerProvider>
            </AuthProvider>
        </QueryClientProvider>
    </ToastProvider>,
    document.getElementById('app')
);

