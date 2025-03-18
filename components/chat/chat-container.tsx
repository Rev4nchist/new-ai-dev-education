"use client"

import React, { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@/contexts/chat-context"
import { useNavigation, NavigationRecommendation as NavigationRecommendationType } from "@/contexts/navigation-context"
import { ChatInput } from "@/components/chat/chat-input"
import ChatMessage from "./chat-message"
import { 
  Loader2, 
  Info, 
  RefreshCw, 
  ArrowRight, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  SkipBack,
  SkipForward,
  Keyboard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ContentReferences } from "./content-references"
import { NavigationSuggestions } from "./navigation-suggestion"
import { ScrollArea } from "@/components/ui/scroll-area"
import dynamic from "next/dynamic"
import { Message, FileAttachment } from "@/lib/chat-service"
import { ContentChunk } from "@/lib/content-indexing-service"
import { ErrorBoundary } from "react-error-boundary"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip"
import { useChatKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Temporary inline implementation to avoid import issues
function NavigationRecommendation({ recommendation }: { recommendation: NavigationRecommendationType }) {
  const { path, title, description, summary, confidence } = recommendation
  const router = useRouter()
  const isExternal = path.startsWith("http")
  
  // Format confidence as percentage
  const confidencePercent = Math.round(confidence * 100)
  
  const handleNavigate = () => {
    if (isExternal) {
      window.open(path, "_blank")
    } else {
      router.push(path)
    }
  }
  
  return (
    <div className="rounded-md border border-border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm">{title}</h4>
        {confidence > 0 && (
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded-full",
            confidencePercent > 80 
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}>
            {confidencePercent}%
          </span>
        )}
      </div>
      
      {(description || summary) && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          {description || summary}
        </p>
      )}
      
      <div className="mt-2 flex justify-between items-center">
        <span className="text-xs text-muted-foreground truncate max-w-[140px]">
          {path}
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 px-2"
          onClick={handleNavigate}
        >
          {isExternal ? (
            <>
              <span className="text-xs">Open</span>
              <ExternalLink className="h-3 w-3 ml-1" />
            </>
          ) : (
            <>
              <span className="text-xs">Go</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// Dynamically import NavigationSuggestions to avoid type errors during build
const DynamicNavigationSuggestions = dynamic(
  () => import("./navigation-suggestion").then((mod) => mod.NavigationSuggestions),
  { ssr: false }
);

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }: { 
  error: Error; 
  resetErrorBoundary: () => void 
}) => (
  <div className="p-4 bg-destructive/10 text-destructive rounded-md m-4">
    <h3 className="font-medium mb-2">Something went wrong:</h3>
    <p className="text-sm mb-2">{error.message}</p>
    <Button size="sm" onClick={resetErrorBoundary}>Try again</Button>
  </div>
);

interface ChatContainerProps {
  onMessageSend?: (message: string) => void;
}

// Using export default to avoid naming conflicts
export default function ChatContainer({ onMessageSend }: ChatContainerProps) {
  const { 
    currentSession,
    messages: contextMessages,
    isLoading,
    isTyping,
    sendMessage,
    sendStreamingMessage,
    totalChunks,
    currentChunkIndex,
    navigateToNextChunk,
    navigateToPreviousChunk,
    resetChat: resetChatSession,
    relevantContent,
    isSearchingContent,
    navigationSuggestions
  } = useChat();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [forceRender, setForceRender] = useState(0);
  const [isChunkLoading, setIsChunkLoading] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Helper to force a re-render
  const forceUpdate = () => {
    setForceRender(prev => prev + 1);
  };
  
  // Enhanced scroll to bottom that respects animation timing
  const scrollToBottom = (delay = 0) => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, delay);
  };
  
  // Scroll to the bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [contextMessages.length]);
  
  // Use context messages by default, fall back to session messages if available
  const messages = contextMessages.length > 0 
    ? contextMessages
    : (currentSession?.messages || []);

  // Enhanced navigation functions with loading state
  const handleNavigateChunk = async (direction: 'next' | 'previous' | 'first' | 'last') => {
    setIsChunkLoading(true);
    
    try {
      let success = false;
      
      if (direction === 'next') {
        success = navigateToNextChunk();
      } else if (direction === 'previous') {
        success = navigateToPreviousChunk();
      } else if (direction === 'first') {
        // Navigate to first chunk (we'll need to add this to the context)
        let currentIndex = totalChunks - 1;
        while (currentIndex > 0) {
          navigateToPreviousChunk();
          currentIndex--;
        }
        success = true;
      } else if (direction === 'last') {
        // Navigate to last chunk (we'll need to add this to the context)
        let currentIndex = 0;
        while (currentIndex < totalChunks - 1) {
          navigateToNextChunk();
          currentIndex++;
        }
        success = true;
      }
      
      // Short delay to allow for chunk loading animation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return success;
    } finally {
      setIsChunkLoading(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = async (content: string, attachments?: FileAttachment[]) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;
    
    // Call the onMessageSend prop if provided
    if (onMessageSend) {
      onMessageSend(content);
    }
    
    // Use the context's send message functionality
    if (attachments && attachments.length > 0) {
      if (sendStreamingMessage) {
        await sendStreamingMessage(content, attachments);
      }
    } else if (sendMessage) {
      await sendMessage(content);
    }
    
    // Scroll to the bottom after sending
    scrollToBottom();
  };

  // Keyboard shortcut handlers
  const focusInput = () => {
    inputRef.current?.focus();
  };

  const clearChat = () => {
    if (resetChatSession && confirm("Are you sure you want to clear the chat history?")) {
      resetChatSession();
    }
  };
  
  // Use the keyboard shortcuts hook
  const { getShortcutsHelp } = useChatKeyboardShortcuts({
    onNextChunk: () => handleNavigateChunk('next'),
    onPrevChunk: () => handleNavigateChunk('previous'),
    onFirstChunk: () => handleNavigateChunk('first'),
    onLastChunk: () => handleNavigateChunk('last'),
    onClearChat: clearChat,
    onFocusInput: focusInput,
    isEnabled: true,
  });
  
  const shortcuts = getShortcutsHelp();

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="flex flex-col h-full">
        {totalChunks > 1 && (
          <div className="px-4 py-2 border-b flex items-center justify-between bg-muted/30">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              {isChunkLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Loading messages...</span>
                </div>
              ) : (
                <span>
                  Page {currentChunkIndex + 1} of {totalChunks}
                </span>
              )}
              
              {/* Keyboard shortcuts help */}
              <Popover open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 ml-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Keyboard className="h-3.5 w-3.5" />
                    <span className="sr-only">Keyboard shortcuts</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="start" className="w-64 p-0">
                  <div className="p-2 border-b">
                    <h4 className="font-medium text-sm">Keyboard Shortcuts</h4>
                  </div>
                  <div className="max-h-[200px] overflow-auto">
                    <div className="p-2 space-y-1">
                      {shortcuts.map((shortcut, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            {shortcut.description}
                          </span>
                          <kbd className="px-1.5 py-0.5 text-xs font-semibold text-muted-foreground bg-muted border rounded">
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleNavigateChunk('first')}
                      disabled={currentChunkIndex === 0 || isChunkLoading}
                    >
                      <span className="sr-only">First</span>
                      <SkipBack className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>First page</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleNavigateChunk('previous')}
                      disabled={currentChunkIndex === 0 || isChunkLoading}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Previous page</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleNavigateChunk('next')}
                      disabled={currentChunkIndex === totalChunks - 1 || isChunkLoading}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Next page</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleNavigateChunk('last')}
                      disabled={currentChunkIndex === totalChunks - 1 || isChunkLoading}
                    >
                      <span className="sr-only">Last</span>
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Last page</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">
                Start a conversation with the AI tutor...
              </p>
            </div>
          ) : (
            <div className={cn(
              "space-y-4 transition-opacity duration-200",
              isChunkLoading ? "opacity-50" : "opacity-100"
            )}>
              {messages.map((message: Message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isTyping && (
                <ChatMessage
                  message={{
                    id: "typing",
                    role: "assistant",
                    content: "",
                    timestamp: Date.now(),
                    metadata: { type: "loading" },
                  }}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        
        {/* Show relevant content section */}
        {(relevantContent?.length > 0 || isSearchingContent) && (
          <div className="border-t p-2">
            <ContentReferences 
              references={relevantContent || []} 
              isSearching={isSearchingContent} 
            />
          </div>
        )}
        
        {/* Show navigation suggestions when available */}
        {navigationSuggestions.length > 0 && (
          <div className="border-t p-2">
            <NavigationSuggestions suggestions={navigationSuggestions} />
          </div>
        )}

        {/* Chat input section */}
        <div className="p-4 border-t relative">
          <ChatInput 
            onSubmit={handleSendMessage}
            isLoading={isTyping}
            placeholder="Ask about AI development or MCP..."
            ref={inputRef}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}

// For compatibility with existing imports
export { ChatContainer }; 