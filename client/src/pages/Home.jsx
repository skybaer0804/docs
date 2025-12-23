import { DirectoryView } from '../components/DirectoryView';

export function Home({ onNavigate }) {
    return (
        <div class="page">
            <DirectoryView currentRoute="/" onNavigate={onNavigate} />
        </div>
    );
}
