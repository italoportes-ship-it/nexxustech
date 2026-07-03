import { useState, useRef } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { Streamdown } from "streamdown";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMutation = trpc.chat.send.useMutation();

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    scrollToBottom();

    chatMutation.mutate(
      { message: userMessage.content, sessionId, history: messages },
      {
        onSuccess: (data) => {
          setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
          setIsLoading(false);
          scrollToBottom();
        },
        onError: () => {
          setMessages((prev) => [...prev, { role: "assistant", content: "Desculpe, ocorreu um erro. Tente novamente." }]);
          setIsLoading(false);
          scrollToBottom();
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedPrompts = [
    "Quais softwares vocês oferecem?",
    "Preciso de uma solução de segurança",
    "Quais cursos estão disponíveis?",
    "Como funciona o licenciamento B2B?",
  ];

  return (
    <>
      {/* Toggle Button - positioned to avoid overlap with content */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-5 right-5 md:bottom-6 md:right-6 w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#0071E3] text-white shadow-lg flex items-center justify-center hover:bg-[#0077ED] transition-colors z-50"
            style={{ boxShadow: "0 8px 30px rgba(0, 113, 227, 0.4)" }}
          >
            <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window - full screen on mobile, floating on desktop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-4 md:inset-auto md:bottom-6 md:right-6 md:w-[380px] md:h-[560px] rounded-2xl md:rounded-3xl border border-border overflow-hidden z-50 flex flex-col"
            style={{
              background: "var(--popover)",
              backdropFilter: "saturate(180%) blur(20px)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0071E3] flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Assistente NexxusTECH</p>
                  <p className="text-xs text-green-400">Online</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 md:px-5 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-4 md:py-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    Olá! Como posso ajudar você hoje?
                  </p>
                  <div className="space-y-2">
                    {suggestedPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const userMessage: ChatMessage = { role: "user", content: prompt };
                          setMessages((prev) => [...prev, userMessage]);
                          setIsLoading(true);
                          chatMutation.mutate(
                            { message: prompt, sessionId, history: messages },
                            {
                              onSuccess: (data) => {
                                setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
                                setIsLoading(false);
                                scrollToBottom();
                              },
                              onError: () => {
                                setMessages((prev) => [...prev, { role: "assistant", content: "Desculpe, ocorreu um erro." }]);
                                setIsLoading(false);
                              },
                            }
                          );
                        }}
                        className="block w-full text-left text-xs px-3 py-2.5 rounded-xl bg-accent text-muted-foreground hover:bg-accent/80 hover:text-foreground transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-[#0071E3] text-white rounded-br-md"
                        : "bg-accent text-foreground/80 rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <Streamdown>{msg.content}</Streamdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-accent">
                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 md:px-4 py-3 border-t border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-4 py-2.5 bg-accent border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#0071E3] transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-9 h-9 rounded-xl bg-[#0071E3] flex items-center justify-center text-white disabled:opacity-30 transition-opacity flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
