"use client"

import React from 'react'
import { ThemeProvider } from "@/components/providers/theme-provider"
import { EnhancedChatProvider } from "@/lib/hooks/use-enhanced-chat"
import { NavigationProvider } from "@/contexts/navigation-context"
import { ChatProvider } from "@/contexts/chat-context"
import { TooltipProvider } from "@/components/ui/tooltip"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <NavigationProvider>
          <ChatProvider>
            <EnhancedChatProvider>
              {children}
            </EnhancedChatProvider>
          </ChatProvider>
        </NavigationProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
} 