import { LedgerImportWidget } from '@/features/ledger-import';

export default function ImportPage() {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6">Excel Data Import</h1>
            <p className="text-muted-foreground mb-8">
                Upload your transaction Excel files here (xls, xlsx).
                This will parse and restore your ledger data.
            </p>
            <div className="tactile-panel p-6">
                <LedgerImportWidget />
            </div>
        </div>
    );
}
