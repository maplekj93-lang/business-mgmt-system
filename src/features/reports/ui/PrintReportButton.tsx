'use client'

import React from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/shared/ui/button'

export function PrintReportButton() {
    return (
        <Button 
            variant="default" 
            onClick={() => window.print()}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 gap-2"
        >
            <Printer className="h-4 w-4" /> 인쇄하기
        </Button>
    )
}
