import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Send,
  Upload,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Mic,
  Volume2,
  User,
  Shield,
  Search,
  PlusCircle,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Bell,
} from "lucide-react";
function Button({ children, className = "", variant = "default", size = "default", ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    default: "bg-slate-900 text-white hover:bg-slate-800",
    outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    icon: "h-10 w-10",
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return <div className={`border bg-white ${className}`}>{children}</div>;
}

function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

const sampleMessages = [
  {
    id: 1,
    role: "assistant",
    text: "Hello! I am Campus AI Copilot. Ask me anything from your college documents, syllabus, notices, or placement rules.",
    source: null,
  },
  {
    id: 2,
    role: "user",
    text: "What is the eligibility for campus placements?",
    source: null,
  },
  {
    id: 3,
    role: "assistant",
    text: "According to the uploaded placement policy, students must satisfy the minimum CGPA requirement, have no active backlogs, and meet the attendance criteria specified by the college placement cell.",
    source: "Placement_Policy_2026.pdf",
  },
];

const sampleDocuments = [
  {
    id: 1,
    title: "Placement Policy 2026",
    category: "Placement",
    fileName: "Placement_Policy_2026.pdf",
    status: "Processed",
  },
  {
    id: 2,
    title: "CSE Syllabus",
    category: "Syllabus",
    fileName: "CSE_Syllabus.pdf",
    status: "Processed",
  },
  {
    id: 3,
    title: "Internal Exam Circular",
    category: "Notice",
    fileName: "Exam_Circular.pdf",
    status: "Pending",
  },
];

function Sidebar({ activePage, setActivePage }) {
  const menu = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "chat", label: "Ask AI", icon: MessageSquare },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "admin", label: "Admin Upload", icon: Shield },
  ];

  return (
    <aside className="hidden min-h-screen w-72 border-r bg-white p-5 md:block">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
          <Bot size={24} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Campus AI</h1>
          <p className="text-xs text-slate-500">Student Copilot</p>
        </div>
      </div>

      <nav className="space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-10 rounded-3xl bg-slate-100 p-4">
        <p className="text-sm font-semibold text-slate-800">MVP Goal</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          Upload college PDFs, ask questions, and get source-grounded AI answers.
        </p>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="flex items-center justify-between border-b bg-white px-5 py-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Campus AI Copilot</h2>
        <p className="text-sm text-slate-500">RAG-based assistant for college students</p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" className="hidden rounded-2xl md:flex">
          <Bell size={16} className="mr-2" /> Notices
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
          <User size={18} />
        </div>
      </div>
    </header>
  );
}

