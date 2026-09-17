
const RENDER_API_URL = ""; 
const LOCAL_API_URL = "http://localhost:8080";

(() => {
  "use strict";

  const API_BASE_URL = RENDER_API_URL || LOCAL_API_URL;
  const API_TASKS_URL = `${API_BASE_URL}/api/tasks`;
  const API_AUTH_URL = `${API_BASE_URL}/api/auth`;

  async function safeFetch(url, options) {
    try {
      return await fetch(url, options);
    } catch (networkError) {
      throw new Error("No se pudo conectar con el servidor. Intenta de nuevo más tarde.");
    }
  }

  async function handleResponse(res) {
    if (res.status === 204) return null;

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const message = (data && (data.message || data.error)) || `Error ${res.status}`;
      const error = new Error(message);
      error.status = res.status;
      error.details = data;
      throw error;
    }

    return data;
  }

  // Convierte una tarea del backend { id, name, description, dueDate, status }
  // al formato que usa la interfaz { id, title, name, desc, description, date, dueDate, status }.
  function toFrontend(task) {
    return {
      id: task.id,
      title: task.name,
      name: task.name,
      desc: task.description || "",
      description: task.description || "",
      date: task.dueDate || "",
      dueDate: task.dueDate || "",
      status: task.status || "PENDIENTE",
    };
  }

  // Convierte una tarea de la interfaz al formato que espera el backend.
  function toBackend(task) {
    return {
      name: task.title || task.name,
      description: task.desc || task.description || "",
      dueDate: task.date || task.dueDate,
      status: task.status || "PENDIENTE",
    };
  }

  const Api = {
    baseUrl: API_BASE_URL,
    tasksUrl: API_TASKS_URL,
    toFrontend,
    toBackend,

    async getTasks() {
      const res = await safeFetch(API_TASKS_URL);
      const data = await handleResponse(res);
      return Array.isArray(data) ? data.map(toFrontend) : [];
    },

    async createTask(task) {
      const res = await safeFetch(API_TASKS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toBackend(task)),
      });
      return toFrontend(await handleResponse(res));
    },

    async updateTask(id, task) {
      const res = await safeFetch(`${API_TASKS_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toBackend(task)),
      });
      return toFrontend(await handleResponse(res));
    },

    async deleteTask(id) {
      const res = await safeFetch(`${API_TASKS_URL}/${id}`, { method: "DELETE" });
      return handleResponse(res);
    },

    async login(credentials) {
      const res = await safeFetch(`${API_AUTH_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      return handleResponse(res);
    },

    async register(payload) {
      const res = await safeFetch(`${API_AUTH_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async updateProfile(id, payload) {
      const res = await safeFetch(`${API_AUTH_URL}/profile/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async getProfile(id) {
      const res = await safeFetch(`${API_AUTH_URL}/profile/${id}`);
      return handleResponse(res);
    },

    async resetPassword(payload) {
      const res = await safeFetch(`${API_AUTH_URL}/reset-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },
  };

  window.Api = Api;
})();
