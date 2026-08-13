(() => {
  "use strict";

  const STORAGE_TASKS = "planificador.tasks";
  const PAGE_SIZE = 4;
  const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

  const seedTasks = () => [
    { id: 1, title: "Comprar leche", desc: "Comprar leche descremada en el supermercado.", priority: "alta", date: "2025-01-15", done: true },
    { id: 2, title: "Estudiar Java", desc: "Repasar los capítulos 8 al 12 de colecciones.", priority: "media", date: "2025-01-16", done: false },
    { id: 3, title: "Hacer ejercicio", desc: "Completar la rutina de cardio de 45 minutos.", priority: "alta", date: "2025-01-17", done: false },
    { id: 4, title: "Leer libro", desc: "Leer 20 páginas del libro de desarrollo personal.", priority: "baja", date: "2025-01-18", done: false },
    { id: 5, title: "Terminar informe", desc: "Finalizar el informe mensual de avances.", priority: "alta", date: "2025-01-19", done: false },
    { id: 6, title: "Organizar escritorio", desc: "Ordenar documentos y limpiar el espacio de trabajo.", priority: "media", date: "2025-01-20", done: false },
    { id: 7, title: "Planificar viaje", desc: "Definir itinerario y reservar alojamiento.", priority: "media", date: "2025-01-21", done: true },
    { id: 8, title: "Ver documental", desc: "Ver un documental sobre productividad.", priority: "baja", date: "2025-01-22", done: false },
  ];

  const state = {
    tasks: loadTasks(),
    filter: "todas",
    page: 1,
  };

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
  }

  function formatDate(isoDate) {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-").map(Number);
    if (!y || !m || !d) return isoDate;
    return `${d} ${MONTHS[m - 1]} ${y}`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== Filter tabs (nav-pills) =====
  const filterTabs = document.getElementById("filterTabs");
  filterTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-link");
    if (!btn) return;
    state.filter = btn.dataset.filter;
    state.page = 1;
    [...filterTabs.querySelectorAll(".nav-link")].forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });

  // ===== Add task form =====
  const form = document.getElementById("taskForm");
  const titleInput = document.getElementById("taskTitle");
  const descInput = document.getElementById("taskDesc");
  const dateInput = document.getElementById("taskDate");
  const formError = document.getElementById("formError");

  // Revisa los datos del formulario antes de crear la tarea.
  // Devuelve un mensaje de error si algo falta, o null si todo es válido.
  function validFormFieldInput(data) {
    console.log("nombre:", data.title);
    console.log("descripcion:", data.desc);
    console.log("fecha:", data.date);
    console.log("estado:", data.priority);

    if (!data.title) return "El título de la tarea no puede estar vacío.";
    if (!data.desc) return "La descripción no puede estar vacía.";
    if (!data.date) return "Debes seleccionar una fecha de entrega.";
    if (!data.priority) return "Debes seleccionar un estado.";
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

    const newTask = {
      id: Date.now(),
      title: data.title,
      desc: data.desc,
      priority: data.priority,
      date: data.date,
      done: false,
    };

    state.tasks.push(newTask);
    saveTasks();

    form.reset();

    state.filter = "todas";
    [...filterTabs.querySelectorAll(".nav-link")].forEach((b) => b.classList.toggle("active", b.dataset.filter === "todas"));
    state.page = Math.max(1, Math.ceil(state.tasks.length / PAGE_SIZE));

    render();
  });

  // ===== Task list interactions (delegated) =====
  const taskListEl = document.getElementById("taskList");
  taskListEl.addEventListener("click", (e) => {
    const checkBtn = e.target.closest(".task-check");
    const delBtn = e.target.closest(".task-delete");

    if (checkBtn) {
      const id = Number(checkBtn.dataset.id);
      const task = state.tasks.find((t) => t.id === id);
      if (task) {
        task.done = !task.done;
        saveTasks();
        render();
      }
      return;
    }

    if (delBtn) {
      const id = Number(delBtn.dataset.id);
      state.tasks = state.tasks.filter((t) => t.id !== id);
      saveTasks();

      const filtered = getFilteredTasks();
      const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      state.page = Math.min(state.page, totalPages);

      render();
    }
  });

  // ===== Pagination =====
  const paginationEl = document.getElementById("pagination");
  paginationEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn || btn.disabled) return;
    state.page = Number(btn.dataset.page);
    render();
  });

  // ===== Rendering =====
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

    document.getElementById("statCompleted").textContent = completed;
    document.getElementById("statPending").textContent = pending;
    document.getElementById("countAlta").textContent = countAlta;
    document.getElementById("countMedia").textContent = countMedia;
    document.getElementById("countBaja").textContent = countBaja;
    document.getElementById("completedRatio").textContent = `${completed}/${total} completadas`;
    document.getElementById("taskCount").textContent = `${total} tarea${total === 1 ? "" : "s"}`;

    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    document.getElementById("progressPct").textContent = `${pct}%`;
    const ringFill = document.getElementById("progressRingFill");
    ringFill.style.strokeDasharray = String(RING_CIRCUMFERENCE);
    ringFill.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - pct / 100));

    const filtered = getFilteredTasks();
    const start = (state.page - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    const emptyState = document.getElementById("emptyState");
    if (filtered.length === 0) {
      taskListEl.innerHTML = "";
      emptyState.hidden = false;
    } else {
      emptyState.hidden = true;
      taskListEl.innerHTML = pageItems.map(renderTaskCard).join("");
    }

    renderPagination(filtered.length);
  }

  render();
})();
