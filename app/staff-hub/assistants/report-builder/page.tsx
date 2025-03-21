"use client";

import { PageHeader } from "@/components/page-header";
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Message, UploadedDocument, ReportState } from "@/components/report-builder/types";
import { v4 as uuidv4 } from 'uuid';

// Import components dynamically to prevent hydration errors
const ChatInterface = dynamic(() => import("@/components/report-builder/chat-interface"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="p-4 border-b bg-slate-50">
        <h2 className="text-lg font-medium">Chat &amp; Document Upload</h2>
        <p className="text-sm text-slate-500">Loading chat interface...</p>
      </div>
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    </div>
  )
});

const ReportEditor = dynamic(() => import("@/components/report-builder/report-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="p-4 border-b bg-slate-50">
        <h2 className="text-lg font-medium">4-Box Report</h2>
        <p className="text-sm text-slate-500">Loading report editor...</p>
      </div>
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    </div>
  )
});

// Default empty report state
const createEmptyReport = (): ReportState => {
  const now = new Date();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const getOrdinalSuffix = (d: number) => {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };
  
  return {
    title: "",
    date: `${monthNames[now.getMonth()]} ${now.getDate()}${getOrdinalSuffix(now.getDate())} ${now.getFullYear()}`,
    sections: {
      accomplishments: "",
      insights: "",
      decisions: "",
      nextSteps: ""
    },
    metadata: {
      lastUpdated: Date.now(),
      relatedDocuments: []
    }
  };
};

// Welcome message for first-time users
const getWelcomeMessage = (): Message => ({
  id: uuidv4(),
  role: 'assistant',
  content: `# 📊 Welcome to the 4-Box Report Builder!

I'll help you create professional status reports from your documents and communications.

## 🚀 How to Get Started

### 1️⃣ Upload Documents
- Click the **paperclip icon** or the **Upload Documents** button
- Add project materials like emails, meeting notes, or documents
- Multiple file formats are supported (PDF, Word, text, images)

### 2️⃣ Generate Initial Report
- Once documents are uploaded, I'll analyze them automatically
- An initial 4-box report will be created based on your content
- You'll see the results in the report editor on the right

### 3️⃣ Refine with Chat
Ask me to update specific sections by trying commands like:
\`\`\`
Add completing the UI design to accomplishments
Update the next steps section with the launch date
What risks should I include in the decisions section?
\`\`\`

### 4️⃣ Edit Directly
- You can click on any section in the report editor to make direct changes
- Each box can be edited independently

### 5️⃣ Export or Copy
- When finished, use the **Copy** or **Export** buttons to share your report

---

Ready to create your first report? Upload a document to get started, or ask me any questions!`,
  timestamp: Date.now()
});

