'use client'

import { Menu, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'

interface MobileMenuButtonProps {
  onClick: () => void
  isOpen: boolean
}

export function MobileMenuButton({ onClick, isOpen }: MobileMenuButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="md:hidden rounded-full hover:bg-muted/50"
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  )
}
