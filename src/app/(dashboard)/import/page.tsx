import { LedgerImportWidget } from '@/features/ledger-import';

export default function ImportPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-black tracking-tight text-foreground">데이터 불러오기</h1>
                <p className="text-sm text-muted-foreground font-medium">
                    엑셀 파일을 업로드하여 기존 가계부 내역을 대량으로 추가할 수 있습니다.
                </p>
            </div>
            
            <div className="tactile-panel p-6">
                <LedgerImportWidget />
            </div>
        </div>
    );
}
