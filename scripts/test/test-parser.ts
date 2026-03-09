import { identifyBank } from '../../src/features/ledger-import/model/bank-adapter';
const header = ["날짜", "구분", "대분류", "소분류", "내용", "#", "금액", "입금계좌", "출금계좌"];
console.log("Header:", header.join(' '));
const matched = identifyBank(header);
console.log("Matched Profile:", matched ? matched.name : 'Unknown');
