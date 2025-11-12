import { DirectoryView } from '../components/DirectoryView';
import { Breadcrumb } from '../components/Breadcrumb';

export function Home({ onNavigate }) {
    return (
        <div class="page">
            <Breadcrumb currentRoute="/" onNavigate={onNavigate} />
            <DirectoryView currentRoute="/" onNavigate={onNavigate} />
        </div>
    );
}
