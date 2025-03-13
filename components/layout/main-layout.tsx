"use client"

import { ReactNode } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col md:pl-[80px] lg:pl-[90px]">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
} 