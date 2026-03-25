'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useMediaQuery } from '@/shared/hooks/use-media-query'

interface SidebarContextType {
  isOpen: boolean
  toggle: () => void
  isCollapsed: boolean // 태블릿용 (아이콘만 표시)
  close: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

/**
 * 앱 전역의 사이드바 상태를 관리하는 프로바이더입니다.
 * 화면 크기(Breakpoint)에 따른 자동 상태 전환 로직을 포함합니다.
 */
export function SidebarProvider({ children }: { children: ReactNode }) {
  // 기본 상태: 데스크톱에서는 열림, 모바일에서는 닫힘
  const [isOpen, setIsOpen] = useState(true)

  const isMobile = useMediaQuery('(max-width: 767px)')
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')

  // 화면 크기 변경 시 자동 조정
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false) // 모바일 진입 시 기본 닫힘
    } else {
      setIsOpen(true) // 태블릿/데스크톱 진입 시 기본 열림
    }
  }, [isMobile])

  const toggle = () => {
    setIsOpen(prev => !prev)
  }

  const close = () => {
    setIsOpen(false)
  }

  // 태블릿에서는 isOpen이 false일 때 'Collapsed(아이콘만)' 모드임
  const isCollapsed = isTablet && !isOpen

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, isCollapsed, close }}>
      {children}
    </SidebarContext.Provider>
  )
}

/**
 * 사이드바 상태를 사용하기 위한 커스텀 훅입니다.
 */
export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return ctx
}
