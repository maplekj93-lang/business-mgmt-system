"use client";

import { useState } from "react";
import { parseKakaoPayCSV, KakaoPayRow } from "../model/parser";
import { matchKakaoTransactions, MatchResult, saveKakaoMappings } from "../model/matcher";
import { createClient } from "@/shared/api/supabase/client";

export default function KakaoPayMatcherPage() {
  const [file, setFile] = useState<File | null>(null);
  const [matchingResults, setMatchingResults] = useState<MatchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setFile(e.target.files[0]);
  };

  const processMatching = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const content = await file.text();
      const kakaoRows = parseKakaoPayCSV(content);

      const supabase = createClient();
      // '카카오페이'가 포함된 미분류 거래 조회
      const { data: txs } = await supabase
        .from("transactions")
        .select("*")
        .ilike("description", "%카카오페이%")
        .is("breakdown_source_id", null);

      if (txs) {
        const matches = await matchKakaoTransactions(txs, kakaoRows);
        setMatchingResults(matches);
      }
    } catch (error) {
      console.error("Matching failed:", error);
      alert("매칭 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    try {
      await saveKakaoMappings(matchingResults);
      alert("성공적으로 저장되었습니다.");
    } catch (error) {
      console.error("Save failed:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">카카오페이 가맹점 매퍼</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          카카오페이 거래내역서(CSV) 업로드
        </label>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button
          onClick={processMatching}
          disabled={!file || isProcessing}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isProcessing ? "처리 중..." : "매칭 시작하기"}
        </button>
      </div>

      {matchingResults.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기존 거래</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">매칭된 가맹점</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신뢰도</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {matchingResults.map((result, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 text-sm text-gray-900">{result.transactionId}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-bold">{result.kakaoPayRow.merchant}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{result.kakaoPayRow.amount.toLocaleString()}원</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{result.confidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-gray-50 border-t">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold"
            >
              매칭 결과 저장 및 반영
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
