import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Routes, Route, Navigate, NavLink, useNavigate, useParams, useLocation, Outlet, Link,
} from "react-router-dom";
import { api } from "./api.js";
import { getSocket, disconnectSocket } from "./socket.js";
import {
  Bot, Send, Upload, FileText, LayoutDashboard, MessageSquare,
  User, Shield, Search, PlusCircle, Bell, Settings, LogOut, ScrollText, X,
  Mail, Lock, Eye, EyeOff, Home, Users, Calendar, Heart, MessageCircle, Share2,
  Bookmark, Sparkles, TrendingUp, MapPin, Clock, UserPlus, Image as ImageIcon,
  Smile, CheckCircle2, Briefcase, Loader2, KeyRound, Edit3, Check, Paperclip,
} from "lucide-react";

/* ---------- Primitives ---------- */

function Button({ children, className = "", variant = "default", size = "default", ...props }) {
  const base = "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg",
    outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300",
    ghost: "text-slate-700 hover:bg-slate-100",
    soft: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
  };
  const sizes = { default: "h-10 px-4 py-2", icon: "h-10 w-10", sm: "h-8 px-3 text-xs", lg: "h-12 px-6 text-base" };
  return (
    <button className={`${base} ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Card({ children, className = "" }) { return <div className={`border border-slate-200/70 bg-white ${className}`}>{children}</div>; }
function CardContent({ children, className = "" }) { return <div className={className}>{children}</div>; }

function Avatar({ name, src, size = 40, gradient = "from-indigo-500 to-violet-500" }) {
  const initials = (name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  if (src) {
    return (
      <img src={src} alt={name || "avatar"} style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover shadow-sm" />
    );
  }
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.4 }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} font-semibold text-white shadow-sm`}>
      {initials}
    </div>
  );
}

function Spinner({ size = 18 }) { return <Loader2 size={size} className="animate-spin text-indigo-600" />; }

function parseTs(ts) {
  if (!ts) return null;
  const iso = typeof ts === "string" && !/[zZ]|[+\-]\d\d:?\d\d$/.test(ts)
    ? ts.replace(" ", "T") + "Z"
    : ts;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function timeAgo(ts) {
  const d = parseTs(ts);
  if (!d) return "";
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return d.toLocaleDateString();
}

function clockTime(ts) {
  const d = parseTs(ts);
  if (!d) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (sameDay) return time;
  if (isYesterday) return `Yesterday ${time}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
}

const gradientForId = (id) => {
  const palette = [
    "from-pink-500 to-rose-500", "from-indigo-500 to-violet-500", "from-amber-500 to-orange-500",
    "from-emerald-500 to-teal-500", "from-fuchsia-500 to-purple-500", "from-sky-500 to-blue-500",
  ];
  return palette[(Number(id) || 0) % palette.length];
};

/* ---------- Layout ---------- */

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/feed", label: "Campus Feed", icon: Home },
  { to: "/chat", label: "Ask AI", icon: Sparkles },
  { to: "/messages", label: "Messages", icon: MessageSquare, badgeKey: "unreadMessages" },
  { to: "/connect", label: "Connect", icon: Users },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/notifications", label: "Notifications", icon: Bell, badgeKey: "unreadNotifications" },
  { to: "/admin", label: "Admin Upload", icon: Shield, adminOnly: true },
];

function Sidebar({ badges, session }) {
  const items = NAV_ITEMS.filter((i) => !i.adminOnly || session?.is_admin);
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-slate-200/70 bg-white/80 p-5 backdrop-blur md:block">
      <Link to="/dashboard" className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200"><Bot size={24} /></div>
        <div>
          <h1 className="bg-gradient-to-r from-indigo-700 to-violet-700 bg-clip-text text-lg font-bold text-transparent">Campus AI</h1>
          <p className="text-xs text-slate-500">Your campus, smarter.</p>
        </div>
      </Link>
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const badge = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => `flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                isActive ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200" : "text-slate-600 hover:bg-slate-100"
              }`}>
              {({ isActive }) => (<>
                <Icon size={18} />
                <span className="flex-1 text-left">{item.label}</span>
                {badge > 0 && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? "bg-white/30 text-white" : "bg-rose-500 text-white"}`}>{badge}</span>}
              </>)}
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-10 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white shadow-lg shadow-indigo-200">
        <Sparkles size={22} />
        <p className="mt-3 text-sm font-semibold">Try the AI Copilot</p>
        <p className="mt-1 text-xs leading-5 text-indigo-100">Ask anything about syllabus, placements, or notices.</p>
      </div>
    </aside>
  );
}

function Topbar({ session, onProfileClick, unreadNotifications }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/80 px-5 py-3 backdrop-blur">
      <div className="flex flex-1 items-center gap-4">
        <div className="flex h-10 w-full max-w-md items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4">
          <Search size={16} className="text-slate-400" />
          <input placeholder="Search..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => navigate("/notifications")} className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100">
          <Bell size={18} />
          {unreadNotifications > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />}
        </button>
        <button onClick={onProfileClick} className="flex items-center gap-2 rounded-full p-1 pr-3 transition hover:bg-slate-100">
          <Avatar name={session?.name || "Student"} src={api.avatarUrl(session?.avatar_path)} size={36} />
          <span className="hidden text-sm font-medium text-slate-700 md:inline">{session?.name?.split(" ")[0] || "Student"}</span>
        </button>
      </div>
    </header>
  );
}

function ProfilePanel({ open, onClose, session, onSignOut }) {
  const navigate = useNavigate();
  const go = (path) => { onClose(); navigate(path); };
  const items = [
    { icon: User, label: "My Profile", onClick: () => go(`/profile/${session?.id}`) },
    { icon: Settings, label: "Settings", onClick: () => go("/settings") },
    { icon: KeyRound, label: "Change Password", onClick: () => go("/change-password") },
    { icon: ScrollText, label: "Terms and Conditions", onClick: () => go("/terms") },
  ];
  return (
    <>
      {open && <div onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" />}
      <aside className={`fixed right-0 top-0 z-50 h-screen w-80 max-w-full transform border-l bg-white shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-lg font-bold text-slate-900">Profile</h3>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="border-b px-5 py-6">
          <div className="flex items-center gap-3">
            <Avatar name={session?.name || "Student"} src={api.avatarUrl(session?.avatar_path)} size={56} gradient={gradientForId(session?.id)} />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-slate-900">{session?.name || "Student"}</p>
                {session?.is_admin && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">ADMIN</span>}
              </div>
              <p className="text-xs text-slate-500">{session?.email}</p>
              {session?.branch && <p className="mt-1 text-xs text-slate-500">{session.branch}{session.year ? ` · ${session.year}` : ""}</p>}
            </div>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.label} onClick={item.onClick} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                <Icon size={18} /> {item.label}
              </button>
            );
          })}
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t p-3">
          <button onClick={onSignOut} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

function ProtectedLayout({ session, badges, onSignOut, profileOpen, setProfileOpen }) {
  if (!session) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/30 text-slate-900">
      <div className="flex">
        <Sidebar badges={badges} session={session} />
        <main className="min-h-screen flex-1">
          <Topbar session={session} onProfileClick={() => setProfileOpen(true)} unreadNotifications={badges.unreadNotifications} />
          {session.is_suspended && (
            <div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">
              Your account is suspended due to repeated policy violations. You can browse but cannot post, comment, or message.
            </div>
          )}
          <Outlet />
        </main>
      </div>
      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} session={session} onSignOut={onSignOut} />
    </div>
  );
}

/* ---------- Pages ---------- */

function StatCard({ icon: Icon, title, value, note, gradient }) {
  return (
    <Card className="rounded-3xl shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
            <p className="mt-1 text-xs text-slate-500">{note}</p>
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-sm`}><Icon size={21} /></div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardPage({ session, stats }) {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-5 md:p-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-lg shadow-indigo-200 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-indigo-100">Welcome back,</p>
            <h2 className="mt-1 text-2xl font-bold md:text-3xl">{session?.name?.split(" ")[0] || "Student"} 👋</h2>
            <p className="mt-2 max-w-xl text-sm text-indigo-100">Connect with peers, track placements, and ask the AI anything about your college.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => navigate("/chat")} className="rounded-2xl bg-white text-indigo-700 shadow-none hover:bg-indigo-50"><Sparkles size={16} className="mr-2" /> Ask Campus AI</Button>
              <Button onClick={() => navigate("/feed")} variant="outline" className="rounded-2xl border-white/40 bg-white/10 text-white hover:bg-white/20">Open Feed</Button>
            </div>
          </div>
          <div className="hidden h-32 w-32 shrink-0 items-center justify-center rounded-3xl bg-white/10 backdrop-blur md:flex"><Bot size={64} /></div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FileText} title="Documents" value={stats.documents} note="In knowledge base" gradient="from-indigo-500 to-violet-500" />
        <StatCard icon={MessageSquare} title="Posts" value={stats.posts} note="In your feed" gradient="from-fuchsia-500 to-pink-500" />
        <StatCard icon={Users} title="Students" value={stats.users} note="On the platform" gradient="from-emerald-500 to-teal-500" />
        <StatCard icon={Calendar} title="Upcoming Events" value={stats.events} note="On the calendar" gradient="from-amber-500 to-orange-500" />
      </div>
    </motion.div>
  );
}