export default function ReportBuilderPage() {
  // Create a ref to track if the component is mounted
  const [mounted, setMounted] = useState(false);
  
  // Initialize states with empty values - will be populated properly on mount
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [reportState, setReportState] = useState<ReportState>(createEmptyReport());
  const [initialLoad, setInitialLoad] = useState(true); // Track initial load to prevent auto-scrolling
  const [regenerating, setRegenerating] = useState(false); // Track regeneration state

  // Set mounted state when component mounts
  useEffect(() => {
    // Mark the component as mounted first
    setMounted(true);
    
    // Ensure page starts at the top when first loaded
    if (typeof window !== 'undefined') {
      // Use a zero timeout to ensure this happens after any rendering
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant' // Use 'instant' instead of 'smooth' to avoid visible scrolling
        });
      }, 0);
    }
    
    // Defer adding welcome message to a separate effect to prevent auto-scrolling
  }, []);
  
  // Add welcome message in a separate effect after component is mounted
  useEffect(() => {
    if (mounted && messages.length === 0) {
      // Defer adding the welcome message to next tick to avoid triggering scroll
      setTimeout(() => {
        setMessages([getWelcomeMessage()]);
        // Mark initial load as complete after welcome message is added
        setInitialLoad(false);
      }, 100);
    }
  }, [mounted, messages.length]);

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    // Don't allow empty messages
    if (!content.trim()) return;
    
    // Add user message to the chat
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Create placeholder for assistant response
    const placeholder: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true
    };
    
    setMessages(prev => [...prev, placeholder]);
    setIsProcessing(true);
    
    try {
      // Call the chat API
      const response = await fetch('/api/report-builder/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: content,
          reportState,
          documentIds: uploadedDocuments.map(doc => doc.id)
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update messages with the actual response
      setMessages(prev => prev.map(msg => 
        msg.id === placeholder.id
          ? {
              ...msg,
              content: data.reply,
              isStreaming: false,
              timestamp: Date.now()
            }
          : msg
      ));
      
      // Update report state if there are changes
      if (data.updatedReport) {
        setReportState(prev => ({
          ...prev,
          ...data.updatedReport,
          sections: {
            ...prev.sections,
            ...data.updatedReport.sections
          },
          metadata: {
            ...prev.metadata,
            lastUpdated: Date.now()
          }
        }));
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update messages with error
      setMessages(prev => prev.map(msg => 
        msg.id === placeholder.id
          ? {
              ...msg,
              content: "I'm sorry, I encountered an error while processing your request. Please try again.",
              isStreaming: false,
              metadata: { type: 'error' },
              timestamp: Date.now()
            }
          : msg
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle document upload
  const handleDocumentUploaded = async (document: UploadedDocument) => {
    // Add document to state
    setUploadedDocuments(prev => [...prev, document]);
    
    // Add system message about the upload
    const systemMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: `📄 Document **"${document.name}"** has been uploaded and processed.`,
      timestamp: Date.now(),
      metadata: {
        type: 'upload'
      }
    };
    
    setMessages(prev => [...prev, systemMessage]);
    
    // If this is the first document, generate an initial report
    if (uploadedDocuments.length === 0) {
      await generateInitialReport([document]);
    }
  };

  // Handle document removal
  const handleDocumentRemoved = (documentId: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  // Handle report changes
  const handleReportChange = (updatedReport: ReportState) => {
    setReportState(updatedReport);
  };

  // Generate initial report from documents
  const generateInitialReport = async (documents: UploadedDocument[]) => {
    if (documents.length === 0) return;
    
    setIsProcessing(true);
    
    // Add system message about report generation
    const systemMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: "⏳ **Generating initial report** from uploaded documents...",
      timestamp: Date.now(),
      isStreaming: true
    };
    
    setMessages(prev => [...prev, systemMessage]);
    
    try {
      // Call the generate report API
      const response = await fetch('/api/report-builder/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documents,
          projectContext: ""
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Debug logging
      console.log('Report generation response:', data);
      console.log('Report state from response:', data.reportState);
      if (data.reportState?.sections) {
        console.log('Sections in response:', {
          accomplishments: data.reportState.sections.accomplishments?.length || 0,
          insights: data.reportState.sections.insights?.length || 0,
          decisions: data.reportState.sections.decisions?.length || 0,
          nextSteps: data.reportState.sections.nextSteps?.length || 0
        });
      }
      
      // Update report state
      if (data.reportState) {
        setReportState(data.reportState);
        
        // Debug log of what we're setting
        console.log('Setting report state to:', JSON.stringify(data.reportState, null, 2));
      } else {
        console.warn('No reportState in API response');
      }
      
      // Update system message
      setMessages(prev => prev.map(msg => 
        msg.id === systemMessage.id
          ? {
              ...msg,
              content: "✅ **Initial report generated** based on your documents. You can now refine it using the chat.",
              isStreaming: false,
              timestamp: Date.now()
            }
          : msg
      ));
      
    } catch (error) {
      console.error('Error generating report:', error);
      
      // Update system message with error
      setMessages(prev => prev.map(msg => 
        msg.id === systemMessage.id
          ? {
              ...msg,
              content: "❌ **Error generating report**. Please try again or upload additional documents.",
              isStreaming: false,
              metadata: { type: 'error' },
              timestamp: Date.now()
            }
          : msg
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to force regenerate the report
  const forceRegenerateReport = async () => {
    if (uploadedDocuments.length === 0 || regenerating) return;
    
    setRegenerating(true);
    
    // Add system message about report regeneration
    const systemMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: "⏳ **Regenerating report** from uploaded documents...",
      timestamp: Date.now(),
      isStreaming: true
    };
    
    setMessages(prev => [...prev, systemMessage]);
    
    try {
      await generateInitialReport(uploadedDocuments);
      
      // Update message to indicate success
      setMessages(prev => prev.map(msg => 
        msg.id === systemMessage.id
          ? {
              ...msg,
              content: "✅ **Report regenerated** successfully.",
              isStreaming: false
            }
          : msg
      ));
    } catch (error) {
      console.error('Error regenerating report:', error);
      
      // Update message to indicate error
      setMessages(prev => prev.map(msg => 
        msg.id === systemMessage.id
          ? {
              ...msg,
              content: "❌ **Error regenerating report**. Please try again.",
              isStreaming: false,
              metadata: { type: 'error' }
            }
          : msg
      ));
    } finally {
      setRegenerating(false);
    }
  };
  
  // Check if report is empty
  const isReportEmpty = !reportState.sections.accomplishments && 
                       !reportState.sections.insights && 
                       !reportState.sections.decisions && 
                       !reportState.sections.nextSteps;

  // Only render the components when mounted to prevent hydration issues
  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="4-Box Report Builder"
        description="Generate concise, professional status reports from your documents and communications."
      />
      
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-240px)] min-h-[600px]">
        {/* Chat Interface (Left Side) */}
        {mounted && (
          <ChatInterface
            onSendMessage={handleSendMessage}
            messages={messages}
            isProcessing={isProcessing}
            onDocumentUploaded={handleDocumentUploaded}
            onDocumentRemoved={handleDocumentRemoved}
            uploadedDocuments={uploadedDocuments}
          />
        )}
        
        {/* Report Editor (Right Side) */}
        {mounted && (
          <div className="flex flex-col h-full">
            <ReportEditor
              reportState={reportState}
              onReportChange={handleReportChange}
            />
            
            {isReportEmpty && uploadedDocuments.length > 0 && (
              <div className="mt-2 text-center">
                <p className="text-sm text-slate-500 mb-2">
                  Report appears to be empty. Would you like to regenerate it?
                </p>
                <button
                  onClick={forceRegenerateReport}
                  disabled={regenerating}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    regenerating 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {regenerating ? 'Regenerating...' : 'Regenerate Report'}
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Show placeholders while not mounted */}
        {!mounted && (
          <>
            <div className="flex flex-col border rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="p-4 border-b bg-slate-50">
                <h2 className="text-lg font-medium">Chat &amp; Document Upload</h2>
                <p className="text-sm text-slate-500">Loading...</p>
              </div>
              <div className="flex-1 p-4 flex items-center justify-center">
                <div className="animate-pulse text-slate-400">Loading chat interface...</div>
              </div>
            </div>
            
            <div className="flex flex-col border rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="p-4 border-b bg-slate-50">
                <h2 className="text-lg font-medium">4-Box Report</h2>
                <p className="text-sm text-slate-500">Loading...</p>
              </div>
              <div className="flex-1 p-4 flex items-center justify-center">
                <div className="animate-pulse text-slate-400">Loading report editor...</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 