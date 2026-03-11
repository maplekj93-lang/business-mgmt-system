'use client'

import React from 'react';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { ArrowRight, Wallet, Briefcase, TrendingUp, Search, Menu } from 'lucide-react';

export default function Style5Preview() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      {/* Strict Grid Layout */}
      <div className="flex min-h-screen">
        
        {/* Sidebar Space (L-Line) */}
        <div className="w-16 md:w-24 border-r border-black flex flex-col items-center py-8 gap-12 sticky top-0 h-screen">
          <div className="font-black text-2xl tracking-tighter">B.</div>
          <div className="flex flex-col gap-8">
            <Menu className="w-6 h-6" />
            <Search className="w-6 h-6" />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          
          {/* Header */}
          <header className="h-24 border-b border-black flex items-center justify-between px-8 md:px-16">
            <div className="text-sm font-bold tracking-widest uppercase">BrightGlory / System v5.0</div>
            <Button className="bg-black text-white hover:bg-neutral-800 rounded-none px-8 h-12 font-bold uppercase tracking-widest text-xs">
              Sign In
            </Button>
          </header>

          {/* Hero Section */}
          <main className="flex-1 flex flex-col">
            <section className="px-8 md:px-16 py-24 md:py-32 border-b border-black">
              <h1 className="text-6xl md:text-[120px] font-black leading-[0.9] tracking-tighter mb-12 uppercase">
                Finance<br />
                Simplified<br />
                Future<br />
                <span className="text-[#ff3e00]">Bright.</span>
              </h1>
              <div className="max-w-xl">
                <p className="text-xl md:text-2xl font-medium leading-snug mb-12">
                  Precision in every transaction. Clarity in every decision. 
                  BrightGlory is the new standard for integrated asset management.
                </p>
                <Button className="bg-[#ff3e00] text-white hover:bg-[#e63700] rounded-none px-12 h-16 text-lg font-black uppercase tracking-widest">
                  Get Started Now <ArrowRight className="ml-4 w-6 h-6" />
                </Button>
              </div>
            </section>

            {/* Feature Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black h-full">
              <div className="p-12 md:p-16 flex flex-col justify-between group cursor-pointer hover:bg-black hover:text-white transition-colors duration-300">
                <div>
                  <div className="text-[40px] font-black mb-8">01.</div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-4 group-hover:text-[#ff3e00]">Asset Ledger</h3>
                  <p className="text-lg font-medium opacity-70">
                    Real-time synchronization across all personal financial institutions.
                  </p>
                </div>
                <ArrowRight className="w-8 h-8 mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="p-12 md:p-16 flex flex-col justify-between group cursor-pointer hover:bg-black hover:text-white transition-colors duration-300">
                <div>
                  <div className="text-[40px] font-black mb-8">02.</div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-4 group-hover:text-[#ff3e00]">Business Control</h3>
                  <p className="text-lg font-medium opacity-70">
                    Manage project pipelines, outstanding receivables, and tax invoices.
                  </p>
                </div>
                <ArrowRight className="w-8 h-8 mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="p-12 md:p-16 flex flex-col justify-between group cursor-pointer hover:bg-black hover:text-white transition-colors duration-300">
                <div>
                  <div className="text-[40px] font-black mb-8">03.</div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-4 group-hover:text-[#ff3e00]">Deep Analytics</h3>
                  <p className="text-lg font-medium opacity-70">
                    Monthly structured reports visualizing your financial trajectory.
                  </p>
                </div>
                <ArrowRight className="w-8 h-8 mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </section>
          </main>

          {/* Footer */}
          <footer className="p-8 md:px-16 border-t border-black flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="text-2xl font-black tracking-tighter">BRIGHTGLORY.</div>
            <div className="flex gap-12 font-bold text-xs uppercase tracking-widest overflow-x-auto w-full md:w-auto">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>API Docs</span>
              <span>Support</span>
            </div>
            <div className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">© 2024 System Prototype</div>
          </footer>
        </div>
      </div>
    </div>
  );
}
