'use client'

import React from 'react';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { ArrowRight, Wallet, Briefcase, TrendingUp, Shield, Zap } from 'lucide-react';

export default function Style4Preview() {
  return (
    <div className="min-h-screen bg-[#fcf9f4] text-[#4a453e] font-sans selection:bg-[#e8dec9]">
      <style jsx global>{`
        .tactile-card {
          background: #fdfcf9;
          border-radius: 2rem;
          box-shadow: 
            15px 15px 30px #ebe4d8,
            -15px -15px 30px #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.5);
          transition: all 0.3s ease;
        }
        .tactile-button {
          background: #fdfcf9;
          border-radius: 9999px;
          box-shadow: 
            6px 6px 12px #ebe4d8,
            -6px -6px 12px #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.8);
          transition: all 0.2s ease;
        }
        .tactile-button:active {
          box-shadow: 
            inset 4px 4px 8px #ebe4d8,
            inset -4px -4px 8px #ffffff;
          transform: scale(0.98);
        }
        .tactile-inner-shadow {
          box-shadow: inset 4px 4px 8px #ebe4d8, inset -4px -4px 8px #ffffff;
        }
        .clay-accent {
          background: linear-gradient(145deg, #6366f1, #4f46e5);
          box-shadow: 
            8px 8px 16px #d1d5db,
            -8px -8px 16px #ffffff,
            inset 2px 2px 4px rgba(255,255,255,0.3);
        }
      `}</style>

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl clay-accent flex items-center justify-center text-white">
            <Zap className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">BrightGlory</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button className="hover:text-black transition-colors">기능</button>
          <button className="hover:text-black transition-colors">가격</button>
          <button className="hover:text-black transition-colors">보안</button>
          <Button className="tactile-button bg-[#fdfcf9] text-black hover:bg-[#f9f7f2] px-6 h-12 border-none">로그인</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          당신의 재정을 단순하게,<br />
          미래를 더 <span className="text-indigo-600">밝게.</span>
        </h1>
        <p className="text-lg md:text-xl text-[#7c7569] max-w-2xl mx-auto mb-12 leading-relaxed">
          BrightGlory는 인공지능 기반의 자산 관리 도구로,<br />
          지능적인 가계부와 비즈니스 관리를 한 곳에서 해결합니다.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
          <Button className="h-16 px-10 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 text-lg font-bold shadow-indigo-200 transition-all hover:scale-105">
            무료로 시작하기 <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button variant="ghost" className="tactile-button h-16 px-10 text-lg font-bold border-none">
            데모 보기
          </Button>
        </div>

        {/* Tactile Mockup Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="tactile-card p-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 tactile-inner-shadow flex items-center justify-center mb-6">
              <Wallet className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">스마트 가계부</h3>
            <p className="text-sm text-[#7c7569] leading-relaxed">
              모든 은행과 카드를 연결하여 실시간으로 지출을 분석하고 자동으로 분류합니다.
            </p>
          </div>

          <div className="tactile-card p-8 scale-110 z-10 border-indigo-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 tactile-inner-shadow flex items-center justify-center mb-6">
              <Briefcase className="w-6 h-6 text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">비즈니스 컨트롤</h3>
            <p className="text-sm text-[#7c7569] leading-relaxed">
              프로젝트 수주부터 미수금 관리, 세금 계산서 발행까지 사업 운영의 모든 프로세스.
            </p>
          </div>

          <div className="tactile-card p-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 tactile-inner-shadow flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">자산 통계 리포트</h3>
            <p className="text-sm text-[#7c7569] leading-relaxed">
              당신의 자산 흐름을 한눈에 파악할 수 있는 고도화된 시각화 리포트를 매월 제공합니다.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-[#e8dec9] text-sm text-[#bdb6ab] flex justify-between items-center">
        <p>© 2024 BrightGlory Inc. All rights reserved.</p>
        <div className="flex gap-6">
          <span>개인정보처리방침</span>
          <span>이용약관</span>
        </div>
      </footer>
    </div>
  );
}
