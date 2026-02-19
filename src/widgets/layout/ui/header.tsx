import { Logo } from './logo';
import { UserBadge } from './user-badge';
import { NavActions } from './nav-actions';
import { ContextSwitcher } from './context-switcher';

interface HeaderProps {
    userEmail?: string | null;
    defaultMode?: 'personal' | 'total' | 'business';
}

export function Header({ userEmail, defaultMode = 'personal' }: HeaderProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between px-4 max-w-7xl mx-auto">
                {/* Left: Logo & Context Switcher */}
                <div className="flex items-center gap-4">
                    <Logo />
                    <ContextSwitcher defaultMode={defaultMode} />
                </div>

                {/* Right: User Profile & Navigation & Logout */}
                <div className="flex items-center gap-3">
                    <UserBadge email={userEmail} />
                    <NavActions />
                </div>
            </div>
        </header>
    );
}
