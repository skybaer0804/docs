import { createContext } from 'preact';
import { useContext } from 'preact/hooks';

export const SidebarContext = createContext(null);

export function useSidebar() {
    return useContext(SidebarContext);
}
