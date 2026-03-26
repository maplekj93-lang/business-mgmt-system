import { matchKakaoTransactions } from './src/features/kakao-pay-matcher/model/matcher';

const testDbTxs = [
  { id: '1', date: '2026-02-14', amount: -1900, description: '주식회사 카카오' },
  { id: '2', date: '2026-02-13', amount: -47700, description: '카카오페이' },
  { id: '3', date: '2026-02-10', amount: -10300, description: '카카오T일반택시(법인)_4' }
];

const testKakaoRows = [
  { date: '2026.02.14', time: '12:00:00', type: '[-] 결제', merchant: '주식회사 카카오', amount: 1900, currency: 'KRW' },
  { date: '2026.02.13', time: '12:00:00', type: '[-] 결제', merchant: '정광준', amount: 47700, currency: 'KRW' },
  { date: '2026.02.10', time: '12:00:00', type: '[-] 결제', merchant: '카카오모빌리티', amount: 10300, currency: 'KRW' }
];

async function runTest() {
  console.log("Testing Match Logic...");
  const matches = await matchKakaoTransactions(testDbTxs, testKakaoRows as any);
  console.log("Matches:", JSON.stringify(matches, null, 2));
}

runTest();
