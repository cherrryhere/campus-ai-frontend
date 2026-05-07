const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const tokenStore = {
  get: () => localStorage.getItem("campus_ai_token"),
  set: (t) => (t ? localStorage.setItem("campus_ai_token", t) : localStorage.removeItem("campus_ai_token")),
};

async function request(method, path, body, { isForm = false } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export const api = {
  baseUrl: BASE_URL,
  setToken: tokenStore.set,
  getToken: tokenStore.get,

  get: (p) => request("GET", p),
  post: (p, b) => request("POST", p, b),
  put: (p, b) => request("PUT", p, b),
  delete: (p) => request("DELETE", p),
  upload: (p, formData) => request("POST", p, formData, { isForm: true }),

  avatarUrl: (path) => path ? `${BASE_URL}/uploads/avatars/${path}` : null,
  postImageUrl: (path) => path ? `${BASE_URL}/uploads/posts/${path}` : null,

  auth: {
    signup: (data) => request("POST", "/api/auth/signup", data),
    login: (data) => request("POST", "/api/auth/login", data),
    me: () => request("GET", "/api/auth/me"),
    updateMe: (data) => request("PUT", "/api/auth/me", data),
    uploadAvatar: (file) => {
      const fd = new FormData();
      fd.append("avatar", file);
      return request("POST", "/api/auth/avatar", fd, { isForm: true });
    },
    changePassword: (oldPassword, newPassword) =>
      request("POST", "/api/auth/change-password", { oldPassword, newPassword }),
    forgotPassword: (email) => request("POST", "/api/auth/forgot-password", { email }),
    resetPassword: (token, password) => request("POST", "/api/auth/reset-password", { token, password }),
  },
  users: {
    list: (q = "") => request("GET", `/api/users${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    get: (id) => request("GET", `/api/users/${id}`),
    followers: (id) => request("GET", `/api/users/${id}/followers`),
    following: (id) => request("GET", `/api/users/${id}/following`),
    follow: (id) => request("POST", `/api/users/${id}/follow`),
    unfollow: (id) => request("DELETE", `/api/users/${id}/follow`),
  },
  posts: {
    list: (tag) => request("GET", `/api/posts${tag ? `?tag=${encodeURIComponent(tag.replace(/^#/, ""))}` : ""}`),
    trending: () => request("GET", "/api/posts/trending"),
    create: (content, tags, image) => {
      const fd = new FormData();
      fd.append("content", content || "");
      fd.append("tags", JSON.stringify(tags || []));
      if (image) fd.append("image", image);
      return request("POST", "/api/posts", fd, { isForm: true });
    },
    like: (id) => request("POST", `/api/posts/${id}/like`),
    comments: (id) => request("GET", `/api/posts/${id}/comments`),
    comment: (id, content) => request("POST", `/api/posts/${id}/comments`, { content }),
  },
  events: {
    list: () => request("GET", "/api/events"),
    create: (data) => request("POST", "/api/events", data),
    rsvp: (id) => request("POST", `/api/events/${id}/rsvp`),
  },
  documents: {
    list: () => request("GET", "/api/documents"),
    upload: (file, title, category) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title);
      fd.append("category", category);
      return request("POST", "/api/documents", fd, { isForm: true });
    },
    download: async (id, fileName) => {
      const res = await fetch(`${BASE_URL}/api/documents/${id}/download`, {
        headers: { Authorization: `Bearer ${tokenStore.get()}` },
      });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "document.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  },
  notifications: {
    list: () => request("GET", "/api/notifications"),
    readAll: () => request("POST", "/api/notifications/read-all"),
  },
  ai: {
    chat: (question, file, conversation_id) => {
      const fd = new FormData();
      fd.append("question", question || "");
      if (file) fd.append("file", file);
      if (conversation_id) fd.append("conversation_id", String(conversation_id));
      return request("POST", "/api/ai/chat", fd, { isForm: true });
    },
    suggestions: () => request("GET", "/api/ai/suggestions"),
    conversations: () => request("GET", "/api/ai/conversations"),
    conversation: (id) => request("GET", `/api/ai/conversations/${id}`),
    createConversation: (title) => request("POST", "/api/ai/conversations", { title }),
    renameConversation: (id, title) => request("PUT", `/api/ai/conversations/${id}`, { title }),
    deleteConversation: (id) => request("DELETE", `/api/ai/conversations/${id}`),
  },
  messages: {
    conversations: () => request("GET", "/api/messages/conversations"),
    history: (userId) => request("GET", `/api/messages/${userId}`),
    send: (recipient_id, content) => request("POST", "/api/messages", { recipient_id, content }),
  },
};
