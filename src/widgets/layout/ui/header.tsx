import { UserBadge } from './user-badge';
import { ModeToggle } from '@/shared/ui/mode-toggle';

interface HeaderProps {
    userEmail?: string | null;
}

export function Header({ userEmail }: HeaderProps) {
    return (
        <header className="h-20 flex items-center justify-between px-8 border-none bg-background/80 sticky top-0 z-40 [box-shadow:var(--tactile-shadow-sm)]">
            <div className="flex items-center gap-4">
                {/* Page Title or Breadcrumb will go here later */}
                <h2 className="text-sm font-medium text-muted-foreground italic">Dashboard Overview</h2>
            </div>

            <div className="flex items-center gap-4">
                <ModeToggle />
                <div className="h-4 w-[1px] bg-border/50 mx-2" />
                <UserBadge email={userEmail} />
            </div>
        </header>
    );
}
