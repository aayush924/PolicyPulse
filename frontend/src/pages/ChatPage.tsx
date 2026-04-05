import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquarePlus,
  Send,
  Trash2,
  MessageSquare,
  Clock,
  Bot,
  User,
  AlertCircle,
  PanelLeftClose,
  PanelLeft,
  Paperclip,
  FileText,
  X,
} from "lucide-react";
import {
  listConversations,
  createConversation,
  getConversation,
  deleteConversation,
  sendMessage,
  uploadConversationDocument,
  getConversationDocuments,
  deleteConversationDocument,
} from "@/lib/api";
import type { Conversation, ChatMessage, ConversationDocument } from "@/types";

interface ChatPageProps {
  token: string;
  focusConversationId?: string | null;
  onFocusConversationHandled?: () => void;
  initialQuestion?: string;
}

function TypingIndicator() {
  return (
    <div className="flex gap-1.5 px-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-blue-600"
          animate={{
            y: [0, -6, 0],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function ChatLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative w-10 h-10">
        <motion.div
          className="absolute inset-0 rounded-full border border-blue-200"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-[3px] rounded-full border border-transparent border-t-blue-600"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-[8px] rounded-full border border-transparent border-b-blue-400"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.3, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <motion.p
        className="text-xs text-slate-600"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Loading messages…
      </motion.p>
    </div>
  );
}

export function ChatPage({
  token,
  focusConversationId,
  onFocusConversationHandled,
  initialQuestion,
}: ChatPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [documents, setDocuments] = useState<ConversationDocument[]>([]);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => { loadConversations(); }, []);

  async function loadConversations() {
    setLoadingConvs(true);
    try {
      const convs = await listConversations(token);
      setConversations(convs);
    } catch {
      setError("Failed to load conversations");
    } finally {
      setLoadingConvs(false);
    }
  }

  const openConversation = useCallback(
    async (id: string) => {
      setActiveId(id);
      setMessages([]);
      setDocuments([]);
      setError("");
      setLoadingMessages(true);
      try {
        const [detail, docs] = await Promise.all([
          getConversation(id, token),
          getConversationDocuments(id, token),
        ]);
        setMessages(detail.messages);
        setDocuments(docs);
      } catch {
        setError("Failed to load conversation");
      } finally {
        setLoadingMessages(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!focusConversationId) return;
    void openConversation(focusConversationId).finally(() => {
      onFocusConversationHandled?.();
    });
  }, [focusConversationId, openConversation, onFocusConversationHandled]);

  useEffect(() => {
    if (initialQuestion) {
      setInput(initialQuestion);
      inputRef.current?.focus();
    }
  }, [initialQuestion]);

  async function handleNewChat() {
    setError("");
    try {
      const conv = await createConversation(token);
      setConversations((prev) => [conv, ...prev]);
      setActiveId(conv.id);
      setMessages([]);
      inputRef.current?.focus();
    } catch {
      setError("Failed to create conversation");
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await deleteConversation(id, token);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
        setDocuments([]);
      }
    } catch {
      setError("Failed to delete conversation");
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    // Validate file type
    const allowedTypes = [".pdf", ".docx", ".txt"];
    const fileName = file.name.toLowerCase();
    const isValid = allowedTypes.some(type => fileName.endsWith(type));
    
    if (!isValid) {
      setError(`Invalid file type. Allowed: PDF, DOCX, TXT`);
      return;
    }

    // Validate file size (20 MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File too large. Maximum size is 20 MB.");
      return;
    }

    let targetId = activeId;
    if (!targetId) {
      try {
        const conv = await createConversation(token);
        setConversations((prev) => [conv, ...prev]);
        targetId = conv.id;
        setActiveId(conv.id);
      } catch {
        setError("Failed to create conversation");
        return;
      }
    }

    setUploading(true);
    setError("");
    try {
      const doc = await uploadConversationDocument(targetId, file, token);
      setDocuments((prev) => [...prev, doc]);
    } catch (err: any) {
      setError(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveDocument(docId: string) {
    if (!activeId) return;
    try {
      await deleteConversationDocument(activeId, docId, token);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err: any) {
      setError(err.message || "Failed to remove document");
    }
  }

  async function handleSend() {
    if (!input.trim() || sending) return;

    let targetId = activeId;
    if (!targetId) {
      try {
        const conv = await createConversation(token);
        setConversations((prev) => [conv, ...prev]);
        targetId = conv.id;
        setActiveId(conv.id);
        setDocuments([]);
      } catch {
        setError("Failed to create conversation");
        return;
      }
    }

    const userText = input.trim();
    setInput("");
    setSending(true);
    setError("");

    const optimisticUser: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: targetId,
      role: "user",
      content: userText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const resp = await sendMessage(targetId, userText, token);
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== optimisticUser.id);
        return [...filtered, resp.user_message, resp.assistant_message];
      });
      const convs = await listConversations(token);
      setConversations(convs);
    } catch (err: any) {
      setError(err.message || "Failed to send message");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  function sanitizeMessageText(text: string) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/~~(.*?)~~/g, "$1");
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* ── Sidebar ──────────────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarOpen ? 320 : 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="bg-white/60 backdrop-blur-2xl border-r border-slate-200 flex flex-col overflow-hidden shrink-0"
      >
        <div className="p-4 border-b border-slate-200">
          <motion.button
            onClick={handleNewChat}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-[#0000FF] text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-500/10"
          >
            <MessageSquarePlus className="w-4 h-4" />
            New Chat
          </motion.button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-12">
              <div className="relative w-8 h-8">
                <motion.div
                  className="absolute inset-0 rounded-full border border-transparent border-t-blue-500"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 px-4"
            >
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-600">No conversations yet</p>
              <p className="text-xs text-slate-500 mt-1">Start a new chat to ask about drug policies</p>
            </motion.div>
          ) : (
            <div className="py-2">
              <AnimatePresence>
                {conversations.map((conv, i) => (
                  <motion.button
                    key={conv.id}
                    onClick={() => openConversation(conv.id)}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16, height: 0 }}
                    transition={{ delay: i * 0.03 }}
                    whileHover={{ backgroundColor: "rgba(59,130,246,0.05)" }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 group transition-colors ${
                      activeId === conv.id ? "bg-blue-50 border-r-2 border-blue-500" : ""
                    }`}
                  >
                    <MessageSquare
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        activeId === conv.id ? "text-blue-600" : "text-slate-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        activeId === conv.id ? "text-blue-700" : "text-slate-700"
                      }`}>
                        {conv.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(conv.updated_at)}
                      </p>
                    </div>
                    <motion.button
                      onClick={(e) => handleDelete(conv.id, e)}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.aside>

      {/* ── Main chat area ───────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="h-12 border-b border-slate-200 flex items-center px-4 gap-3 bg-white/80 backdrop-blur-2xl shrink-0">
          <motion.button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
          </motion.button>
          <motion.div
            className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Bot className="w-4 h-4 text-blue-600" />
          </motion.div>
          <h2 className="text-sm font-medium text-slate-700 truncate tracking-tight">
            {activeId
              ? conversations.find((c) => c.id === activeId)?.title || "Care Assistant"
              : "PolicyPulse Care Assistant"}
          </h2>
        </div>

        {/* ── Messages ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {!activeId && messages.length === 0 && (
            <motion.div
              className="flex flex-col items-center justify-center h-full text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Bot className="w-8 h-8 text-blue-600" />
              </motion.div>
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-1">PolicyPulse Chat</h3>
              <p className="text-sm text-slate-600 max-w-md">
                Ask questions about drug coverage policies, prior authorization
                requirements, step therapy, and more.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                {[
                  "What does prior authorization mean?",
                  "How does step therapy work?",
                  "What's covered under my plan for Humira?",
                  "What documents do I need for approval?",
                ].map((q, i) => (
                  <motion.button
                    key={q}
                    onClick={() => {
                      setInput(q);
                      inputRef.current?.focus();
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    whileHover={{ y: -2, borderColor: "rgba(59,130,246,0.3)", backgroundColor: "rgba(59,130,246,0.05)" }}
                    whileTap={{ scale: 0.97 }}
                    className="px-4 py-3 text-left text-sm text-slate-700 bg-blue-50 border border-blue-200 rounded-xl transition-colors"
                  >
                    {q}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <ChatLoader />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, delay: i === messages.length - 1 ? 0.1 : 0 }}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <motion.div
                        className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-1"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Bot className="w-4 h-4 text-blue-600" />
                      </motion.div>
                    )}
                    <motion.div
                      whileHover={{ scale: 1.005 }}
                      className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-blue-600 to-[#0000FF] text-white rounded-br-md shadow-lg shadow-blue-500/10"
                          : "bg-slate-100 text-slate-900 rounded-bl-md border border-slate-200"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{sanitizeMessageText(msg.content)}</div>
                      <p className={`text-xs mt-2 ${msg.role === "user" ? "text-blue-200/50" : "text-slate-600"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </motion.div>
                    {msg.role === "user" && (
                      <motion.div
                        className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0 mt-1"
                        whileHover={{ scale: 1.1, rotate: -5 }}
                      >
                        <User className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {sending && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="bg-slate-100 border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3">
                    <TypingIndicator />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Error ──────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="px-4 pb-2"
            >
              <div className="max-w-3xl mx-auto bg-red-100 border border-red-300 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
                <button
                  onClick={() => setError("")}
                  className="ml-auto text-red-600 hover:text-red-800 transition-colors"
                >
                  &times;
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Input ──────────────────────────────────────── */}
        <div className="border-t border-slate-200 bg-white/80 backdrop-blur-2xl p-4">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence>
              {documents.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 mb-3"
                >
                  {documents.map((doc) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 border border-blue-300 rounded-lg text-xs text-blue-700 max-w-xs"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{doc.filename}</span>
                      <motion.button
                        onClick={() => handleRemoveDocument(doc.id)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.8 }}
                        className="ml-0.5 text-blue-600 hover:text-blue-800 transition-colors shrink-0"
                        title="Remove document"
                      >
                        <X className="w-3 h-3" />
                      </motion.button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={handleFileSelect}
              />

              <motion.button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || sending}
                whileHover={{ scale: 1.05, borderColor: "rgba(59,130,246,0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="p-3 text-slate-500 hover:text-blue-600 border border-slate-300 rounded-xl bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                title="Attach document"
              >
                {uploading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Paperclip className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <Paperclip className="w-5 h-5" />
                )}
              </motion.button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about drug coverage, prior auth, step therapy..."
                rows={1}
                className="flex-1 resize-none px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg sm:rounded-xl text-xs sm:text-sm bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 outline-none transition-all max-h-32"
                style={{
                  height: "auto",
                  minHeight: "40px",
                  overflow: input.split("\n").length > 3 ? "auto" : "hidden",
                }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 128) + "px";
                }}
              />

              <motion.button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                whileHover={{ scale: sending ? 1 : 1.05 }}
                whileTap={{ scale: sending ? 1 : 0.95 }}
                className="p-2 sm:p-3 bg-gradient-to-r from-blue-600 to-[#0000FF] text-white rounded-lg sm:rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0 shadow-lg shadow-blue-500/10"
              >
                {sending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.div>
                ) : (
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </motion.button>
            </div>
          </div>
          <p className="text-xs text-slate-600 text-center mt-2">
            PolicyPulse Chat uses AI to explain drug coverage policies. Always verify with your insurance provider.
          </p>
        </div>
      </div>
    </div>
  );
}
