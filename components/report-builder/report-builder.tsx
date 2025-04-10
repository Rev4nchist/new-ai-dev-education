import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { UploadedDocument, ReportState, Message, ChatResponse, ReportSectionKey } from './types';
import ChatInterface from './chat-interface';
import ReportEditor from './report-editor';

// Create a simple inline LoadingSpinner component since we can't find the import
function LoadingSpinner({ size = 'lg' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-12 w-12 border-4' : 
                    size === 'md' ? 'h-8 w-8 border-3' : 
                    'h-4 w-4 border-2';
  
  return (
    <div className="relative">
      <div
        className={`animate-spin rounded-full border-solid border-blue-600 border-t-transparent ${sizeClass}`}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

export default function ReportBuilder() {
  const [reportId, setReportId] = useState<string>('');
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 Welcome to the 4-Box Report Builder! Upload your documents or start a chat to generate a concise status report.',
      timestamp: Date.now()
    }
  ]);
  
  // Initialize an empty report state
  const [reportState, setReportState] = useState<ReportState>({
    title: 'Status Report',
    date: '',
    sections: {
      accomplishments: '',
      insights: '',
      decisions: '',
      nextSteps: ''
    },
    metadata: {
      lastUpdated: Date.now()
    }
  });
  
  // Track states for UI feedback
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [reportProcessingError, setReportProcessingError] = useState<string | null>(null);
  const [showProgressIndicator, setShowProgressIndicator] = useState<boolean>(false);
  
  /**
   * Poll for report status updates, including streaming partial results
   */
  const pollReportStatus = useCallback(async (reportIdToCheck: string) => {
    if (!reportIdToCheck) return;
    
    let attempts = 0;
    
    // Implement exponential backoff
    let currentPollInterval = 3000; // 3 seconds
    const MAX_POLL_INTERVAL = 15000; // 15 seconds max between attempts
    const BACKOFF_FACTOR = 1.5; // Increase interval by 50% each time

    const startPolling = () => {
      const pollInterval = setInterval(async () => {
        attempts++;
        
        try {
          const response = await fetch(`/api/report-builder/check-report?reportId=${reportIdToCheck}`, {
            // Add timeout to the fetch request
            signal: AbortSignal.timeout(20000) // 20-second timeout
          });
          
          if (!response.ok) {
            if (response.status === 504) {
              console.warn(`Polling attempt ${attempts}: Gateway timeout (504) - will retry with longer interval`);
              // Increase the polling interval more aggressively for timeouts
              currentPollInterval = Math.min(currentPollInterval * 2, MAX_POLL_INTERVAL);
              clearInterval(pollInterval);
              setTimeout(startPolling, currentPollInterval);
              return;
            }
            
            console.error(`Error checking report status: ${response.status}`);
            return;
          }
          
          const data = await response.json();
          console.log(`Polling attempt ${attempts}: Status=${data.status}`, data);
          
          // Handle streaming partial results
          if (data.hasPartialResults && data.reportState) {
            setShowProgressIndicator(true);
            setReportState(data.reportState);
            
            // Reset backoff after successful partial result
            currentPollInterval = 3000;
          }
          
          // If report is complete, stop polling and update the report state
          if (data.isComplete && data.reportState) {
            clearInterval(pollInterval);
            setIsProcessing(false);
            setIsGeneratingReport(false);
            setShowProgressIndicator(false);
            setReportState(data.reportState);
            
            // Add a message about report completion
            setMessages(prev => [...prev, {
              id: uuidv4(),
              role: 'assistant',
              content: '✅ Your 4-box report has been generated! You can now review and edit it.',
              timestamp: Date.now()
            }]);
            
            return;
          }
          
          // Handle error states
          if (data.error) {
            clearInterval(pollInterval);
            setIsProcessing(false);
            setIsGeneratingReport(false);
            setShowProgressIndicator(false);
            setReportProcessingError(data.error);
            
            // Add error message to chat
            setMessages(prev => [...prev, {
              id: uuidv4(),
              role: 'assistant',
              content: `❌ Error generating report: ${data.error}\n\nPlease try again with different documents or contact support if the issue persists.`,
              timestamp: Date.now(),
              metadata: {
                type: 'error'
              }
            }]);
            
            return;
          }
          
          // If we've reached max polling attempts and the report is still not complete
          if (attempts >= 40) {
            clearInterval(pollInterval);
            setIsProcessing(false);
            setIsGeneratingReport(false);
            setShowProgressIndicator(false);
            console.error(`Exceeded max polling attempts (${40}) for report ${reportIdToCheck}`);
            
            // Add timeout message to chat, but don't clear the partial report
            // This way users can still see whatever was processed
            setMessages(prev => [...prev, {
              id: uuidv4(),
              role: 'assistant',
              content: "⚠️ The report is taking longer than expected. You can continue working with the partial results or try again with fewer or smaller documents.",
              timestamp: Date.now(),
              metadata: {
                type: 'error'
              }
            }]);
            
            return;
          }
          
          // Implement exponential backoff for subsequent polls
          if (attempts > 1) {
            // Increase the interval (with a maximum cap)
            currentPollInterval = Math.min(currentPollInterval * BACKOFF_FACTOR, MAX_POLL_INTERVAL);
            
            // Clear the current interval and set a new one with the updated timing
            clearInterval(pollInterval);
            setTimeout(startPolling, currentPollInterval);
            return;
          }
        } catch (error) {
          console.error('Error polling for report updates:', error);
          
          // Implement backoff for errors too
          currentPollInterval = Math.min(currentPollInterval * BACKOFF_FACTOR, MAX_POLL_INTERVAL);
          clearInterval(pollInterval);
          setTimeout(startPolling, currentPollInterval);
        }
      }, currentPollInterval);
      
      // Return the interval ID for cleanup
      return pollInterval;
    };
    
    // Start initial polling and store the interval ID
    const initialInterval = startPolling();
    
    // Cleanup function to clear the interval if component unmounts
    return () => {
      if (initialInterval) clearInterval(initialInterval);
    };
  }, []);
  
  // When a new document is uploaded, add it to the state
  const handleDocumentUploaded = useCallback((document: UploadedDocument) => {
    setUploadedDocuments(prev => [...prev, document]);
    
    // Add a message about the upload
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'assistant',
      content: `📄 Document uploaded: ${document.name}`,
      timestamp: Date.now(),
      metadata: {
        type: 'upload'
      }
    }]);
    
    // If this is the first document, suggest generating a report
    if (uploadedDocuments.length === 0) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: uuidv4(),
          role: 'assistant',
          content: 'Would you like to generate a 4-box report from this document? Or upload more documents first?',
          timestamp: Date.now()
        }]);
      }, 1000);
    }
  }, [uploadedDocuments]);
  
  // When a document is removed, update the state
  const handleDocumentRemoved = useCallback((documentId: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
    
    // Add a message about the removal
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'assistant',
      content: `Document removed.`,
      timestamp: Date.now()
    }]);
  }, []);
  
  /**
   * Generates a report from the uploaded documents
   */
  const generateReport = useCallback(async () => {
    if (uploadedDocuments.length === 0) {
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: '⚠️ Please upload at least one document before generating a report.',
        timestamp: Date.now(),
        metadata: {
          type: 'error'
        }
      }]);
      return;
    }
    
    // Set processing state
    setIsProcessing(true);
    setIsGeneratingReport(true);
    setShowProgressIndicator(true);
    setReportProcessingError(null);
    
    // Add a message about starting the report generation
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'user',
      content: 'Generate a 4-box report from my documents',
      timestamp: Date.now()
    }]);
    
    // Create a streaming message that will be updated
    const streamingMessageId = uuidv4();
    setMessages(prev => [...prev, {
      id: streamingMessageId,
      role: 'assistant',
      content: '🔄 Generating your 4-box report... This process uses streaming responses, so you\'ll see results as they become available.',
      timestamp: Date.now(),
      isStreaming: true
    }]);
    
    try {
      // Generate a unique report ID if we don't have one
      const newReportId = reportId || uuidv4();
      setReportId(newReportId);
      
      // Request report generation using the streaming endpoint
      const response = await fetch('/api/report-builder/generate-report-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documents: uploadedDocuments,
          projectContext: "" // Add project context if available
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }
      
      // Handle the streaming response
      if (!response.body) {
        throw new Error('Response body is null');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';
      let hasEncounteredError = false;
      
      // Initialize report sections
      const newReport = { ...reportState };
      
      // Process the stream
      while (true) {
        const { value, done } = await reader.read();
        
        if (done) {
          console.log('Stream complete');
          break;
        }
        
        // Decode and process the chunk
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.trim() === '' || !line.startsWith('data: ')) continue;
          
          const data = line.slice(6).trim();
          
          if (data === '[DONE]') {
            console.log('Stream done marker received');
            continue;
          }
          
          try {
            // Parse the JSON data
            const parsed = JSON.parse(data);
            
            // Check for errors
            if (parsed.id === 'error' || parsed.report_metadata?.error) {
              const errorMessage = parsed.report_metadata?.error || 
                parsed.choices?.[0]?.delta?.content || 
                'Unknown error occurred';
              
              console.error('Streaming error:', errorMessage);
              hasEncounteredError = true;
              
              // Update the streaming message with the error
              setMessages(prev => prev.map(msg => 
                msg.id === streamingMessageId
                  ? {
                      ...msg,
                      content: `❌ Error generating report: ${errorMessage}`,
                      isStreaming: false,
                      metadata: { type: 'error' },
                      timestamp: Date.now()
                    }
                  : msg
              ));
              
              break;
            }
            
            // Get the content and section information
            const content = parsed.choices?.[0]?.delta?.content || '';
            const reportMetadata = parsed.report_metadata;
            
            if (content) {
              // Accumulate the response
              accumulatedResponse += content;
              
              // Update the streaming message with progress
              setMessages(prev => prev.map(msg => 
                msg.id === streamingMessageId
                  ? {
                      ...msg,
                      content: `🔄 Generating your 4-box report (${accumulatedResponse.length} chars so far)...`,
                      timestamp: Date.now()
                    }
                  : msg
              ));
              
              // If we have section information, update the report sections
              if (reportMetadata?.section_content) {
                // Update the report with streaming content
                for (const [sectionKey, sectionContent] of Object.entries(reportMetadata.section_content)) {
                  if (sectionContent && sectionKey in newReport.sections) {
                    // Use type assertion to safely access newReport.sections
                    (newReport.sections as Record<string, string>)[sectionKey] = sectionContent as string;
                  }
                }
                
                // Update the UI with progress
                setReportState(newReport);
                setShowProgressIndicator(true);
              }
            }
          } catch (error) {
            console.warn('Error parsing streaming response:', error, 'Raw data:', data);
          }
        }
        
        // If we encountered an error, stop processing
        if (hasEncounteredError) {
          break;
        }
      }
      
      // Clean up
      try {
        await reader.cancel();
      } catch (e) {
        console.warn('Error cancelling reader:', e);
      }
      
      // If we didn't encounter an error, finalize the report
      if (!hasEncounteredError) {
        // Update the message to show completion
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId
            ? {
                ...msg,
                content: '✅ Your 4-box report has been generated! You can now review and edit it.',
                isStreaming: false,
                timestamp: Date.now()
              }
            : msg
        ));
        
        // Update UI state
        setIsProcessing(false);
        setIsGeneratingReport(false);
        setShowProgressIndicator(false);
      } else {
        // Reset processing state on error
        setIsProcessing(false);
        setIsGeneratingReport(false);
        setShowProgressIndicator(false);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setIsProcessing(false);
      setIsGeneratingReport(false);
      setShowProgressIndicator(false);
      
      // Update messages with error
      setMessages(prev => prev.map(msg => 
        msg.isStreaming 
          ? { 
              ...msg, 
              content: `❌ Error generating report: ${error instanceof Error ? error.message : 'Unknown error'}`, 
              isStreaming: false,
              metadata: { type: 'error' }
            }
          : msg
      ));
    }
  }, [uploadedDocuments, reportId, reportState]);
  
  /**
   * Handle sending a chat message
   */
  const handleSendMessage = useCallback(async (messageText: string) => {
    if (isProcessing) return;
    
    // Add the user message to the chat
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: messageText,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Check for specific commands
    if (messageText.toLowerCase().includes('generate report') || 
        messageText.toLowerCase().includes('create report') ||
        messageText.toLowerCase().includes('build report')) {
      generateReport();
      return;
    }
    
    // Otherwise, process as a regular chat message
    setIsProcessing(true);
    
    // Add a placeholder for the assistant's response
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true
    }]);
    
    try {
      const response = await fetch('/api/report-builder/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          reportSections: reportState.sections
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }
      
      const data: ChatResponse = await response.json();
      
      // Update the messages to include the assistant's response
      setMessages(prev => prev.map(msg => 
        msg.isStreaming 
          ? { ...msg, content: data.reply, isStreaming: false } 
          : msg
      ));
      
      // Safely handle the report update to avoid TypeScript errors
      const updatedReport = data.updatedReport;
      if (updatedReport) {
        // Create a safe reference to sections or empty object
        const updatedSections = updatedReport.sections || {};
        
        // Update the report state
        setReportState(prev => ({
          ...prev,
          ...updatedReport,
          sections: {
            ...prev.sections,
            ...updatedSections
          },
          metadata: {
            ...prev.metadata,
            lastUpdated: Date.now()
          }
        }));
        
        // Only proceed if we have sections
        if (Object.keys(updatedSections).length > 0) {
          // Add a message about the report update
          const updatedSectionKeys = Object.keys(updatedSections).join(', ');
          if (updatedSectionKeys) {
            setMessages(prev => [...prev, {
              id: uuidv4(),
              role: 'assistant',
              content: `✅ Updated the ${updatedSectionKeys} section of your report.`,
              timestamp: Date.now(),
              metadata: {
                type: 'report-update',
                section: updatedSectionKeys as ReportSectionKey
              }
            }]);
          }
        }
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update the streaming message with error text
      setMessages(prev => prev.map(msg => 
        msg.isStreaming 
          ? { 
              ...msg, 
              content: `❌ Error: ${error instanceof Error ? error.message : 'Failed to process message'}`, 
              isStreaming: false,
              metadata: { type: 'error' }
            }
          : msg
      ));
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, reportState, generateReport]);
  
  /**
   * Handle changes to the report state
   */
  const handleReportChange = useCallback((updatedReport: ReportState) => {
    setReportState(updatedReport);
  }, []);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-10rem)] min-h-[40rem]">
      <ChatInterface
        onSendMessage={handleSendMessage}
        messages={messages}
        isProcessing={isProcessing}
        onDocumentUploaded={handleDocumentUploaded}
        onDocumentRemoved={handleDocumentRemoved}
        uploadedDocuments={uploadedDocuments}
      />
      
      <div className="relative">
        <ReportEditor
          reportState={reportState}
          onReportChange={handleReportChange}
        />
        
        {isGeneratingReport && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10">
            <LoadingSpinner size="lg" />
            <h3 className="text-lg font-medium mt-4 mb-2">
              {showProgressIndicator ? 'Generating Report' : 'Processing Documents'}
            </h3>
            
            <div className="text-sm text-slate-500">
              {showProgressIndicator 
                ? 'Filling in each section of your report...' 
                : 'Streaming document content...'}
            </div>
            
            {reportProcessingError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm max-w-md">
                <p className="font-semibold">Error encountered:</p>
                <p>{reportProcessingError}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 