(() => {
  "use strict";

  class TaskManager {
    constructor(currentId = 0) {
      this.tasks = [];
      this.currentId = currentId;
    }

    addTask(name, description, dueDate, status = "PORHACER") {
      this.currentId += 1;
      const task = {
        id: this.currentId,
        name: name,
        description: description,
        dueDate: dueDate,
        status: status || "PORHACER",
      };

      this.tasks.push(task);
      return task;
    }

    deleteTask(id) {
      const taskId = Number(id);
      this.tasks = this.tasks.filter((task) => task.id !== taskId);
      return this.tasks;
    }

    toggleTask(id) {
      const taskId = Number(id);
      const task = this.tasks.find((item) => item.id === taskId);
      if (!task) return null;
      task.status = task.status === "COMPLETADA" ? "PORHACER" : "COMPLETADA";
      return task;
    }
  }

  window.TaskManager = TaskManager;

  const STORAGE_TASKS = "planificador.tasks";
  const PAGE_SIZE = 4;
  const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

  function padDate(value) {
    return String(value).padStart(2, "0");
  }

  function toISODateTime(offsetDays, hour, minutes = 0) {
    const date = new Date();
    date.setHours(hour, minutes, 0, 0);
    date.setDate(date.getDate() + offsetDays);
    return `${date.getFullYear()}-${padDate(date.getMonth() + 1)}-${padDate(date.getDate())}T${padDate(hour)}:${padDate(minutes)}`;
  }

  const seedTasks = () => [
    { id: 1, title: "Comprar materiales", desc: "Revisar la lista y comprar los materiales necesarios para la semana.", priority: "alta", date: toISODateTime(1, 9, 30), done: true },
    { id: 2, title: "Preparar presentación", desc: "Crear la presentación del avance del proyecto y revisar los datos clave.", priority: "media", date: toISODateTime(2, 15, 0), done: false },
    { id: 3, title: "Entrenar rutina", desc: "Completar la sesión de cardio y fuerza del día.", priority: "alta", date: toISODateTime(3, 18, 0), done: false },
    { id: 4, title: "Leer capítulo", desc: "Leer 20 páginas del libro recomendado y resumir 3 ideas clave.", priority: "baja", date: toISODateTime(4, 21, 30), done: false },
    { id: 5, title: "Finalizar informe", desc: "Cerrar el informe mensual con resultados y próximos pasos.", priority: "alta", date: toISODateTime(5, 13, 0), done: false },
    { id: 6, title: "Organizar escritorio", desc: "Ordenar archivos y dejar el espacio de trabajo listo para la semana.", priority: "media", date: toISODateTime(6, 11, 0), done: false },
    { id: 7, title: "Revisar viaje", desc: "Confirmar hospedaje y preparar el itinerario del fin de semana.", priority: "media", date: toISODateTime(7, 10, 15), done: true },
    { id: 8, title: "Ver documental", desc: "Ver un documental corto sobre productividad y organización.", priority: "baja", date: toISODateTime(8, 20, 0), done: false },
  ];

  const state = {
    tasks: loadTasks(),
    filter: "todas",
    page: 1,
  };

  const taskManager = new TaskManager();
  window.taskManager = taskManager;

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_TASKS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      /* ignore corrupt storage */
    }
    return seedTasks();
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_TASKS, JSON.stringify(state.tasks));
    syncTaskManagerFromState();
  }

  function syncTaskManagerFromState() {
    window.taskManager.tasks = state.tasks.map((task) => ({
      id: task.id,
      name: task.title,
      description: task.desc || "",
      dueDate: task.date || "",
      status: task.done ? "COMPLETADA" : "PORHACER",
      priority: task.priority,
      done: Boolean(task.done),
    }));

    window.taskManager.currentId = window.taskManager.tasks.reduce((maxId, task) => {
      const id = Number(task.id) || 0;
      return Math.max(maxId, id);
    }, 0);
  }

  function sortTasks() {
    state.tasks = [...state.tasks].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER;
      if (dateA !== dateB) return dateA - dateB;
      const priorityOrder = { alta: 0, media: 1, baja: 2 };
      return (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
    });
  }

  function formatDate(isoDateTime) {
    if (!isoDateTime) return "";
    const [datePart, timePart] = isoDateTime.split("T");
    const [y, m, d] = datePart.split("-").map(Number);
    if (!y || !m || !d) return isoDateTime;

    let formatted = `${d} ${MONTHS[m - 1]} ${y}`;

    if (timePart) {
      const [hh, mm] = timePart.split(":").map(Number);
      const period = hh >= 12 ? "PM" : "AM";
      const hour12 = hh % 12 === 0 ? 12 : hh % 12;
      formatted += ` · ${hour12}:${String(mm).padStart(2, "0")} ${period}`;
    }

    return formatted;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  const filterTabs = document.getElementById("filterTabs");
  filterTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-link");
    if (!btn) return;
    state.filter = btn.dataset.filter;
    state.page = 1;
    [...filterTabs.querySelectorAll(".nav-link")].forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });

  const form = document.getElementById("taskForm");
  const titleInput = document.getElementById("taskTitle");
  const descInput = document.getElementById("taskDesc");
  const dateInput = document.getElementById("taskDate");
  const formError = document.getElementById("formError");

  function validFormFieldInput(data) {
    if (!data.title) return "El título de la tarea no puede estar vacío.";
    if (!data.date) return "Debes seleccionar una fecha de entrega.";
    if (!data.priority) return "Debes seleccionar una prioridad.";
    return null;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const checkedPriority = form.querySelector('input[name="priority"]:checked');
    const data = {
      title: titleInput.value.trim(),
      desc: descInput.value.trim(),
      date: dateInput.value,
      priority: checkedPriority ? checkedPriority.value : "",
    };

    const errorMessage = validFormFieldInput(data);
    if (errorMessage) {
      formError.textContent = errorMessage;
      formError.hidden = false;
      return;
    }
    formError.hidden = true;

    const createdTask = window.taskManager.addTask(data.title, data.desc, data.date, "PORHACER");

    state.tasks.push({
      id: createdTask.id,
      title: data.title,
      desc: data.desc,
      priority: data.priority,
      date: data.date,
      done: false,
      status: createdTask.status,
    });

    sortTasks();
    saveTasks();
    form.reset();

    state.filter = "todas";
    [...filterTabs.querySelectorAll(".nav-link")].forEach((b) => b.classList.toggle("active", b.dataset.filter === "todas"));
    state.page = Math.max(1, Math.ceil(state.tasks.length / PAGE_SIZE));
    render();
  });

  const taskListEl = document.getElementById("taskList");
  taskListEl.addEventListener("click", (e) => {
    const checkBtn = e.target.closest(".task-check");
    const delBtn = e.target.closest(".task-delete");

    if (checkBtn) {
      const id = Number(checkBtn.dataset.id);
      const task = state.tasks.find((t) => t.id === id);
      if (task) {
        task.done = !task.done;
        const managerTask = window.taskManager.tasks.find((item) => item.id === task.id);
        if (managerTask) {
          managerTask.status = task.done ? "COMPLETADA" : "PORHACER";
        }
        saveTasks();
        render();
      }
      return;
    }

    if (delBtn) {
      const id = Number(delBtn.dataset.id);
      state.tasks = state.tasks.filter((t) => t.id !== id);
      window.taskManager.deleteTask(id);
      saveTasks();

      const filtered = getFilteredTasks();
      const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      state.page = Math.min(state.page, totalPages);
      render();
    }
  });

  const paginationEl = document.getElementById("pagination");
  paginationEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn || btn.disabled) return;
    state.page = Number(btn.dataset.page);
    render();
  });

  function getFilteredTasks() {
    if (state.filter === "todas") return state.tasks;
    return state.tasks.filter((t) => t.priority === state.filter);
  }

  function renderTaskCard(task) {
    return `
      <div class="card task-card priority-${task.priority} ${task.done ? "is-done" : ""}" data-id="${task.id}">
        <div class="card-body d-flex gap-3">
          <button class="task-check" data-id="${task.id}" aria-label="Marcar como completada">${task.done ? "✓" : ""}</button>
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <p class="task-title fw-bold mb-0">${escapeHtml(task.title)}</p>
              <span class="badge rounded-pill badge-${task.priority}">${task.priority.toUpperCase()}</span>
              <span class="badge rounded-pill ${task.done ? "text-bg-success" : "text-bg-secondary"}">${task.done ? "Completada" : "Pendiente"}</span>
            </div>
            ${task.desc ? `<p class="task-desc small mb-1 mt-1">${escapeHtml(task.desc)}</p>` : ""}
            ${task.date ? `<p class="small text-body-secondary mb-0">${formatDate(task.date)}</p>` : ""}
          </div>
          <button class="task-delete" data-id="${task.id}" aria-label="Eliminar tarea">×</button>
        </div>
      </div>
    `;
  }

  function renderPagination(totalItems) {
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;

    let html = `
      <li class="page-item ${state.page === 1 ? "disabled" : ""}">
        <button class="page-link" data-page="${state.page - 1}">←</button>
      </li>
    `;
    for (let p = 1; p <= totalPages; p++) {
      html += `
        <li class="page-item ${p === state.page ? "active" : ""}">
          <button class="page-link" data-page="${p}">${p}</button>
        </li>
      `;
    }
    html += `
      <li class="page-item ${state.page === totalPages ? "disabled" : ""}">
        <button class="page-link" data-page="${state.page + 1}">→</button>
      </li>
    `;

    paginationEl.innerHTML = html;
    paginationEl.closest("nav").style.display = totalPages <= 1 ? "none" : "block";
  }

  const RING_CIRCUMFERENCE = 2 * Math.PI * 26;

  function render() {
    const total = state.tasks.length;
    const completed = state.tasks.filter((t) => t.done).length;
    const pending = total - completed;
    const countAlta = state.tasks.filter((t) => t.priority === "alta").length;
    const countMedia = state.tasks.filter((t) => t.priority === "media").length;
    const countBaja = state.tasks.filter((t) => t.priority === "baja").length;

    const totalEl = document.getElementById("summaryTotal");
    const completedEl = document.getElementById("summaryCompleted");
    const pendingEl = document.getElementById("summaryPending");
    const altaEl = document.getElementById("summaryAlta");

    if (totalEl) totalEl.textContent = total;
    if (completedEl) completedEl.textContent = completed;
    if (pendingEl) pendingEl.textContent = pending;
    if (altaEl) altaEl.textContent = countAlta;

    const countAltaEl = document.getElementById("countAlta");
    const countMediaEl = document.getElementById("countMedia");
    const countBajaEl = document.getElementById("countBaja");
    if (countAltaEl) countAltaEl.textContent = countAlta;
    if (countMediaEl) countMediaEl.textContent = countMedia;
    if (countBajaEl) countBajaEl.textContent = countBaja;

    const completedRatioEl = document.getElementById("completedRatio");
    if (completedRatioEl) completedRatioEl.textContent = `${completed}/${total} completadas`;
    const taskCountEl = document.getElementById("taskCount");
    if (taskCountEl) taskCountEl.textContent = `${total} tarea${total === 1 ? "" : "s"}`;

    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    const progressPctEl = document.getElementById("progressPct");
    if (progressPctEl) progressPctEl.textContent = `${pct}%`;
    const ringFill = document.getElementById("progressRingFill");
    if (ringFill) {
      ringFill.style.strokeDasharray = String(RING_CIRCUMFERENCE);
      ringFill.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - pct / 100));
    }

    const filtered = getFilteredTasks();
    const start = (state.page - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    const emptyState = document.getElementById("emptyState");
    if (filtered.length === 0) {
      taskListEl.innerHTML = "";
      if (emptyState) emptyState.hidden = false;
    } else {
      if (emptyState) emptyState.hidden = true;
      taskListEl.innerHTML = pageItems.map(renderTaskCard).join("");
    }

    renderPagination(filtered.length);
  }

  syncTaskManagerFromState();
  render();
})();
