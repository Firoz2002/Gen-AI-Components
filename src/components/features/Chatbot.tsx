"use client";
import Image from 'next/image';
import DOMPurify from 'dompurify';
import { useState, useRef, useEffect } from 'react';
import { Send, X, Loader2 } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatbotProps = {
  initialMessage?: string;
  quickQuestions?: string[];
};

const sanitizedHTML = (html: string) => DOMPurify.sanitize(html);

const Chatbot = ({ 
  initialMessage = "👋 Hello! I'm Prabiha's AI assistant. How can I help you today?",
  quickQuestions = [
    "What is Prabisha Consulting?",
    "How do I join?",
    "What events are coming up?",
    "Who are the team behind this project?"
  ]
}: ChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages, isOpen]);

  const handleResetSession = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chatbot-session-id');
    }
    setMessages([]);
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('https://ai-generator-chi.vercel.app/api/ai-agent/chatbot', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.NEXT_PUBLIC_TOGETHERAI_API_KEY} `
        },
        body: JSON.stringify({ prompt: `You are a helpful assistant that answers questions only about Prabisha Consulting and it's services. ${input}` }),
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();

      if (data.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      }

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed bottom-9 right-9 z-50">
      {isOpen ? (
        <div className="w-80 md:w-96 h-[500px] bg-white dark:bg-[#0D0D14] rounded-xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 animate-fade-in-up">
          {/* Header */}
          <div className="bg-[#1a3dc2] text-white p-4 rounded-t-xl flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Image src="https://res.cloudinary.com/dv4d9tvcy/image/upload/v1749806434/Favicon-64-x-64_xnyrwy.png" alt="Logo" width={32} height={32} unoptimized priority />
              <h3 className="font-semibold">{"Prabisha's Chat Assistant"}</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 p-1 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex justify-end px-4 py-2 bg-white dark:bg-[#0D0D14] border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={handleResetSession}
              className="text-sm text-[#1a3dc2] dark:text-purple-400 hover:underline hover:text-blue-700 dark:hover:text-purple-300 transition-all"
            >
              + New Chat
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-[#0D0D14]">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg mr-auto max-w-[85%] border-l-4 border-blue-500 dark:border-purple-500">
                  <p className="text-gray-800 dark:text-gray-200">{initialMessage}</p>
                </div>
                
                {/* Quick questions */}
                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">You can ask me about:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickQuestion(question)}
                        className="bg-white dark:bg-[#1A1A2E] text-[#e05a1a] dark:text-purple-400 text-sm px-3 py-1.5 rounded-full border border-[#e05a1a] dark:border-purple-200/30 hover:bg-blue-50 dark:hover:bg-purple-500/10 transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`p-3 rounded-lg ${msg.role === 'user' 
                      ? 'bg-blue-100 dark:bg-blue-900/20 ml-auto max-w-[85%] text-right text-gray-800 dark:text-gray-200' 
                      : 'bg-white dark:bg-[#1A1A2E] mr-auto max-w-[85%] shadow-sm border-l-4 border-blue-500 dark:border-purple-500'}`}
                  >
                    <span 
                      className="text-gray-800 dark:text-gray-200" 
                      dangerouslySetInnerHTML={{ __html: sanitizedHTML(msg.content) }} 
                    />
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 p-3 bg-white dark:bg-[#1A1A2E] rounded-lg mr-auto max-w-[85%] shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm">Thinking...</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {/* Input form */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0D0D14] rounded-b-xl">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1F1F38] text-gray-700 dark:text-white dark:placeholder-gray-400 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-purple-500/50 focus:border-transparent transition-colors duration-200"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                className={`p-2 rounded-full ${isLoading ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-blue-600 dark:bg-purple-600 text-white hover:bg-blue-700 dark:hover:bg-purple-700'} transition-colors`}
                disabled={isLoading}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-white dark:bg-[#1A1A2E] text-blue-600 dark:text-white rounded-full shadow-lg hover:shadow-xl p-2 transition-all duration-300 border-2 border-[#1a3dc2] dark:border-purple-500 animate-pulse-slow relative group"
          aria-label="Open chat assistant"
        >
          <div className="absolute -top-3 -right-2 bg-[#e05a1a] dark:bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-bounce-subtle">Chat</div>
          <Image src={"https://res.cloudinary.com/dv4d9tvcy/image/upload/v1749806434/Favicon-64-x-64_xnyrwy.png"} alt="Logo" width={40} height={40} className="hidden sm:block" unoptimized />
        </button>
      )}
    </div>
  );
};

export default Chatbot;