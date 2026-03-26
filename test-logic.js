const fs = require('fs');

const testDbTxs = [
    { id: '1', date: '2026-02-14', amount: -1900, description: '주식회사 카카오' },
    { id: '2', date: '2026-02-13', amount: -47700, description: '카카오페이' },
    { id: '3', date: '2026-02-10', amount: -10300, description: '카카오T일반택시(법인)_4' },
    { id: '4', date: '2026-02-14', amount: -1900, description: '주식회사 카카오' }, // Duplicate instance test
    { id: '5', date: '2026-02-11', amount: -10800, description: '주식회사 카카오' }
];

const kakaoPayRows = [
    { date: '2026.02.14', time: '12:00:00', type: '[-] 결제', merchant: '주식회사 카카오', amount: 1900, currency: 'KRW' },
    { date: '2026.02.13', time: '12:00:00', type: '[-] 결제', merchant: '정광준', amount: 47700, currency: 'KRW' },
    { date: '2026.02.10', time: '12:00:00', type: '[-] 결제', merchant: '카카오모빌리티', amount: 10300, currency: 'KRW' },
    { date: '2026.02.14', time: '18:00:00', type: '[-] 결제', merchant: '주식회사 카카오', amount: 1900, currency: 'KRW' }, // Duplicate
    { date: '2026.02.11', time: '09:00:00', type: '[-] 결제', merchant: '주식회사 카카오', amount: 10800, currency: 'KRW' }
];

const results = [];
for (const tx of testDbTxs) {
    const desc = tx.description || '';
    const isKakaoName = desc.includes('카카오') && !desc.includes('뱅크');
    if (!isKakaoName) continue;

    const matches = kakaoPayRows.filter((row) => {
        const matchAmount = Math.abs(row.amount) === Math.abs(tx.amount);
        const formattedRowDate = row.date.replace(/\./g, '-');
        
        const txDate = new Date(tx.date);
        const rowDate = new Date(formattedRowDate);

        const txZero = new Date(Date.UTC(txDate.getFullYear(), txDate.getMonth(), txDate.getDate()));
        const rowZero = new Date(Date.UTC(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate()));
        
        const diffTime = Math.abs(txZero.getTime() - rowZero.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        return matchAmount && diffDays <= 1;
    });

    if (matches.length > 0) {
        results.push({ transactionId: tx.id, matchedCount: matches.length, amount: tx.amount });
    }
}
console.log("Total DB Txs:", testDbTxs.length);
console.log("Successfully Matched Txs:", results.length);
console.log("Results Map:", results);
