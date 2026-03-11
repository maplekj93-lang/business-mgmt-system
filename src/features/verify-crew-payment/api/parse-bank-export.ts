import * as XLSX from 'xlsx'

export interface BankRecord {
  date: string
  amount: number
  memo: string
  _source_row: number
}

function parseDate(val: unknown): string {
  if (typeof val === 'number') {
    const date = XLSX.SSF.parse_date_code(val)
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
  }
  const str = String(val).trim()
  if (!str) return ''
  return str.replace(/[\.\/]/g, '-').split(/[\sT\n]+/)[0]
}

function parseAmount(val: unknown): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  if (typeof val === 'string') {
    const parsed = parseFloat(val.replace(/[^0-9.-]/g, ''))
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

export async function parseBankExport(file: File): Promise<BankRecord[]> {
  let arrayBuffer = await file.arrayBuffer()

  if (file.name.toLowerCase().endsWith('.csv')) {
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(arrayBuffer)
    } catch (e) {
      const text = new TextDecoder('euc-kr').decode(arrayBuffer)
      arrayBuffer = new TextEncoder().encode(text).buffer
    }
  }

  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const records: BankRecord[] = []

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 })

    if (rows.length < 2) continue

    let headerRowIndex = -1
    let colMap = { date: -1, amount: -1, memo: -1, withdrawal: -1 }

    // Find headers
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const row = rows[i]
        if (!row || !Array.isArray(row)) continue
        const r = row.map(s => String(s))

        if (r.some(c => c.includes('날짜') || c.includes('일시')) && 
            r.some(c => c.includes('금액') || c.includes('출금') || c.includes('찾으신'))) {
            headerRowIndex = i
            r.forEach((c, idx) => {
                if (c.includes('날짜') || c.includes('일시')) colMap.date = idx
                else if (c.includes('내용') || c.includes('적요') || c.includes('받는분') || c.includes('거래처')) colMap.memo = idx
                else if (c.includes('출금') || c.includes('찾으신')) colMap.withdrawal = idx
                else if (c.includes('금액')) colMap.amount = idx
            })
            break
        }
    }

    if (headerRowIndex === -1) continue

    // Extract data
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row) continue

        const dateRaw = row[colMap.date]
        if (!dateRaw) continue
        const date = parseDate(dateRaw)
        if (!date) continue

        let amount = 0
        if (colMap.withdrawal !== -1 && row[colMap.withdrawal]) {
            amount = parseAmount(row[colMap.withdrawal])
        } else if (colMap.amount !== -1 && row[colMap.amount]) {
            amount = Math.abs(parseAmount(row[colMap.amount]))
        }
        
        if (amount <= 0) continue // 출금 내역만 필요하므로 금액이 0이거나 음수인 경우 스킵 (보통 출금액은 양수로 기록되지만 만약 음수면 절대값 사용 가능. 위에서 abs 처리함)

        const memo = colMap.memo !== -1 ? String(row[colMap.memo]) : ''

        records.push({
            date,
            amount: Math.abs(amount), // Ensuring positive for matching
            memo,
            _source_row: i + 1
        })
    }
  }

  return records
}