/* ---------- Feed (with comments + share) ---------- */

function ShareModal({ post, currentUser, onClose }) {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [sentTo, setSentTo] = useState(new Set());

  useEffect(() => {
    let alive = true;
    api.users.following(currentUser.id)
      .then((d) => { if (alive) setPeople(d.users || []); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [currentUser.id]);

  const sendTo = async (u) => {
    setBusyId(u.id);
    try {
      const text = `📌 Shared a post from ${post.author?.name || "Campus"}:\n\n"${post.content}"\n\n${window.location.origin}/feed#post-${post.id}`;
      await api.messages.send(u.id, text);
      setSentTo((s) => new Set(s).add(u.id));
    } catch (e) { alert(e.message); }
    finally { setBusyId(null); }
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-bold text-slate-900">Share to a follower</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"><X size={16} /></button>
        </div>
        <p className="mt-3 text-xs text-slate-500">This sends the post as a direct message. You can only share with people you follow.</p>
        <div className="mt-4 max-h-80 space-y-1 overflow-y-auto">
          {loading ? <div className="flex justify-center py-6"><Spinner /></div> :
            people.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">You aren't following anyone yet. Follow students from the Connect page.</p> :
            people.map((u) => {
              const sent = sentTo.has(u.id);
              return (
                <div key={u.id} className="flex items-center gap-3 rounded-2xl p-2">
                  <Avatar name={u.name} src={api.avatarUrl(u.avatar_path)} gradient={gradientForId(u.id)} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{u.name}</p>
                    <p className="truncate text-xs text-slate-500">{u.branch || ""}{u.year ? ` · ${u.year}` : ""}</p>
                  </div>
                  <Button size="sm" variant={sent ? "outline" : "default"} className="rounded-xl"
                    disabled={sent || busyId === u.id} onClick={() => sendTo(u)}>
                    {sent ? <><Check size={12} className="mr-1" /> Sent</> : busyId === u.id ? "..." : "Send"}
                  </Button>
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}

function PostCard({ post, onLike, onTagClick, currentUser }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(null);
  const [draft, setDraft] = useState("");
  const [count, setCount] = useState(post.comments);
  const [commentError, setCommentError] = useState("");
  const [shareOpen, setShareOpen] = useState(false);

  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments === null) {
      const { comments } = await api.posts.comments(post.id);
      setComments(comments);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setCommentError("");
    try {
      const { comment } = await api.posts.comment(post.id, draft);
      setComments((c) => [...(c || []), comment]);
      setCount((n) => n + 1);
      setDraft("");
    } catch (err) {
      setCommentError(err.message);
    }
  };


  return (
    <Card id={`post-${post.id}`} className={`rounded-3xl shadow-sm ${post.pinned ? "ring-2 ring-indigo-200" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <Link to={`/profile/${post.author?.id}`} className="flex gap-3">
            <Avatar name={post.author?.name} src={api.avatarUrl(post.author?.avatar_path)} gradient={gradientForId(post.author?.id)} size={44} />
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-900 hover:underline">{post.author?.name || "Unknown"}</p>
                {post.pinned && <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700"><CheckCircle2 size={10} /> PINNED</span>}
              </div>
              <p className="text-xs text-slate-500">{post.author?.branch || ""}{post.author?.year ? ` · ${post.author.year}` : ""} · {timeAgo(post.created_at)}</p>
            </div>
          </Link>
          <Button variant="ghost" size="icon" className="rounded-full"><Bookmark size={16} /></Button>
        </div>
        {post.content && <p className="mt-4 text-sm leading-6 text-slate-700">{post.content}</p>}
        {post.image_path && (
          <img
            src={api.postImageUrl(post.image_path)}
            alt="post"
            className="mt-3 max-h-[480px] w-full rounded-2xl object-cover"
            loading="lazy"
          />
        )}
        {post.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <button key={t} type="button" onClick={() => onTagClick && onTagClick(t)}
                className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100">
                {t}
              </button>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-center gap-1 border-t border-slate-100 pt-3 text-slate-500">
          <Button onClick={() => onLike(post.id)} variant="ghost" size="sm" className={`rounded-xl hover:text-rose-600 ${post.liked ? "text-rose-600" : ""}`}>
            <Heart size={16} className="mr-1" fill={post.liked ? "currentColor" : "none"} /> {post.likes}
          </Button>
          <Button onClick={toggleComments} variant="ghost" size="sm" className="rounded-xl hover:text-indigo-600">
            <MessageCircle size={16} className="mr-1" /> {count}
          </Button>
          <Button onClick={() => setShareOpen(true)} variant="ghost" size="sm" className="rounded-xl hover:text-emerald-600">
            <Share2 size={16} className="mr-1" /> Share
          </Button>
        </div>

        {showComments && (
          <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4">
            {comments === null ? (
              <div className="flex justify-center"><Spinner /></div>
            ) : comments.length === 0 ? (
              <p className="text-center text-xs text-slate-500">Be the first to comment.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <Avatar name={c.author_name} src={api.avatarUrl(c.author_avatar)} gradient={gradientForId(c.user_id)} size={32} />
                  <div className="flex-1 rounded-2xl bg-white px-3 py-2 shadow-sm">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900">{c.author_name}</p>
                      <span className="text-[10px] text-slate-400">{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-700">{c.content}</p>
                  </div>
                </div>
              ))
            )}
            {commentError && <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600">{commentError}</div>}
            <form onSubmit={submitComment} className="flex items-center gap-2">
              <Avatar name={currentUser?.name} src={api.avatarUrl(currentUser?.avatar_path)} gradient={gradientForId(currentUser?.id)} size={32} />
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a comment..."
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400" />
              <Button type="submit" size="sm" className="rounded-xl">Post</Button>
            </form>
          </div>
        )}
      </CardContent>
      {shareOpen && <ShareModal post={post} currentUser={currentUser} onClose={() => setShareOpen(false)} />}
    </Card>
  );
}

function FeedPage({ session }) {
  const [posts, setPosts] = useState([]);
  const [draft, setDraft] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trending, setTrending] = useState([]);
  const [activeTag, setActiveTag] = useState("");
  const imgInputRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.posts.list(activeTag)
      .then((data) => { if (alive) setPosts(data.posts); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [activeTag]);

  useEffect(() => {
    let alive = true;
    api.posts.trending().then((d) => { if (alive) setTrending(d.trending || []); }).catch(() => {});
    return () => { alive = false; };
  }, [posts.length]);

  const submit = async () => {
    if (!draft.trim() && !image) return;
    setError("");
    try {
      const tags = (draft.match(/#\w+/g) || []);
      const { post } = await api.posts.create(draft, tags, image);
      setPosts((p) => [post, ...p]);
      setDraft(""); setImage(null);
    } catch (e) { setError(e.message); }
  };

  const onPickImage = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { setError("Max image size is 10 MB."); return; }
    setImage(f);
    e.target.value = "";
  };

  const toggleLike = async (id) => {
    try {
      const { liked, likes } = await api.posts.like(id);
      setPosts((ps) => ps.map((p) => p.id === id ? { ...p, liked, likes } : p));
    } catch (e) { setError(e.message); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 p-5 md:p-6 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <Card className="rounded-3xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex gap-3">
              <Avatar name={session?.name} src={api.avatarUrl(session?.avatar_path)} size={44} gradient={gradientForId(session?.id)} />
              <div className="flex-1">
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Share something with your campus... (use #tags)" rows={2}
                  disabled={session?.is_suspended}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white disabled:opacity-50" />

                {image && (
                  <div className="mt-3 relative inline-block">
                    <img src={URL.createObjectURL(image)} alt="preview" className="max-h-64 rounded-2xl border border-slate-200" />
                    <button type="button" onClick={() => setImage(null)}
                      className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white shadow"><X size={12} /></button>
                  </div>
                )}

                <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="rounded-xl" type="button"
                      onClick={() => imgInputRef.current?.click()} disabled={session?.is_suspended}>
                      <ImageIcon size={16} className="mr-1" /> Photo
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-xl" type="button" disabled><Smile size={16} className="mr-1" /> Mood</Button>
                  </div>
                  <Button onClick={submit} size="sm" className="rounded-xl" disabled={session?.is_suspended || (!draft.trim() && !image)}>Post</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {activeTag && (
          <div className="flex items-center justify-between rounded-2xl bg-indigo-50 px-4 py-3 text-sm">
            <span className="text-indigo-700">Showing posts tagged <span className="font-bold">{activeTag}</span></span>
            <button onClick={() => setActiveTag("")} className="rounded-full p-1 text-indigo-700 hover:bg-indigo-100"><X size={14} /></button>
          </div>
        )}
        {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}
        {loading && <div className="flex justify-center py-10"><Spinner /></div>}
        {!loading && posts.length === 0 && (
          <Card className="rounded-3xl shadow-sm"><CardContent className="p-8 text-center text-sm text-slate-500">
            {activeTag ? `No posts tagged ${activeTag} yet.` : "No posts yet. Be the first to share something!"}
          </CardContent></Card>
        )}
        {posts.map((post) => <PostCard key={post.id} post={post} onLike={toggleLike} onTagClick={(t) => setActiveTag(t)} currentUser={session} />)}
      </div>

      <div className="space-y-5">
        <Card className="rounded-3xl shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-base font-bold text-slate-900">Trending</h3>
            {trending.length === 0 ? (
              <p className="mt-4 text-xs text-slate-500">No tags yet. Use #hashtags in your posts to start a trend.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {trending.map((t) => {
                  const active = activeTag === t.tag;
                  return (
                    <button key={t.tag} type="button"
                      onClick={() => setActiveTag(active ? "" : t.tag)}
                      className={`flex w-full items-center justify-between rounded-2xl p-3 transition ${active ? "bg-indigo-100 ring-2 ring-indigo-300" : "bg-slate-50 hover:bg-slate-100"}`}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white"><TrendingUp size={14} /></div>
                        <p className="text-sm font-medium text-slate-800">{t.tag}</p>
                      </div>
                      <span className="text-xs text-slate-500">{t.count} {t.count === 1 ? "post" : "posts"}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

/* ---------- Chat ---------- */

function ChatBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white"><Bot size={16} /></div>}
      <div className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-6 ${isUser ? "rounded-br-md bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200" : "rounded-bl-md border border-slate-200 bg-white text-slate-800 shadow-sm"}`}>
        {message.attachment && (
          <div className={`mb-2 inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 text-xs ${isUser ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"}`}>
            <Paperclip size={12} />
            <span className="font-medium">{message.attachment.name}</span>
          </div>
        )}
        <p className="whitespace-pre-line">{message.content || message.text}</p>
        {message.created_at && (
          <p className={`mt-1 text-[10px] ${isUser ? "text-indigo-100" : "text-slate-400"}`}>{clockTime(message.created_at)}</p>
        )}
        {!isUser && message.powered_by && message.powered_by !== "stub" && (
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
            <Sparkles size={10} /> Powered by {message.powered_by === "groq" ? "Groq · Llama 3.3" : "Gemini"}
          </div>
        )}
        {message.source && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <FileText size={12} /> Source: <span className="font-medium">{message.source}</span>
          </div>
        )}
        {message.related && message.related.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.related.map((d) => (
              <button
                key={d.id}
                onClick={() => api.documents.download(d.id, d.file_name).catch((e) => alert(e.message))}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700 transition hover:bg-indigo-100"
              >
                <FileText size={10} /> {d.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const WELCOME_MSG = { id: "welcome", role: "assistant", content: "Hi! I'm your Campus AI Copilot for IIT Hyderabad. Ask me anything about syllabus, placements, hostels, fests, or notices — or attach a PDF / text file and I'll analyse it." };

function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadConversations = async () => {
    try { const { conversations } = await api.ai.conversations(); setConversations(conversations); } catch { /* noop */ }
  };

  useEffect(() => {
    let alive = true;
    loadConversations();
    api.ai.suggestions().then((d) => { if (alive) setSuggestions(d.suggestions || []); }).catch(() => {});
    api.documents.list().then((d) => { if (alive) setDocs(d.documents || []); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  const openConversation = async (id) => {
    if (id === activeId) return;
    try {
      const { messages } = await api.ai.conversation(id);
      const mapped = messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        source: m.source,
        related: m.related || [],
        powered_by: m.powered_by,
        attachment: m.attachment_name ? { name: m.attachment_name } : null,
        created_at: m.created_at,
      }));
      setActiveId(id);
      setMessages(mapped.length ? mapped : [WELCOME_MSG]);
    } catch (e) { alert(e.message); }
  };

  const newChat = () => {
    setActiveId(null);
    setMessages([WELCOME_MSG]);
    setInput(""); setFile(null);
  };

  const deleteConversation = async (id, e) => {
    e?.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    await api.ai.deleteConversation(id);
    if (activeId === id) newChat();
    loadConversations();
  };

  const send = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text && !file) return;
    if (busy) return;
    const attachedFile = file;
    const tempId = Date.now();
    setMessages((p) => [...p, {
      id: tempId, role: "user",
      content: text || (attachedFile ? `Analyse "${attachedFile.name}"` : ""),
      attachment: attachedFile ? { name: attachedFile.name } : null,
      created_at: new Date().toISOString(),
    }]);
    setInput(""); setFile(null); setBusy(true);
    try {
      const { conversation_id, answer, source, related, powered_by } = await api.ai.chat(text, attachedFile, activeId);
      setActiveId(conversation_id);
      setMessages((p) => [...p, {
        id: tempId + 1, role: "assistant",
        content: answer, source, related, powered_by,
        created_at: new Date().toISOString(),
      }]);
      loadConversations();
    } catch (e) {
      setMessages((p) => [...p, {
        id: tempId + 1, role: "assistant",
        content: `Error: ${e.message}`,
        created_at: new Date().toISOString(),
      }]);
    } finally { setBusy(false); }
  };

  const onAttach = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { alert("Max file size is 10 MB."); return; }
    setFile(f);
    e.target.value = "";
  };

  const tagColor = (cat) => {
    const c = (cat || "").toLowerCase();
    if (c === "placement") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (c === "syllabus") return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (c === "exam") return "bg-amber-50 text-amber-700 border-amber-200";
    if (c === "notice") return "bg-rose-50 text-rose-700 border-rose-200";
    if (c === "timetable") return "bg-sky-50 text-sky-700 border-sky-200";
    if (c === "plan") return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid h-[calc(100vh-65px)] gap-4 p-5 md:p-6 lg:grid-cols-[260px_1fr_300px]">
      <Card className="hidden flex-col overflow-hidden rounded-3xl shadow-sm lg:flex">
        <div className="flex items-center justify-between border-b p-3">
          <h4 className="text-sm font-bold text-slate-900">History</h4>
          <Button size="sm" variant="soft" className="rounded-xl" onClick={newChat}><PlusCircle size={14} className="mr-1" /> New</Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-slate-500">No past chats yet.</p>
          ) : (
            conversations.map((c) => {
              const active = c.id === activeId;
              return (
                <div key={c.id}
                  onClick={() => openConversation(c.id)}
                  className={`group mb-1 flex cursor-pointer items-start gap-2 rounded-2xl p-2 text-left transition ${active ? "bg-indigo-50" : "hover:bg-slate-50"}`}>
                  <MessageSquare size={14} className={`mt-1 shrink-0 ${active ? "text-indigo-600" : "text-slate-400"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800">{c.title || "Untitled chat"}</p>
                    <p className="truncate text-[10px] text-slate-500">{c.preview || "—"}</p>
                    <p className="text-[10px] text-slate-400">{timeAgo(c.updated_at)}</p>
                  </div>
                  <button type="button" onClick={(e) => deleteConversation(c.id, e)}
                    className="rounded-full p-1 text-slate-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"><X size={12} /></button>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <div className="flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Sparkles size={20} className="text-indigo-600" /> Campus AI Copilot</h3>
            <p className="text-sm text-slate-500">Grounded answers from your college documents.</p>
          </div>
          <Button variant="outline" className="rounded-2xl" onClick={newChat}>New Chat</Button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto rounded-3xl bg-gradient-to-b from-slate-50 to-white p-4">
          {messages.map((m) => <ChatBubble key={m.id} message={m} />)}
          {busy && <div className="flex justify-start"><Spinner /></div>}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(suggestions.length ? suggestions : [
            { q: "Summarise the placement policy", category: "Placement" },
            { q: "When is the next exam?", category: "Exam" },
            { q: "Hostel rules", category: "Notice" },
            { q: "Build me a 7-day DSA study plan", category: "Plan" },
          ]).slice(0, 8).map((s) => (
            <button key={s.q} onClick={() => send(s.q)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition hover:opacity-80 ${tagColor(s.category)}`}>
              {s.q}
            </button>
          ))}
        </div>

        {file && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
            <Paperclip size={14} />
            <span className="flex-1 truncate font-medium">{file.name}</span>
            <span className="text-indigo-500">{(file.size / 1024).toFixed(1)} KB</span>
            <button type="button" onClick={() => setFile(null)} className="rounded-full p-1 hover:bg-indigo-100"><X size={12} /></button>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.csv,.json,.log,application/pdf,text/*"
            className="hidden"
            onChange={onAttach}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-2xl"
            onClick={() => fileInputRef.current?.click()}
            title="Attach a PDF or text file"
          >
            <Paperclip size={18} />
          </Button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={file ? `Ask about "${file.name}"...` : "Ask about syllabus, placements, hostels, or attach a file..."}
            className="flex-1 bg-transparent px-2 text-sm outline-none"
          />
          <Button onClick={() => send()} disabled={busy} className="rounded-2xl">
            <Send size={16} className="mr-2" /> Send
          </Button>
        </div>
      </div>

      <Card className="hidden flex-col overflow-hidden rounded-3xl shadow-sm lg:flex">
        <div className="border-b p-4">
          <h4 className="flex items-center gap-2 text-base font-bold text-slate-900"><FileText size={16} /> Related Documents</h4>
          <p className="mt-1 text-xs text-slate-500">The AI grounds its answers in these PDFs.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {docs.length === 0 ? (
            <div className="px-2 py-6 text-center text-xs text-slate-500">No documents uploaded yet. Ask the admin to upload syllabus, notices, or placement rules.</div>
          ) : (
            <ul className="space-y-2">
              {docs.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => send(`Summarise "${d.title}"`)}
                    className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{d.title}</p>
                      <p className="truncate text-[11px] text-slate-500">{d.file_name}</p>
                      <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${tagColor(d.category)}`}>{d.category}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

/* ---------- Connect ---------- */

function ConnectPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      api.users.list(q)
        .then((data) => { if (alive) setUsers(data.users); })
        .finally(() => { if (alive) setLoading(false); });
    }, q ? 300 : 0);
    return () => { alive = false; clearTimeout(t); };
  }, [q]);

  const toggleFollow = async (u) => {
    if (u.is_following) await api.users.unfollow(u.id); else await api.users.follow(u.id);
    setUsers((arr) => arr.map((x) => x.id === u.id ? { ...x, is_following: !x.is_following } : x));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 p-5 md:p-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Connect with your campus</h3>
          <p className="text-sm text-slate-500">Discover students by name, branch, or interest.</p>
        </div>
        <div className="flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4">
          <Search size={14} className="text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students" className="bg-transparent text-sm outline-none" />
        </div>
      </div>
      {loading ? <div className="flex justify-center py-10"><Spinner /></div> : users.length === 0 ? (
        <Card className="rounded-3xl shadow-sm"><CardContent className="p-8 text-center text-sm text-slate-500">No students found.</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((s) => (
            <Card key={s.id} className="overflow-hidden rounded-3xl shadow-sm transition hover:shadow-md">
              <div className={`h-20 bg-gradient-to-r ${gradientForId(s.id)}`} />
              <CardContent className="-mt-10 p-5">
                <Link to={`/profile/${s.id}`}><Avatar name={s.name} src={api.avatarUrl(s.avatar_path)} gradient={gradientForId(s.id)} size={64} /></Link>
                <Link to={`/profile/${s.id}`}><h4 className="mt-3 font-bold text-slate-900 hover:underline">{s.name}</h4></Link>
                <p className="text-sm text-slate-500">{s.branch || "Student"}{s.year ? ` · ${s.year}` : ""}</p>
                {s.interests && <p className="mt-2 text-xs text-slate-600">Interests: {s.interests}</p>}
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => toggleFollow(s)} size="sm" className="flex-1 rounded-xl" variant={s.is_following ? "outline" : "default"}>
                    <UserPlus size={14} className="mr-1" /> {s.is_following ? "Following" : "Follow"}
                  </Button>
                  <Button onClick={() => navigate(`/messages/${s.id}`, { state: { peer: s } })} size="sm" variant="outline" className="rounded-xl"><MessageCircle size={14} /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ---------- Events ---------- */

function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Tech", description: "", event_date: "", event_time: "", location: "" });

  useEffect(() => {
    let alive = true;
    api.events.list().then((d) => { if (alive) setEvents(d.events); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title) return;
    const { event } = await api.events.create(form);
    setEvents((p) => [event, ...p]);
    setShowForm(false);
    setForm({ title: "", category: "Tech", description: "", event_date: "", event_time: "", location: "" });
  };

  const toggleRsvp = async (id) => {
    await api.events.rsvp(id);
    setEvents((arr) => arr.map((e) => e.id === id ? { ...e, rsvped: !e.rsvped, rsvps: e.rsvps + (e.rsvped ? -1 : 1) } : e));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 p-5 md:p-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Campus Events</h3>
          <p className="text-sm text-slate-500">Don't miss what's happening this month.</p>
        </div>
        <Button className="rounded-2xl" onClick={() => setShowForm((v) => !v)}><PlusCircle size={16} className="mr-2" /> Submit Event</Button>
      </div>
      {showForm && (
        <Card className="rounded-3xl shadow-sm">
          <CardContent className="p-5">
            <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
              <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option>Tech</option><option>Cultural</option><option>Placement</option><option>Sports</option><option>Academic</option>
              </select>
              <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Date (e.g., May 22, 2026)" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
              <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Time (e.g., 9:00 AM)" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} />
              <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 md:col-span-2" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <textarea className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 md:col-span-2" placeholder="Description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Button type="submit" className="rounded-xl md:col-span-2">Create Event</Button>
            </form>
          </CardContent>
        </Card>
      )}
      {loading ? <div className="flex justify-center py-10"><Spinner /></div> : events.length === 0 ? (
        <Card className="rounded-3xl shadow-sm"><CardContent className="p-8 text-center text-sm text-slate-500">No events yet.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((e) => (
            <Card key={e.id} className="overflow-hidden rounded-3xl shadow-sm">
              <div className={`h-24 bg-gradient-to-br ${gradientForId(e.id)} p-4 text-white`}>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur">{e.category || "Event"}</span>
              </div>
              <CardContent className="p-5">
                <h4 className="font-bold text-slate-900">{e.title}</h4>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  {e.event_date && <p className="flex items-center gap-2"><Calendar size={14} /> {e.event_date}</p>}
                  {e.event_time && <p className="flex items-center gap-2"><Clock size={14} /> {e.event_time}</p>}
                  {e.location && <p className="flex items-center gap-2"><MapPin size={14} /> {e.location}</p>}
                </div>
                <Button onClick={() => toggleRsvp(e.id)} variant={e.rsvped ? "outline" : "default"} className="mt-4 w-full rounded-xl">
                  {e.rsvped ? `Going · ${e.rsvps}` : `RSVP · ${e.rsvps}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ---------- Documents / Notifications / Admin ---------- */

function DocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    api.documents.list().then((d) => { if (alive) setDocs(d.documents); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 p-5 md:p-6">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Knowledge Documents</h3>
        <p className="text-sm text-slate-500">PDFs the AI uses to answer your campus questions.</p>
      </div>
      {loading ? <div className="flex justify-center py-10"><Spinner /></div> : docs.length === 0 ? (
        <Card className="rounded-3xl shadow-sm"><CardContent className="p-8 text-center text-sm text-slate-500">No documents yet. Upload one from Admin.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {docs.map((d) => {
            const statusClass = d.status === "Processed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700";
            return (
              <Card key={d.id} className="rounded-3xl shadow-sm transition hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white"><FileText size={22} /></div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900">{d.title}</h4>
                      <p className="mt-1 text-sm text-slate-500">{d.file_name}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{d.category}</span>
                        <span className={`rounded-full px-3 py-1 text-xs ${statusClass}`}>{d.status}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => api.documents.download(d.id, d.file_name).catch((e) => alert(e.message))}
                        className="mt-3 inline-block text-xs font-medium text-indigo-600 hover:underline"
                      >Download PDF</button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

function NotificationsPage({ refresh }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let alive = true;
    api.notifications.list().then((d) => { if (alive) setItems(d.notifications); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [reloadKey]);

  const markAll = async () => { await api.notifications.readAll(); setReloadKey((k) => k + 1); refresh && refresh(); };
  const iconFor = (type) => {
    if (type === "social") return { icon: UserPlus, color: "bg-pink-100 text-pink-700" };
    if (type === "message") return { icon: MessageSquare, color: "bg-indigo-100 text-indigo-700" };
    if (type === "placement") return { icon: Briefcase, color: "bg-emerald-100 text-emerald-700" };
    if (type === "event") return { icon: Calendar, color: "bg-amber-100 text-amber-700" };
    return { icon: Bell, color: "bg-slate-100 text-slate-700" };
  };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 p-5 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Notifications</h3>
          <p className="text-sm text-slate-500">Latest updates from your campus.</p>
        </div>
        <Button variant="outline" className="rounded-2xl" onClick={markAll}>Mark all read</Button>
      </div>
      <Card className="rounded-3xl shadow-sm">
        <CardContent className="divide-y divide-slate-100">
          {loading ? <div className="flex justify-center py-10"><Spinner /></div> : items.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">You're all caught up.</div>
          ) : items.map((n) => {
            const { icon: Icon, color } = iconFor(n.type);
            return (
              <div key={n.id} className={`flex items-start gap-4 p-4 transition hover:bg-slate-50 ${n.is_read ? "" : "bg-indigo-50/40"}`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${color}`}><Icon size={18} /></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{n.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {clockTime(n.created_at)} <span className="text-slate-400">· {timeAgo(n.created_at)}</span>
                  </p>
                </div>
                {!n.is_read && <span className="mt-2 h-2 w-2 rounded-full bg-indigo-500" />}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AdminUploadPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Syllabus");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!file || !title) { setMsg("Choose a PDF and enter a title."); return; }
    setBusy(true); setMsg("");
    try { await api.documents.upload(file, title, category); setMsg("Uploaded successfully."); setFile(null); setTitle(""); }
    catch (err) { setMsg(err.message); }
    finally { setBusy(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5 p-5 md:p-6 lg:grid-cols-2">
      <Card className="rounded-3xl shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-slate-900">Upload College Document</h3>
          <p className="mt-1 text-sm text-slate-500">Upload syllabus, notices, placement rules, or timetable PDFs.</p>
          <form onSubmit={submit} className="mt-6 space-y-5">
            <label className="block cursor-pointer rounded-3xl border-2 border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-10 text-center">
              <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm"><Upload size={28} className="text-indigo-600" /></div>
              <p className="mt-4 font-semibold text-slate-900">{file ? file.name : "Choose PDF"}</p>
              <p className="mt-1 text-sm text-slate-500">Click to browse from your system</p>
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Document Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: Placement Rules 2026" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500">
                  <option>Syllabus</option><option>Notice</option><option>Placement</option><option>Timetable</option><option>Exam</option>
                </select>
              </div>
            </div>
            {msg && <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{msg}</div>}
            <Button type="submit" disabled={busy} className="w-full rounded-2xl py-6">{busy ? "Uploading..." : "Upload and Process Document"}</Button>
          </form>
        </CardContent>
      </Card>
      <Card className="rounded-3xl shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-slate-900">Processing Flow</h3>
          <div className="mt-5 space-y-4">
            {["PDF is uploaded by admin","Text is extracted from the PDF","Text is split into smaller chunks","Embeddings are generated","Chunks are stored in vector database","Students can ask questions from this document"].map((step, i) => (
              <div key={step} className="flex gap-3 rounded-2xl bg-gradient-to-r from-slate-50 to-white p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white">{i + 1}</div>
                <p className="text-sm text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ---------- Messages ---------- */

function MessagesPage({ session, onUnreadChange }) {
  const { userId: routePeer } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [activePeer, setActivePeer] = useState(location.state?.peer || null);
  const [history, setHistory] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [convReloadKey, setConvReloadKey] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (routePeer && (!activePeer || activePeer.id !== Number(routePeer))) {
      api.users.get(routePeer).then(({ user }) => setActivePeer(user)).catch(() => {});
    }
  }, [routePeer, activePeer]);

  useEffect(() => {
    let alive = true;
    api.messages.conversations().then(({ conversations }) => {
      if (!alive) return;
      setConversations(conversations);
      const totalUnread = conversations.reduce((a, c) => a + (c.unread || 0), 0);
      onUnreadChange && onUnreadChange(totalUnread);
    }).catch(() => {});
    return () => { alive = false; };
  }, [convReloadKey, onUnreadChange]);

  useEffect(() => {
    if (!activePeer) return;
    let alive = true;
    api.messages.history(activePeer.id).then(({ messages }) => { if (alive) setHistory(messages); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [activePeer]);

  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;
    const handler = (msg) => {
      if (activePeer && (msg.sender_id === activePeer.id || msg.recipient_id === activePeer.id)) {
        setHistory((h) => (h.some((m) => m.id === msg.id) ? h : [...h, msg]));
      }
      setConvReloadKey((k) => k + 1);
    };
    sock.on("message:new", handler);
    return () => { sock.off("message:new", handler); };
  }, [activePeer]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      if (!searchQ) { if (alive) setSearchResults([]); return; }
      api.users.list(searchQ).then(({ users }) => { if (alive) setSearchResults(users); });
    }, searchQ ? 300 : 0);
    return () => { alive = false; clearTimeout(t); };
  }, [searchQ]);

  const send = async () => {
    if (!draft.trim() || !activePeer) return;
    const text = draft; setDraft("");
    try {
      const { message } = await api.messages.send(activePeer.id, text);
      // Optimistically append; the socket echo (if any) will be deduped by id.
      if (message) {
        setHistory((h) => (h.some((m) => m.id === message.id) ? h : [...h, message]));
        setConvReloadKey((k) => k + 1);
      }
    } catch (e) { setDraft(text); alert(e.message); }
  };

  const startConversation = (user) => {
    setActivePeer({ id: user.id, name: user.name, branch: user.branch, year: user.year });
    setSearching(false); setSearchQ(""); setSearchResults([]);
    navigate(`/messages/${user.id}`, { replace: true });
  };

  const selectPeer = (c) => {
    const peer = { id: c.id, name: c.name, branch: c.branch, year: c.year };
    setActivePeer(peer);
    navigate(`/messages/${c.id}`, { replace: true });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid h-[calc(100vh-65px)] gap-4 p-5 md:p-6 md:grid-cols-[320px_1fr]">
      <Card className="flex flex-col overflow-hidden rounded-3xl shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-bold text-slate-900">Chats</h3>
          <Button size="sm" variant="soft" className="rounded-xl" onClick={() => setSearching((v) => !v)}><PlusCircle size={14} className="mr-1" /> New</Button>
        </div>
        {searching && (
          <div className="border-b p-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Search size={14} className="text-slate-400" />
              <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search students" className="flex-1 bg-transparent text-sm outline-none" autoFocus />
            </div>
            <div className="mt-2 max-h-60 space-y-1 overflow-y-auto">
              {searchResults.map((u) => (
                <button key={u.id} onClick={() => startConversation(u)} className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-slate-50">
                  <Avatar name={u.name} gradient={gradientForId(u.id)} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{u.name}</p>
                    <p className="truncate text-xs text-slate-500">{u.branch || ""}</p>
                  </div>
                </button>
              ))}
              {searchQ && searchResults.length === 0 && <p className="px-2 py-3 text-xs text-slate-500">No students.</p>}
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && <div className="p-6 text-center text-sm text-slate-500">No conversations yet. Click "New" to start one.</div>}
          {conversations.map((c) => {
            const active = activePeer?.id === c.id;
            return (
              <button key={c.id} onClick={() => selectPeer(c)}
                className={`flex w-full items-center gap-3 border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${active ? "bg-indigo-50/60" : ""}`}>
                <Avatar name={c.name} gradient={gradientForId(c.id)} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-semibold text-slate-900">{c.name}</p>
                    <span className="ml-2 text-[10px] text-slate-400">{clockTime(c.last_at)}</span>
                  </div>
                  <p className="truncate text-xs text-slate-500">{c.last_message || "Say hi 👋"}</p>
                </div>
                {c.unread > 0 && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">{c.unread}</span>}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="flex flex-col overflow-hidden rounded-3xl shadow-sm">
        {!activePeer ? (
          <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600"><MessageSquare size={28} /></div>
            <h4 className="mt-4 font-bold text-slate-900">Your messages</h4>
            <p className="mt-1 text-sm text-slate-500">Pick a conversation or start a new one.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b p-4">
              <Avatar name={activePeer.name} gradient={gradientForId(activePeer.id)} size={42} />
              <div>
                <p className="font-semibold text-slate-900">{activePeer.name}</p>
                <p className="text-xs text-slate-500">{activePeer.branch || ""}{activePeer.year ? ` · ${activePeer.year}` : ""}</p>
              </div>
            </div>
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-slate-50 to-white p-4">
              {loading ? <div className="flex justify-center py-10"><Spinner /></div> : history.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">No messages yet. Say hi!</p>
              ) : history.map((m) => {
                const mine = m.sender_id === session.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-3xl px-4 py-2 text-sm ${mine ? "rounded-br-md bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm" : "rounded-bl-md border border-slate-200 bg-white text-slate-800"}`}>
                      <p>{m.content}</p>
                      <p className={`mt-1 text-[10px] ${mine ? "text-indigo-100" : "text-slate-400"}`}>{clockTime(m.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 border-t p-3">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={`Message ${activePeer.name?.split(" ")[0] || ""}...`} className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white" />
              <Button onClick={send} className="rounded-2xl"><Send size={16} className="mr-2" /> Send</Button>
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
}

/* ---------- Profile Page ---------- */

function FollowListModal({ open, title, users, onClose }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"><X size={16} /></button>
        </div>
        <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
          {users.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No users yet.</p>
          ) : users.map((u) => (
            <Link key={u.id} to={`/profile/${u.id}`} onClick={onClose}
              className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-slate-50">
              <Avatar name={u.name} src={api.avatarUrl(u.avatar_path)} gradient={gradientForId(u.id)} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{u.name}</p>
                <p className="truncate text-xs text-slate-500">{u.branch || ""}{u.year ? ` · ${u.year}` : ""}</p>
              </div>
              {u.is_following && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">Following</span>}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

function ProfilePage({ session, onSessionUpdate }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMe = String(session?.id) === String(id);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", branch: "", year: "", interests: "", bio: "" });
  const [followList, setFollowList] = useState({ open: false, title: "", users: [] });
  const [avatarBusy, setAvatarBusy] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.users.get(id).then((d) => {
      if (!alive) return;
      setData(d);
      setForm({
        name: d.user.name || "", branch: d.user.branch || "", year: d.user.year || "",
        interests: d.user.interests || "", bio: d.user.bio || "",
      });
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  const toggleFollow = async () => {
    if (data.is_following) await api.users.unfollow(id); else await api.users.follow(id);
    setData((d) => ({ ...d, is_following: !d.is_following, counts: { ...d.counts, followers: d.counts.followers + (d.is_following ? -1 : 1) } }));
  };

  const save = async (e) => {
    e.preventDefault();
    const { user } = await api.auth.updateMe(form);
    setData((d) => ({ ...d, user: { ...d.user, ...user } }));
    onSessionUpdate && onSessionUpdate(user);
    setEditing(false);
  };

  const onAvatar = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { alert("Max image size is 5 MB."); return; }
    setAvatarBusy(true);
    try {
      const { user } = await api.auth.uploadAvatar(f);
      setData((d) => ({ ...d, user: { ...d.user, avatar_path: user.avatar_path } }));
      onSessionUpdate && onSessionUpdate(user);
    } catch (err) { alert(err.message); }
    finally { setAvatarBusy(false); e.target.value = ""; }
  };

  const showFollowers = async () => {
    const { users } = await api.users.followers(id);
    setFollowList({ open: true, title: "Followers", users });
  };
  const showFollowing = async () => {
    const { users } = await api.users.following(id);
    setFollowList({ open: true, title: "Following", users });
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!data) return <div className="p-10 text-center text-slate-500">User not found.</div>;

  const u = data.user;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 p-5 md:p-6">
      <Card className="overflow-hidden rounded-3xl shadow-sm">
        <div className={`h-32 bg-gradient-to-r ${gradientForId(u.id)}`} />
        <CardContent className="-mt-12 p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative">
                <Avatar name={u.name} src={api.avatarUrl(u.avatar_path)} gradient={gradientForId(u.id)} size={96} />
                {isMe && (
                  <>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
                    <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={avatarBusy}
                      className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white shadow-md transition hover:bg-slate-700 disabled:opacity-50"
                      title="Change profile picture">
                      <ImageIcon size={14} />
                    </button>
                  </>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-slate-900">{u.name}</h2>
                  {u.is_admin && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">ADMIN</span>}
                  {u.is_suspended && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">SUSPENDED</span>}
                </div>
                <p className="text-sm text-slate-500">{u.branch || "Student"}{u.year ? ` · ${u.year}` : ""}</p>
                {u.bio && <p className="mt-1 max-w-md text-sm text-slate-600">{u.bio}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              {isMe ? (
                <>
                  <Button onClick={() => setEditing((v) => !v)} variant="outline" className="rounded-xl"><Edit3 size={14} className="mr-1" /> {editing ? "Cancel" : "Edit profile"}</Button>
                  <Button onClick={() => navigate("/change-password")} variant="outline" className="rounded-xl"><KeyRound size={14} className="mr-1" /> Password</Button>
                </>
              ) : (
                <>
                  <Button onClick={toggleFollow} className="rounded-xl" variant={data.is_following ? "outline" : "default"}><UserPlus size={14} className="mr-1" /> {data.is_following ? "Following" : "Follow"}</Button>
                  <Button onClick={() => navigate(`/messages/${u.id}`, { state: { peer: u } })} variant="outline" className="rounded-xl"><MessageCircle size={14} className="mr-1" /> Message</Button>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xl font-bold text-slate-900">{data.counts.posts}</p><p className="text-xs text-slate-500">Posts</p></div>
            <button onClick={showFollowers} className="rounded-2xl bg-slate-50 p-4 transition hover:bg-slate-100">
              <p className="text-xl font-bold text-slate-900">{data.counts.followers}</p>
              <p className="text-xs text-slate-500">Followers</p>
            </button>
            <button onClick={showFollowing} className="rounded-2xl bg-slate-50 p-4 transition hover:bg-slate-100">
              <p className="text-xl font-bold text-slate-900">{data.counts.following}</p>
              <p className="text-xs text-slate-500">Following</p>
            </button>
          </div>

          {u.interests && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interests</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {u.interests.split(",").map((it) => it.trim()).filter(Boolean).map((it) => (
                  <span key={it} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">{it}</span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {editing && isMe && (
        <Card className="rounded-3xl shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900">Edit profile</h3>
            <form onSubmit={save} className="mt-4 grid gap-3 md:grid-cols-2">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" />
              <input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder="Branch" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" />
              <input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="Year" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" />
              <input value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} placeholder="Interests (comma-separated)" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" />
              <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Short bio" rows={3} className="md:col-span-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" />
              <Button type="submit" className="rounded-xl md:col-span-2">Save Changes</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="mb-3 text-lg font-bold text-slate-900">Posts</h3>
        {data.posts.length === 0 ? (
          <Card className="rounded-3xl shadow-sm"><CardContent className="p-6 text-center text-sm text-slate-500">No posts yet.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {data.posts.map((p) => (
              <Card key={p.id} className="rounded-3xl shadow-sm">
                <CardContent className="p-5">
                  <p className="text-xs text-slate-500">{timeAgo(p.created_at)}</p>
                  {p.content && <p className="mt-1 text-sm text-slate-700">{p.content}</p>}
                  {p.image_path && (
                    <img src={api.postImageUrl(p.image_path)} alt="post"
                      className="mt-2 max-h-80 w-full rounded-2xl object-cover" loading="lazy" />
                  )}
                  {p.tags?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {p.tags.map((t) => <span key={t} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">{t}</span>)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <FollowListModal
        open={followList.open}
        title={followList.title}
        users={followList.users}
        onClose={() => setFollowList({ open: false, title: "", users: [] })}
      />
    </motion.div>
  );
}

/* ---------- Terms & Conditions Page ---------- */

function TermsPage() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      body: `By creating an account or using Campus AI Copilot ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree, you must stop using the Platform immediately. The Platform is provided exclusively for verified students, faculty, and staff of IIT Hyderabad.`,
    },
    {
      title: "2. Eligibility",
      body: `You must be at least 17 years old and a current student or affiliated member of IIT Hyderabad to register. You agree to provide accurate, current, and complete information during sign-up and to keep your profile up to date. Sharing your account credentials with anyone else is strictly prohibited.`,
    },
    {
      title: "3. Acceptable Use",
      body: `You agree to use the Platform only for lawful, academic, and community-building purposes. You will not post, comment, or message content that is: (a) abusive, harassing, threatening, defamatory, or hateful; (b) sexually explicit, obscene, or vulgar; (c) discriminatory on the basis of caste, religion, gender, sexuality, region, or disability; (d) related to ragging, bullying, or intimidation; (e) infringing on intellectual property; (f) promoting illegal activity, drugs, weapons, or self-harm; (g) commercial spam, scams, or unsolicited advertising; (h) malware, phishing links, or otherwise harmful technical content.`,
    },
    {
      title: "4. Content Moderation",
      body: `Posts, comments, and direct messages are scanned for prohibited language. The first detected violation will result in a written warning sent to you via the Platform's notification system. A second violation will result in immediate suspension of your account. Suspended users retain read-only access but cannot post, comment, message, or share. Manual moderation review may extend, reduce, or reverse automated decisions.`,
    },
    {
      title: "5. Academic Integrity",
      body: `The AI Copilot is a study aid grounded in officially uploaded college documents. You may not use it to fabricate assignments, copy graded work, impersonate another student, or otherwise violate IIT Hyderabad's academic integrity policy. Using the Platform to cheat is a violation of both these Terms and the institute's code of conduct.`,
    },
    {
      title: "6. Privacy and Data",
      body: `We collect the information you provide (name, college email, branch, year, interests, bio, profile picture, posts, comments, messages, AI chat history) and limited technical metadata required to operate the service. Your data is stored on servers controlled by the Platform operator and is not sold to third parties. AI prompts may be sent to third-party LLM providers (Groq, Google Gemini) under their respective privacy terms. Direct messages are visible only to the sender and recipient but may be reviewed by administrators in cases of reported abuse.`,
    },
    {
      title: "7. Uploaded Documents",
      body: `Only verified administrators may upload knowledge documents. Uploaders confirm they have the right to share the document, that it does not contain confidential personal data of third parties, and that it complies with IIT Hyderabad's information-sharing policies. The Platform reserves the right to remove any uploaded document at any time.`,
    },
    {
      title: "8. Intellectual Property",
      body: `You retain ownership of the content you post. By posting, you grant the Platform a non-exclusive, royalty-free license to display, distribute, and reproduce your content within the Platform for the purpose of operating the service. Logos, designs, and source code of the Platform itself remain the property of its developers.`,
    },
    {
      title: "9. Termination",
      body: `You may delete your account at any time from the Settings page. We may suspend or terminate your account without prior notice if you violate these Terms, the law, or IIT Hyderabad's policies. Termination removes your access; certain content (e.g., shared messages, comments on others' posts) may persist for the integrity of conversations.`,
    },
    {
      title: "10. Disclaimer of Warranties",
      body: `The Platform is provided "as is" without warranty of any kind. AI-generated answers may be incomplete or inaccurate; always verify critical academic, placement, or administrative information against official IIT Hyderabad sources. The Platform is a student project and is not an official communication channel of IIT Hyderabad.`,
    },
    {
      title: "11. Limitation of Liability",
      body: `To the maximum extent permitted by law, the Platform's developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.`,
    },
    {
      title: "12. Changes to Terms",
      body: `We may update these Terms periodically. Continued use of the Platform after changes constitutes acceptance of the revised Terms. Material changes will be announced via in-app notification.`,
    },
    {
      title: "13. Contact",
      body: `Questions, abuse reports, or appeals can be raised through the Notifications system or by contacting an administrator. We aim to respond within seven business days.`,
    },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl space-y-5 p-5 md:p-6">
      <Card className="rounded-3xl shadow-sm">
        <CardContent className="p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white"><ScrollText size={22} /></div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Terms & Conditions</h2>
              <p className="text-sm text-slate-500">Campus AI Copilot · IIT Hyderabad · Last updated 6 May 2026</p>
            </div>
          </div>
          <div className="space-y-5 text-sm leading-7 text-slate-700">
            {sections.map((s) => (
              <section key={s.title}>
                <h3 className="font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-slate-600">{s.body}</p>
              </section>
            ))}
          </div>
          <div className="mt-8 rounded-2xl bg-amber-50 p-4 text-xs text-amber-800">
            By continuing to use Campus AI Copilot you confirm that you have read, understood, and agreed to these Terms.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ---------- Settings Page ---------- */

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} type="button"
      className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-indigo-600" : "bg-slate-300"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

function SettingsPage({ session, onSignOut }) {
  const navigate = useNavigate();
  const loadPrefs = () => {
    try { return JSON.parse(localStorage.getItem("campus_ai_prefs") || "{}"); } catch { return {}; }
  };
  const [prefs, setPrefs] = useState(() => ({
    notify_messages: true,
    notify_likes: true,
    notify_comments: true,
    notify_follows: true,
    show_online: true,
    allow_messages_followers_only: false,
    ...loadPrefs(),
  }));

  const update = (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem("campus_ai_prefs", JSON.stringify(next));
  };

  const Row = ({ title, desc, k }) => (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        {desc && <p className="text-xs text-slate-500">{desc}</p>}
      </div>
      <Toggle checked={!!prefs[k]} onChange={(v) => update(k, v)} />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl space-y-5 p-5 md:p-6">
      <Card className="rounded-3xl shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-slate-900">Settings</h2>
          <p className="mt-1 text-sm text-slate-500">Manage your account preferences and privacy.</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-base font-bold text-slate-900">Account</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-slate-500">Name</span>
              <span className="font-medium text-slate-900">{session?.name}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-slate-500">Email</span>
              <span className="font-medium text-slate-900">{session?.email}</span>
            </div>
            {session?.is_admin && (
              <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
                <span className="text-amber-700">Role</span>
                <span className="font-bold text-amber-700">Administrator</span>
              </div>
            )}
            {(session?.warnings || 0) > 0 && (
              <div className="flex items-center justify-between rounded-2xl bg-rose-50 px-4 py-3">
                <span className="text-rose-700">Policy warnings</span>
                <span className="font-bold text-rose-700">{session.warnings}</span>
              </div>
            )}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button variant="outline" className="rounded-2xl" onClick={() => navigate(`/profile/${session?.id}`)}><User size={14} className="mr-2" /> Edit profile</Button>
            <Button variant="outline" className="rounded-2xl" onClick={() => navigate("/change-password")}><KeyRound size={14} className="mr-2" /> Change password</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-base font-bold text-slate-900">Notifications</h3>
          <div className="mt-2 divide-y divide-slate-100">
            <Row title="New messages" desc="Get notified when someone sends you a DM" k="notify_messages" />
            <Row title="Likes on your posts" desc="When someone likes a post you wrote" k="notify_likes" />
            <Row title="Comments" desc="When someone comments on your post" k="notify_comments" />
            <Row title="New followers" desc="When someone follows you" k="notify_follows" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-base font-bold text-slate-900">Privacy</h3>
          <div className="mt-2 divide-y divide-slate-100">
            <Row title="Show I'm online" desc="Show your active status to other students" k="show_online" />
            <Row title="DMs from followers only" desc="Only people who follow you can message you" k="allow_messages_followers_only" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-base font-bold text-slate-900">About</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <Button variant="outline" className="rounded-2xl" onClick={() => navigate("/terms")}><ScrollText size={14} className="mr-2" /> Terms & Conditions</Button>
            <Button variant="outline" className="rounded-2xl" onClick={onSignOut}><LogOut size={14} className="mr-2" /> Sign out</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ---------- Change Password Page ---------- */

function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ kind: "", text: "" });

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { setMsg({ kind: "err", text: "Passwords do not match." }); return; }
    if (form.newPassword.length < 6) { setMsg({ kind: "err", text: "Password must be at least 6 characters." }); return; }
    setBusy(true); setMsg({ kind: "", text: "" });
    try {
      await api.auth.changePassword(form.oldPassword, form.newPassword);
      setMsg({ kind: "ok", text: "Password updated successfully." });
      setForm({ oldPassword: "", newPassword: "", confirm: "" });
    } catch (e) { setMsg({ kind: "err", text: e.message }); }
    finally { setBusy(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md space-y-5 p-5 md:p-6">
      <Card className="rounded-3xl shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-slate-900">Change Password</h3>
          <p className="mt-1 text-sm text-slate-500">Use a strong password you don't reuse elsewhere.</p>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Current Password</label>
              <input type="password" value={form.oldPassword} onChange={(e) => setForm({ ...form, oldPassword: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">New Password</label>
              <input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
              <input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" />
            </div>
            {msg.text && <div className={`rounded-2xl px-4 py-3 text-sm ${msg.kind === "err" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"}`}>{msg.text}</div>}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="rounded-2xl" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" disabled={busy} className="flex-1 rounded-2xl">{busy ? "Saving..." : "Update Password"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ---------- Auth Pages ---------- */

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <Link to="/login" className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"><Bot size={22} /></div>
          <div><p className="text-lg font-bold">Campus AI</p><p className="text-xs text-indigo-200">Your campus, smarter.</p></div>
        </Link>
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight">One platform for your <br /><span className="bg-gradient-to-r from-pink-200 to-amber-200 bg-clip-text text-transparent">entire college life.</span></h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-indigo-100">Ask the AI about syllabus, placements, and notices. Connect with classmates. Stay on top of every event.</p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[{ icon: Sparkles, t: "RAG Copilot" }, { icon: Users, t: "Student Network" }, { icon: MessageSquare, t: "Direct Messages" }, { icon: Calendar, t: "Campus Events" }].map((f) => {
              const Icon = f.icon;
              return <div key={f.t} className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 backdrop-blur"><Icon size={16} /><span className="text-sm">{f.t}</span></div>;
            })}
          </div>
        </div>
        <p className="relative text-xs text-indigo-200">© 2026 Campus AI · Built for students.</p>
      </div>
      <div className="flex items-center justify-center bg-slate-50 px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md"><Bot size={28} /></div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">Campus AI</h1>
          </div>
          <Card className="rounded-3xl shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
              {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
              {children}
            </CardContent>
          </Card>
          {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
        </motion.div>
      </div>
    </div>
  );
}

function LoginPage({ onAuth }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { token, user } = await api.auth.login({ email: email.trim().toLowerCase(), password });
      api.setToken(token);
      onAuth(user);
      navigate("/dashboard", { replace: true });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to your copilot."
      footer={<>Don't have an account? <Link to="/signup" className="font-semibold text-indigo-600 hover:underline">Sign up</Link></>}
    >
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">College Email</label>
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 focus-within:border-indigo-500">
            <Mail size={16} className="text-slate-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" className="flex-1 bg-transparent text-sm outline-none" autoComplete="email" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Password</label>
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 focus-within:border-indigo-500">
            <Lock size={16} className="text-slate-400" />
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className="flex-1 bg-transparent text-sm outline-none" autoComplete="current-password" />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
        </div>
        {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-slate-600"><input type="checkbox" className="rounded" /> Remember me</label>
          <Link to="/forgot-password" className="font-medium text-indigo-600 hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" disabled={busy} className="w-full rounded-2xl py-6">{busy ? "Please wait..." : "Sign In"}</Button>
      </form>
    </AuthShell>
  );
}

function SignupPage({ onAuth }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", branch: "", year: "", interests: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    setBusy(true);
    try {
      const { token, user } = await api.auth.signup({
        name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password,
        branch: form.branch, year: form.year, interests: form.interests,
      });
      api.setToken(token);
      onAuth(user);
      navigate("/dashboard", { replace: true });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join your college community in seconds."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-indigo-600 hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Full Name</label>
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 focus-within:border-indigo-500">
            <User size={16} className="text-slate-400" />
            <input value={form.name} onChange={update("name")} placeholder="Your name" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">College Email</label>
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 focus-within:border-indigo-500">
            <Mail size={16} className="text-slate-400" />
            <input type="email" value={form.email} onChange={update("email")} placeholder="you@college.edu" className="flex-1 bg-transparent text-sm outline-none" autoComplete="email" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Password</label>
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 focus-within:border-indigo-500">
            <Lock size={16} className="text-slate-400" />
            <input type={showPassword ? "text" : "password"} value={form.password} onChange={update("password")} placeholder="At least 6 characters" className="flex-1 bg-transparent text-sm outline-none" autoComplete="new-password" />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Confirm Password</label>
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 focus-within:border-indigo-500">
            <Lock size={16} className="text-slate-400" />
            <input type={showPassword ? "text" : "password"} value={form.confirm} onChange={update("confirm")} placeholder="Re-enter password" className="flex-1 bg-transparent text-sm outline-none" autoComplete="new-password" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input value={form.branch} onChange={update("branch")} placeholder="Branch (e.g. CSE)" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" />
          <input value={form.year} onChange={update("year")} placeholder="Year (e.g. 3rd Year)" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" />
        </div>
        <input value={form.interests} onChange={update("interests")} placeholder="Interests (e.g. AI, Web Dev)" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" />
        {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}
        <Button type="submit" disabled={busy} className="w-full rounded-2xl py-6">{busy ? "Please wait..." : "Create Account"}</Button>
      </form>
    </AuthShell>
  );
}

function ForgotPasswordPage() {
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const requestReset = async (e) => {
    e.preventDefault();
    setError(""); setInfo(""); setBusy(true);
    try {
      const data = await api.auth.forgotPassword(email.trim().toLowerCase());
      if (data.token) {
        setToken(data.token);
        setInfo("We've issued you a reset token below. Use it to set a new password.");
      } else {
        setInfo("If that email exists, a reset token has been sent.");
      }
      setStep("reset");
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const doReset = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setBusy(true);
    try {
      await api.auth.resetPassword(token, password);
      setStep("done");
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle={step === "done" ? "All set." : "We'll help you reset it."}
      footer={<><Link to="/login" className="font-semibold text-indigo-600 hover:underline">Back to sign in</Link></>}
    >
      {step === "request" && (
        <form onSubmit={requestReset} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Your email</label>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 focus-within:border-indigo-500">
              <Mail size={16} className="text-slate-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" className="flex-1 bg-transparent text-sm outline-none" />
            </div>
          </div>
          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}
          <Button type="submit" disabled={busy} className="w-full rounded-2xl py-6">{busy ? "Please wait..." : "Send reset token"}</Button>
        </form>
      )}

      {step === "reset" && (
        <form onSubmit={doReset} className="mt-6 space-y-4">
          {info && <div className="rounded-2xl bg-indigo-50 px-4 py-3 text-xs text-indigo-700">{info}</div>}
          <div>
            <label className="text-sm font-medium text-slate-700">Reset Token</label>
            <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste your token here" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">New password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Confirm new password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" />
          </div>
          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}
          <Button type="submit" disabled={busy} className="w-full rounded-2xl py-6">{busy ? "Resetting..." : "Reset password"}</Button>
        </form>
      )}

      {step === "done" && (
        <div className="mt-6 space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><Check size={20} /></div>
          <p className="text-sm text-slate-600">Your password has been updated. You can now sign in.</p>
          <Link to="/login"><Button className="rounded-2xl">Go to login</Button></Link>
        </div>
      )}
    </AuthShell>
  );
}

/* ---------- Root ---------- */

function loadInitialSession() {
  try {
    const raw = localStorage.getItem("campus_ai_session");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function App() {
  const [session, setSession] = useState(loadInitialSession);
  const [profileOpen, setProfileOpen] = useState(false);
  const [stats, setStats] = useState({ documents: 0, posts: 0, users: 0, events: 0 });
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const handleSignOut = () => {
    api.setToken(null);
    disconnectSocket();
    setSession(null);
    setProfileOpen(false);
  };

  const handleAuth = (user) => {
    setSession(user);
  };

  const refreshStats = () => {
    if (!api.getToken()) return;
    Promise.all([
      api.documents.list().catch(() => ({ documents: [] })),
      api.posts.list().catch(() => ({ posts: [] })),
      api.users.list().catch(() => ({ users: [] })),
      api.events.list().catch(() => ({ events: [] })),
    ]).then(([docs, posts, users, events]) => {
      setStats({
        documents: docs.documents.length, posts: posts.posts.length,
        users: users.users.length, events: events.events.length,
      });
    });
  };

  const refreshUnread = () => {
    if (!api.getToken()) return;
    api.messages.conversations().then(({ conversations }) => setUnreadMessages(conversations.reduce((a, c) => a + (c.unread || 0), 0))).catch(() => {});
    api.notifications.list().then(({ notifications }) => setUnreadNotifications(notifications.filter((n) => !n.is_read).length)).catch(() => {});
  };

  useEffect(() => {
    if (session) localStorage.setItem("campus_ai_session", JSON.stringify(session));
    else localStorage.removeItem("campus_ai_session");
  }, [session]);

  useEffect(() => {
    if (!session) return;
    getSocket();
    api.auth.me().then(({ user }) => setSession(user)).catch(() => handleSignOut());
    refreshStats();
    refreshUnread();
  }, [session?.id]);

  useEffect(() => {
    if (!session) return;
    const sock = getSocket();
    if (!sock) return;
    const handler = () => refreshUnread();
    sock.on("message:new", handler);
    return () => { sock.off("message:new", handler); };
  }, [session]);

  const badges = { unreadMessages, unreadNotifications };

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <LoginPage onAuth={handleAuth} />} />
      <Route path="/signup" element={session ? <Navigate to="/dashboard" replace /> : <SignupPage onAuth={handleAuth} />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/terms-public" element={<TermsPage />} />

      <Route element={<ProtectedLayout session={session} badges={badges} onSignOut={handleSignOut} profileOpen={profileOpen} setProfileOpen={setProfileOpen} />}>
        <Route path="/dashboard" element={<DashboardPage session={session} stats={stats} />} />
        <Route path="/feed" element={<FeedPage session={session} />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/messages" element={<MessagesPage session={session} onUnreadChange={setUnreadMessages} />} />
        <Route path="/messages/:userId" element={<MessagesPage session={session} onUnreadChange={setUnreadMessages} />} />
        <Route path="/connect" element={<ConnectPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/notifications" element={<NotificationsPage refresh={refreshUnread} />} />
        <Route path="/admin" element={session?.is_admin ? <AdminUploadPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/profile/:id" element={<ProfilePage session={session} onSessionUpdate={(u) => setSession((s) => ({ ...s, ...u }))} />} />
        <Route path="/settings" element={<SettingsPage session={session} onSignOut={handleSignOut} />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
      </Route>

      <Route path="*" element={<Navigate to={session ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}