function StatCard({ icon: Icon, title, value, note }) {
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
            <p className="mt-1 text-xs text-slate-500">{note}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Icon size={21} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-5"
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={FileText} title="Documents" value="12" note="Uploaded to knowledge base" />
        <StatCard icon={MessageSquare} title="Questions" value="248" note="Asked by students" />
        <StatCard icon={BookOpen} title="Syllabus Files" value="5" note="Available for RAG search" />
        <StatCard icon={GraduationCap} title="Placement Docs" value="3" note="Ready for student queries" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-3xl shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-lg font-bold text-slate-900">Suggested Student Questions</h3>
            <div className="mt-4 space-y-3">
              {[
                "What is the placement eligibility criteria?",
                "Summarise Unit 1 of DBMS syllabus.",
                "What is the internal exam pattern?",
                "Create a 7-day Java DSA preparation plan.",
              ].map((question) => (
                <div key={question} className="rounded-2xl bg-slate-100 p-3 text-sm text-slate-700">
                  {question}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-lg font-bold text-slate-900">Project Modules</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { icon: Upload, title: "PDF Upload", text: "Admin uploads documents" },
                { icon: Search, title: "Vector Search", text: "Finds relevant chunks" },
                { icon: Bot, title: "AI Answer", text: "LLM generates response" },
                { icon: ClipboardList, title: "Source Proof", text: "Shows source document" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border p-4">
                    <Icon size={20} className="text-slate-700" />
                    <p className="mt-2 font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-6 ${
          isUser ? "bg-slate-900 text-white" : "bg-white text-slate-800 shadow-sm"
        }`}
      >
        <p>{message.text}</p>
        {message.source && (
          <div className="mt-3 rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-600">
            Source: {message.source}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatPage() {
  const [messages, setMessages] = useState(sampleMessages);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMessage = {
      id: Date.now(),
      role: "user",
      text: input,
      source: null,
    };
    const aiMessage = {
      id: Date.now() + 1,
      role: "assistant",
      text: "This is a frontend demo response. In the backend phase, this answer will come from RAG search over uploaded college documents.",
      source: "Demo_Document.pdf",
    };
    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setInput("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-[calc(100vh-81px)] flex-col p-5"
    >
      <div className="mb-4">
        <h3 className="text-xl font-bold text-slate-900">Ask Campus AI</h3>
        <p className="text-sm text-slate-500">Ask questions from uploaded college PDFs and notices.</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-3xl bg-slate-100 p-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-3xl border bg-white p-3 shadow-sm">
        <Button variant="outline" size="icon" className="rounded-2xl">
          <Mic size={18} />
        </Button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask about syllabus, placement rules, notices..."
          className="flex-1 bg-transparent px-2 text-sm outline-none"
        />
        <Button variant="outline" size="icon" className="rounded-2xl">
          <Volume2 size={18} />
        </Button>
        <Button onClick={sendMessage} className="rounded-2xl bg-slate-900">
          <Send size={17} className="mr-2" /> Send
        </Button>
      </div>
    </motion.div>
  );
}

function DocumentCard({ document }) {
  const statusClass =
    document.status === "Processed"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-amber-100 text-amber-700";

  return (
    <Card className="rounded-3xl shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
            <FileText size={22} className="text-slate-700" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-900">{document.title}</h4>
            <p className="mt-1 text-sm text-slate-500">{document.fileName}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                {document.category}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs ${statusClass}`}>{document.status}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 p-5"
    >
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Knowledge Documents</h3>
          <p className="text-sm text-slate-500">Documents used by the AI assistant for RAG answers.</p>
        </div>
        <Button className="rounded-2xl bg-slate-900">
          <PlusCircle size={17} className="mr-2" /> Add Document
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sampleDocuments.map((document) => (
          <DocumentCard key={document.id} document={document} />
        ))}
      </div>
    </motion.div>
  );
}

function AdminUploadPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-5 p-5 lg:grid-cols-2"
    >
      <Card className="rounded-3xl shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-slate-900">Upload College Document</h3>
          <p className="mt-1 text-sm text-slate-500">
            Upload syllabus, notices, placement rules, or timetable PDFs.
          </p>

          <div className="mt-6 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm">
              <Upload size={28} className="text-slate-700" />
            </div>
            <p className="mt-4 font-semibold text-slate-900">Drag and drop PDF here</p>
            <p className="mt-1 text-sm text-slate-500">or click to browse from your system</p>
            <Button className="mt-5 rounded-2xl bg-slate-900">Choose PDF</Button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Document Title</label>
              <input
                placeholder="Example: Placement Rules 2026"
                className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Category</label>
              <select className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-slate-900">
                <option>Syllabus</option>
                <option>Notice</option>
                <option>Placement</option>
                <option>Timetable</option>
                <option>Exam</option>
              </select>
            </div>
          </div>

          <Button className="mt-5 w-full rounded-2xl bg-slate-900 py-6">
            Upload and Process Document
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-slate-900">Processing Flow</h3>
          <div className="mt-5 space-y-4">
            {[
              "PDF is uploaded by admin",
              "Text is extracted from the PDF",
              "Text is split into smaller chunks",
              "Embeddings are generated",
              "Chunks are stored in vector database",
              "Students can ask questions from this document",
            ].map((step, index) => (
              <div key={step} className="flex gap-3 rounded-2xl bg-slate-100 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  {index + 1}
                </div>
                <p className="text-sm text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function CampusAICopilotFrontend() {
  const [activePage, setActivePage] = useState("dashboard");

  const renderPage = () => {
    if (activePage === "dashboard") return <DashboardPage />;
    if (activePage === "chat") return <ChatPage />;
    if (activePage === "documents") return <DocumentsPage />;
    if (activePage === "admin") return <AdminUploadPage />;
    return <DashboardPage />;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex">
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        <main className="min-h-screen flex-1">
          <Topbar />
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
