import Link from 'next/link';

export function Logo() {
    return (
        <Link href="/" className="hover:opacity-80 transition-opacity">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                BrightGlory 가계부
            </span>
        </Link>
    );
}
