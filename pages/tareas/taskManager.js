(() => {
  "use strict";

  const PAGE_SIZE = 4;

  const MONTHS = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];

  const NEXT_STATUS = {
    "PENDIENTE": "EN PROGRESO",
    "EN PROGRESO": "REVISIÓN",
    "REVISIÓN": "HECHO",
    "HECHO": "HECHO",
    "DONE": "HECHO",
  };

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

  const state = {
    tasks: [],
    filter: "todos",
    page: 1,
  };

  function sortTasks() {
    state.tasks = [...state.tasks].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    });
  }

  // ==========================================
  // Elementos del DOM
  // ==========================================
  const filterTabs = document.getElementById("filterTabs");
  const form = document.getElementById("taskForm");
  const titleInput = document.getElementById("taskTitle");
  const descInput = document.getElementById("taskDesc");
  const statusSelect = document.getElementById("taskStatus");
  const dateInput = document.getElementById("taskDate");
  const formError = document.getElementById("formError");
  const submitBtn = form.querySelector("button[type='submit']");
  const taskListEl = document.getElementById("taskList");
  const paginationEl = document.getElementById("pagination");
  const listError = document.getElementById("listError");

  function updateMinDateTime() {
    if (!dateInput) return;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const minDateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    dateInput.min = minDateTime;
  }

  updateMinDateTime();
  dateInput.addEventListener("focus", updateMinDateTime);
  dateInput.addEventListener("click", updateMinDateTime);

  dateInput.addEventListener("input", () => {
    dateInput.classList.remove("is-invalid");
    if (formError.textContent.includes("fecha")) {
      formError.hidden = true;
    }
  });

  filterTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-link");
    if (!btn) return;

    state.filter = btn.dataset.filter;
    state.page = 1;

    [...filterTabs.querySelectorAll(".nav-link")].forEach((b) =>
      b.classList.toggle("active", b === btn)
    );

    render();
  });

  function validFormFieldInput(data) {
    if (!data.title) return "El título de la tarea no puede estar vacío.";
    if (!data.status) return "Debes seleccionar un estado.";
    if (!data.date) return "Debes seleccionar una fecha de entrega.";

    const selectedDate = new Date(data.date);
    const now = new Date();

    if (selectedDate.getTime() < now.getTime() - 60000) {
      return "La fecha límite no puede ser anterior a la fecha y hora actual.";
    }

    return null;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      title: titleInput.value.trim(),
      desc: descInput.value.trim(),
      status: statusSelect.value,
      date: dateInput.value,
    };

    const errorMessage = validFormFieldInput(data);

    if (errorMessage) {
      formError.textContent = errorMessage;
      formError.hidden = false;

      if (errorMessage.includes("fecha")) {
        dateInput.classList.add("is-invalid");
        dateInput.focus();
      }
      return;
    }

    formError.hidden = true;
    dateInput.classList.remove("is-invalid");

    submitBtn.disabled = true;
    submitBtn.textContent = "GUARDANDO...";

    try {
      const createdTask = await window.Api.createTask(data);
      state.tasks.push(createdTask);
      sortTasks();

      form.reset();
      updateMinDateTime();

      state.filter = "todos";
      [...filterTabs.querySelectorAll(".nav-link")].forEach((b) =>
        b.classList.toggle("active", b.dataset.filter === "todos")
      );

      state.page = Math.max(1, Math.ceil(state.tasks.length / PAGE_SIZE));

      render();
      window.Components && window.Components.fillStats && window.Components.fillStats();
    } catch (error) {
      formError.textContent = error.message || "No se pudo guardar la tarea. Verifica que el backend esté en ejecución.";
      formError.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "+ AGREGAR TAREA";
    }
  });

  taskListEl.addEventListener("click", async (e) => {
    const doneBtn = e.target.closest(".done-button");
    const delBtn = e.target.closest(".task-delete");

    if (doneBtn) {
      const parentTask = doneBtn.closest("[data-task-id]");
      if (!parentTask) return;

      const taskId = Number(parentTask.dataset.taskId);
      const task = state.tasks.find((item) => item.id === taskId);
      if (!task) return;

      doneBtn.disabled = true;

      try {
        const nextStatus = NEXT_STATUS[task.status] || "EN PROGRESO";
        const updated = await window.Api.updateTask(taskId, { ...task, status: nextStatus });
        Object.assign(task, updated);
        render();
        window.Components && window.Components.fillStats && window.Components.fillStats();
      } catch (error) {
        doneBtn.disabled = false;
        showListError(error.message || "No se pudo actualizar la tarea.");
      }
      return;
    }

    if (delBtn) {
      const id = Number(delBtn.dataset.id);
      delBtn.disabled = true;

      try {
        await window.Api.deleteTask(id);
        state.tasks = state.tasks.filter((t) => t.id !== id);

        const filtered = getFilteredTasks();
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        state.page = Math.min(state.page, totalPages);

        render();
        window.Components && window.Components.fillStats && window.Components.fillStats();
      } catch (error) {
        delBtn.disabled = false;
        showListError(error.message || "No se pudo eliminar la tarea.");
      }
    }
  });

  paginationEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn || btn.disabled) return;

    state.page = Number(btn.dataset.page);
    render();
  });

  function showListError(message) {
    if (!listError) return;
    listError.textContent = message;
    listError.hidden = false;
    setTimeout(() => { listError.hidden = true; }, 4000);
  }

  function getFilteredTasks() {
    if (state.filter === "todos") return state.tasks;

    if (state.filter === "HECHO") {
      return state.tasks.filter((t) => t.status === "HECHO" || t.status === "DONE");
    }

    return state.tasks.filter((t) => t.status === state.filter);
  }

  function renderTaskCard(task) {
    const statusColors = {
      "PENDIENTE": "status-pendiente",
      "EN PROGRESO": "status-progreso",
      "REVISIÓN": "status-revision",
      "HECHO": "status-hecho",
      "DONE": "status-hecho",
    };

    const statusColor = statusColors[task.status] || "status-revision";

    return `
      <div class="card task-card" data-task-id="${task.id}">
        <div class="card-body d-flex gap-3">
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <p class="task-title fw-bold mb-0">${escapeHtml(task.title)}</p>
              <span class="badge rounded-pill ${statusColor}">${task.status}</span>
            </div>

            ${task.desc ? `<p class="task-desc small mb-1 mt-1">${escapeHtml(task.desc)}</p>` : ""}
            ${task.date ? `<p class="small text-body-secondary mb-0 mt-2">${formatDate(task.date)}</p>` : ""}
          </div>

          <button class="done-button btn btn-success" type="button" ${task.status === "HECHO" || task.status === "DONE" ? "disabled" : ""}>
            ${task.status === "HECHO" || task.status === "DONE" ? "Hecho" : "Actualizar estado"}
          </button>

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
    const completed = state.tasks.filter((t) => t.status === "HECHO" || t.status === "DONE").length;
    const pending = state.tasks.filter((t) => t.status === "PENDIENTE").length;
    const inProgress = state.tasks.filter((t) => t.status === "EN PROGRESO").length;
    const inReview = state.tasks.filter((t) => t.status === "REVISIÓN").length;

    const countAltaEl = document.getElementById("countAlta");
    const countMediaEl = document.getElementById("countMedia");
    const countBajaEl = document.getElementById("countBaja");
    const countHechoEl = document.getElementById("countHecho");

    if (countAltaEl) countAltaEl.textContent = inProgress;
    if (countMediaEl) countMediaEl.textContent = inReview;
    if (countBajaEl) countBajaEl.textContent = pending;
    if (countHechoEl) countHechoEl.textContent = completed;

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

  window.renderTasksUI = render;

  // ==========================================
  // Carga inicial desde el backend
  // ==========================================
  async function init() {
    try {
      state.tasks = await window.Api.getTasks();
      sortTasks();
      listError.hidden = true;
    } catch (error) {
      state.tasks = [];
      listError.textContent = "No se pudieron cargar tus tareas. Intenta de nuevo en unos minutos.";
      listError.hidden = false;
    }

    render();
    window.Components && window.Components.fillStats && window.Components.fillStats();
  }

  init();
})();
