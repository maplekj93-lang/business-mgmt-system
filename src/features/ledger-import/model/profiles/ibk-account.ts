import { BankProfile } from "../types";

export const ibkAccountProfile: BankProfile = {
    name: "기업은행",
    keywords: ["거래일시", "출금", "입금", "거래내용", "상대계좌번호"],
    mapping: {
        date: "거래일시",
        amount: [],
        merchant: ["기재내용", "거래내용"],
        expense: "출금",
        income: "입금",
        balance: ["거래후 잔액", "거래후잔액"]
    },
    // IBK 등 일부 은행은 날짜 포맷이 다양할 수 있음
};
