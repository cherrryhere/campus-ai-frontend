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

  auth: {
    signup: (data) => request("POST", "/api/auth/signup", data),
    login: (data) => request("POST", "/api/auth/login", data),
    me: () => request("GET", "/api/auth/me"),
    updateMe: (data) => request("PUT", "/api/auth/me", data),
    changePassword: (oldPassword, newPassword) =>
      request("POST", "/api/auth/change-password", { oldPassword, newPassword }),
    forgotPassword: (email) => request("POST", "/api/auth/forgot-password", { email }),
    resetPassword: (token, password) => request("POST", "/api/auth/reset-password", { token, password }),
  },
  users: {
    list: (q = "") => request("GET", `/api/users${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    get: (id) => request("GET", `/api/users/${id}`),
    follow: (id) => request("POST", `/api/users/${id}/follow`),
    unfollow: (id) => request("DELETE", `/api/users/${id}/follow`),
  },
  posts: {
    list: () => request("GET", "/api/posts"),
    create: (data) => request("POST", "/api/posts", data),
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
  },
  notifications: {
    list: () => request("GET", "/api/notifications"),
    readAll: () => request("POST", "/api/notifications/read-all"),
  },
  ai: {
    chat: (question) => request("POST", "/api/ai/chat", { question }),
  },
  messages: {
    conversations: () => request("GET", "/api/messages/conversations"),
    history: (userId) => request("GET", `/api/messages/${userId}`),
    send: (recipient_id, content) => request("POST", "/api/messages", { recipient_id, content }),
  },
};
