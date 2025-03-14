"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Menu, 
  X, 
  ChevronDown,
  Home,
  BookOpen,
  Code,CheckSquare,Wrench,
  BookMarked,
  FileText,
  Mail
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const navItems = [
  {
    path: "/",
    label: "Home",
    icon: <Home className="w-4 h-4 mr-2" />,
  },
  {
    path: "/introduction",
    label: "Introduction",
    icon: <BookOpen className="w-4 h-4 mr-2" />,
    dropdown: [
      { label: "Concepts", path: "/introduction/concepts" },
      { label: "Benefits", path: "/introduction/benefits" },
      { label: "Getting Started", path: "/introduction/getting-started" },
    ]
  },
  {
    path: "/learning-paths",
    label: "Learning Paths",
    icon: <BookMarked className="w-4 h-4 mr-2" />,
  },
  {
    path: "/mcp",
    label: "MCP Framework",
    icon: <Code className="w-4 h-4 mr-2" />,
    dropdown: [
      { label: "Overview", path: "/mcp" },
      { label: "Basics", path: "/mcp/basics" },
      { label: "Benefits", path: "/mcp/benefits" },
      { label: "Context Management", path: "/mcp/context-management" },
      { label: "Implementation", path: "/mcp/implementation" },
      { label: "Server Overview", path: "/servers" },
      { label: "Building Servers", path: "/building-servers" },
      { label: "Implementations", path: "/servers/implementation" },
      { label: "— Node.js", path: "/servers/implementation/nodejs" },
      { label: "— Python", path: "/servers/implementation/python" },
      { label: "— Firebase", path: "/servers/implementation/firebase" },
    ]
  },
  {
    path: "/best-practices",
    label: "Best Practices",
    icon: <CheckSquare className="w-4 h-4 mr-2" />,
  },
  {
    path: "/tools",
    label: "AI Tools",
    icon: <Wrench className="w-4 h-4 mr-2" />,
    dropdown: [
      { label: "Overview", path: "/tools" },
      { label: "Cursor", path: "/tools/cursor" },
      { label: "— Setup", path: "/tools/cursor/setup" },
      { label: "— Core Features", path: "/tools/cursor/core-features" },
      { label: "— Project Rules", path: "/tools/cursor/project-rules" },
    ]
  },
  {
    path: "/resources",
    label: "Resources",
    icon: <FileText className="w-4 h-4 mr-2" />,
    dropdown: [
      { label: "Knowledge Base", path: "/resources/knowledge-base" },
      { label: "Cursor Rules", path: "/resources/knowledge-base/cursor-rules" },
      { label: "— Best Practices", path: "/resources/knowledge-base/cursor-rules/best-practices" },
    ]
  },
  {
    path: "/contact",
    label: "Contact",
    icon: <Mail className="w-4 h-4 mr-2" />,
  },
]

export function Header() {
  const pathname = usePathname()
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  
  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])
  
  // Handle dropdown visibility - support both click and hover
  const toggleDropdown = (path: string) => {
    if (activeDropdown === path) {
      setActiveDropdown(null)
    } else {
      setActiveDropdown(path)
    }
  }
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Check if click is outside any nav item
      const isOutside = !(e.target as Element).closest('.nav-item-container');
      if (isOutside) {
        setActiveDropdown(null);
      }
    }
    
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])
  
  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])
  
  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled 
          ? "bg-background/95 backdrop-blur-md shadow-md" 
          : "bg-background/60 backdrop-blur-sm"
      )}
    >
      <div className="container mx-auto px-6 sm:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="font-bold text-xl sm:text-2xl gradient-text">The AI Dev Odyssey</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <div 
                key={item.path} 
                className="relative nav-item-container" 
                onMouseEnter={() => item.dropdown && setActiveDropdown(item.path)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {item.dropdown ? (
                  <div className="relative">
                    <button
                      onClick={() => toggleDropdown(item.path)}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200",
                        pathname.startsWith(item.path)
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {item.icon}
                      {item.label}
                      <ChevronDown className={cn(
                        "ml-1 h-4 w-4 transition-transform duration-200",
                        activeDropdown === item.path ? "rotate-180" : ""
                      )} />
                    </button>
                    
                    <AnimatePresence>
                      {activeDropdown === item.path && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-background border border-border z-10"
                        >
                          <div className="py-1 rounded-md bg-popover">
                            {item.dropdown.map((dropdownItem) => (
                              <Link
                                key={dropdownItem.path}
                                href={dropdownItem.path}
                                className={cn(
                                  "block px-4 py-2 text-sm transition-colors duration-200",
                                  pathname === dropdownItem.path
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                              >
                                {dropdownItem.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    href={item.path}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200",
                      pathname === item.path || pathname.startsWith(item.path + "/")
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>
          
          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            {/* Mobile menu button */}
            <button
              className="md:hidden rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-border overflow-hidden"
          >
            <div className="container mx-auto px-6 sm:px-8 py-3">
              <nav className="grid gap-y-2">
                {navItems.map((item) => (
                  <div key={item.path} className="w-full">
                    {item.dropdown ? (
                      <div className="w-full">
                        <button
                          onClick={() => toggleDropdown(item.path)}
                          className={cn(
                            "flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200",
                            pathname.startsWith(item.path)
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          <span className="flex items-center">
                            {item.icon}
                            {item.label}
                          </span>
                          <ChevronDown className={cn(
                            "ml-1 h-4 w-4 transition-transform duration-200",
                            activeDropdown === item.path ? "rotate-180" : ""
                          )} />
                        </button>
                        
                        <AnimatePresence>
                          {activeDropdown === item.path && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-1 pl-5 overflow-hidden"
                            >
                              {item.dropdown.map((dropdownItem) => (
                                <Link
                                  key={dropdownItem.path}
                                  href={dropdownItem.path}
                                  className={cn(
                                    "flex items-center px-3 py-2 rounded-md text-sm transition-colors duration-200",
                                    pathname === dropdownItem.path
                                      ? "bg-primary/10 text-primary"
                                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                  )}
                                >
                                  {dropdownItem.label}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link
                        href={item.path}
                        className={cn(
                          "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200",
                          pathname === item.path || pathname.startsWith(item.path + "/")
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
} 