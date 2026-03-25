import { parse } from 'csv-parse/sync';

export interface KakaoPayRow {
  date: string;
  time: string;
  type: string; // 거래구분: '[+] 부족분충전', '[-] 결제', '[-] 송금', '[+] 환급', '[-] 수수료', '[+] 포인트/혜택'
  merchant: string; // 계좌정보/결제정보
  amount: number;
  currency: string;
  _import_idx?: number; // 미매칭 건 오리지널 행 인덱스 추적용
}

/**
 * 카카오페이 가맹점 매퍼 - CSV 파서
 * 카카오페이 고객센터에서 발급한 '거래내역확인서' CSV 파일을 파싱합니다.
 */
export const parseKakaoPayCSV = (csvContent: string): KakaoPayRow[] => {
  // 카카오페이 CSV는 보통 BOM이 있거나 인코딩이 다를 수 있지만, 
  // 여기서는 표준 UTF-8 CSV로 가정하고 구현합니다.
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((record: any) => {
    // 카카오페이 CSV 컬럼명 기반 매핑 (실제 파일 컬럼명 확인 필요)
    // 예: 거래일시, 거래구분, 거래금액, 계좌정보/결제정보
    const dateTime = record['거래일시'] || '';
    const [date, time] = dateTime.split(' ');

    return {
      date: date || '',
      time: time || '',
      type: record['거래구분'] || '',
      merchant: record['계좌정보/결제정보'] || record['가맹점'] || '',
      amount: Math.abs(Number(String(record['거래금액'] || '0').replace(/[^0-9.-]+/g, ''))),
      currency: 'KRW',
    };
  });
};
