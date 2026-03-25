'use client'

import { useEffect, useState } from 'react'

/**
 * 브라우저의 미디어 쿼리 일치 여부를 감지하는 훅입니다.
 * @param query 감지할 미디어 쿼리 스트링 (예: '(max-width: 767px)')
 * @returns 쿼리 일치 여부 (boolean)
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // 윈도우 객체 존재 여부 확인 (SSR 대응)
    if (typeof window === 'undefined') return

    const media = window.matchMedia(query)
    
    // 초기값 설정
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    const listener = () => setMatches(media.matches)
    
    // 이벤트 리스너 등록
    media.addEventListener('change', listener)
    
    // 클린업
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}
