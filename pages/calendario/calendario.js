(() => {
  "use strict";

  const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  const STATUS_DOT = {
    "PENDIENTE": "dot-baja",
    "EN PROGRESO": "dot-alta",
    "REVISIÓN": "dot-media",
    "HECHO": "dot-hecho",
    "DONE": "dot-hecho",
  };

  const STATUS_BADGE = {
    "PENDIENTE": "status-pendiente",
    "EN PROGRESO": "status-progreso",
    "REVISIÓN": "status-revision",
    "HECHO": "status-hecho",
    "DONE": "status-hecho",
  };

  const NEXT_STATUS = {
    "PENDIENTE": "EN PROGRESO",
    "EN PROGRESO": "REVISIÓN",
    "REVISIÓN": "HECHO",
    "HECHO": "HECHO",
    "DONE": "HECHO",
  };

  const DAY_PAGE_SIZE = 3;

  function pad(n) { return String(n).padStart(2, "0"); }

  function dateKey(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function taskDateKey(task) {
    if (!task.date) return null;
    return task.date.split("T")[0];
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function formatTime(isoDateTime) {
    const timePart = isoDateTime && isoDateTime.split("T")[1];
    if (!timePart) return "";
    const [hh, mm] = timePart.split(":").map(Number);
    const period = hh >= 12 ? "PM" : "AM";
    const hour12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${hour12}:${String(mm).padStart(2, "0")} ${period}`;
  }

  function getBirthMonthDay() {
    const user = window.Auth && window.Auth.getUser();
    if (!user || !user.birthDate) return null;
    const [, m, d] = user.birthDate.split("-").map(Number);
    return { month: m, day: d };
  }

  const state = {
    tasks: [],
    tasksByDate: new Map(),
    currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    selectedDate: new Date(),
    dayPage: 1,
  };

  const calGrid = document.getElementById("calGrid");
  const calMonthLabel = document.getElementById("calMonthLabel");
  const calSelectedTasks = document.getElementById("calSelectedTasks");
  const calSelectedDateLabel = document.getElementById("calSelectedDateLabel");
  const calEmptyState = document.getElementById("calEmptyState");
  const calError = document.getElementById("calError");
  const calPagination = document.getElementById("calPagination");

  function showError(message) {
    calError.textContent = message;
    calError.hidden = false;
  }

  function hideError() {
    calError.hidden = true;
  }

  function groupTasksByDate(tasks) {
    const map = new Map();
    tasks.forEach((task) => {
      const key = taskDateKey(task);
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(task);
    });
    return map;
  }

  function renderGrid() {
    const year = state.currentMonth.getFullYear();
    const month = state.currentMonth.getMonth();

    calMonthLabel.textContent = `${MONTH_NAMES[month]} ${year}`;

    const firstOfMonth = new Date(year, month, 1);
    // Lunes = 0 ... Domingo = 6
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

    const todayKey = dateKey(new Date());
    const selectedKey = dateKey(state.selectedDate);
    const birthMonthDay = getBirthMonthDay();

    let html = "";

    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - firstWeekday + 1;
      const cellDate = new Date(year, month, dayNumber);
      const isOtherMonth = dayNumber < 1 || dayNumber > daysInMonth;
      const key = dateKey(cellDate);
      const isToday = key === todayKey;
      const isSelected = key === selectedKey;
      const isWeekend = i % 7 >= 5;
      const isBirthday = !isOtherMonth && birthMonthDay &&
        (month + 1) === birthMonthDay.month && cellDate.getDate() === birthMonthDay.day;

      const dayTasks = state.tasksByDate.get(key) || [];
      const visibleTasks = dayTasks.slice(0, 3);
      const extraCount = dayTasks.length - visibleTasks.length;

      const pillsHtml = visibleTasks
        .map((t) => `<span class="cal-task-pill"><span class="dot ${STATUS_DOT[t.status] || "dot-media"}"></span><span class="cal-task-pill-text">${escapeHtml(t.title)}</span></span>`)
        .join("");

      const moreHtml = extraCount > 0 ? `<span class="cal-more-badge">+${extraCount} más</span>` : "";

      const dayNumberHtml = isBirthday
        ? `<span class="cal-birthday-badge" title="¡Cumpleaños!"><i class="bi bi-gift-fill"></i>${cellDate.getDate()}</span>`
        : String(cellDate.getDate());

      html += `
        <button type="button" class="cal-day-cell ${isOtherMonth ? "cal-other-month" : ""} ${isToday ? "cal-is-today" : ""} ${isSelected ? "cal-is-selected" : ""} ${isWeekend ? "cal-weekend" : ""}" data-date="${key}">
          <span class="cal-day-number">${dayNumberHtml}</span>
          <span class="cal-day-tasks">${pillsHtml}${moreHtml}</span>
        </button>
      `;
    }

    calGrid.innerHTML = html;
  }

  function renderTaskRow(task) {
    const badge = STATUS_BADGE[task.status] || "status-revision";
    const time = formatTime(task.date);

    return `
      <div class="card task-card" data-task-id="${task.id}">
        <div class="card-body d-flex gap-3">
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <p class="task-title fw-bold mb-0">${escapeHtml(task.title)}</p>
              <span class="badge rounded-pill ${badge}">${task.status}</span>
            </div>
            ${task.desc ? `<p class="task-desc small mb-1 mt-1">${escapeHtml(task.desc)}</p>` : ""}
            ${time ? `<p class="small text-body-secondary mb-0 mt-2">${time}</p>` : ""}
          </div>
          <button class="done-button btn btn-success" type="button" ${task.status === "HECHO" || task.status === "DONE" ? "disabled" : ""}>
            ${task.status === "HECHO" || task.status === "DONE" ? "Hecho" : "Actualizar estado"}
          </button>
          <button class="task-delete" data-id="${task.id}" aria-label="Eliminar tarea">×</button>
        </div>
      </div>
    `;
  }

  function renderDayPagination(totalItems) {
    const totalPages = Math.max(1, Math.ceil(totalItems / DAY_PAGE_SIZE));
    if (state.dayPage > totalPages) state.dayPage = totalPages;

    if (totalPages <= 1) {
      calPagination.innerHTML = "";
      calPagination.closest("nav").style.display = "none";
      return;
    }

    let html = `
      <li class="page-item ${state.dayPage === 1 ? "disabled" : ""}">
        <button class="page-link" data-day-page="${state.dayPage - 1}">←</button>
      </li>
    `;

    for (let p = 1; p <= totalPages; p++) {
      html += `
        <li class="page-item ${p === state.dayPage ? "active" : ""}">
          <button class="page-link" data-day-page="${p}">${p}</button>
        </li>
      `;
    }

    html += `
      <li class="page-item ${state.dayPage === totalPages ? "disabled" : ""}">
        <button class="page-link" data-day-page="${state.dayPage + 1}">→</button>
      </li>
    `;

    calPagination.innerHTML = html;
    calPagination.closest("nav").style.display = "block";
  }

  function renderSelectedDayPanel() {
    const key = dateKey(state.selectedDate);
    const dayTasks = (state.tasksByDate.get(key) || []).slice().sort((a, b) => (a.date > b.date ? 1 : -1));

    calSelectedDateLabel.textContent = state.selectedDate.toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long",
    });

    const totalPages = Math.max(1, Math.ceil(dayTasks.length / DAY_PAGE_SIZE));
    if (state.dayPage > totalPages) state.dayPage = totalPages;

    if (dayTasks.length === 0) {
      calSelectedTasks.innerHTML = "";
      calSelectedTasks.classList.add("d-none");
      calEmptyState.hidden = false;
    } else {
      calSelectedTasks.classList.remove("d-none");
      calEmptyState.hidden = true;
      const start = (state.dayPage - 1) * DAY_PAGE_SIZE;
      const pageItems = dayTasks.slice(start, start + DAY_PAGE_SIZE);
      calSelectedTasks.innerHTML = pageItems.map(renderTaskRow).join("");
    }

    renderDayPagination(dayTasks.length);
  }

  calPagination.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-day-page]");
    if (!btn || btn.disabled) return;

    state.dayPage = Number(btn.dataset.dayPage);
    renderSelectedDayPanel();
  });

  function selectDate(key) {
    const [y, m, d] = key.split("-").map(Number);
    state.selectedDate = new Date(y, m - 1, d);
    state.dayPage = 1;
    renderGrid();
    renderSelectedDayPanel();
  }

  calGrid.addEventListener("click", (e) => {
    const cell = e.target.closest("[data-date]");
    if (!cell) return;
    selectDate(cell.dataset.date);
  });

  calSelectedTasks.addEventListener("click", async (e) => {
    const doneBtn = e.target.closest(".done-button");
    const delBtn = e.target.closest(".task-delete");

    if (doneBtn) {
      const parent = doneBtn.closest("[data-task-id]");
      const taskId = Number(parent.dataset.taskId);
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return;

      doneBtn.disabled = true;
      try {
        const nextStatus = NEXT_STATUS[task.status] || "EN PROGRESO";
        const updated = await window.Api.updateTask(taskId, { ...task, status: nextStatus });
        Object.assign(task, updated);
        refreshDerivedState();
        window.Components && window.Components.fillStats && window.Components.fillStats();
      } catch (error) {
        doneBtn.disabled = false;
        showError(error.message || "No se pudo actualizar la tarea.");
      }
      return;
    }

    if (delBtn) {
      const id = Number(delBtn.dataset.id);
      delBtn.disabled = true;
      try {
        await window.Api.deleteTask(id);
        state.tasks = state.tasks.filter((t) => t.id !== id);
        refreshDerivedState();
        window.Components && window.Components.fillStats && window.Components.fillStats();
      } catch (error) {
        delBtn.disabled = false;
        showError(error.message || "No se pudo eliminar la tarea.");
      }
    }
  });

  document.getElementById("calPrevBtn").addEventListener("click", () => {
    state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1);
    renderGrid();
  });

  document.getElementById("calNextBtn").addEventListener("click", () => {
    state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1);
    renderGrid();
  });

  document.getElementById("calTodayBtn").addEventListener("click", () => {
    const today = new Date();
    state.currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    state.selectedDate = today;
    state.dayPage = 1;
    renderGrid();
    renderSelectedDayPanel();
  });

  function refreshDerivedState() {
    state.tasksByDate = groupTasksByDate(state.tasks);
    renderGrid();
    renderSelectedDayPanel();
  }

  async function init() {
    try {
      state.tasks = await window.Api.getTasks();
      hideError();
    } catch (error) {
      state.tasks = [];
      showError("No se pudieron cargar tus tareas. Intenta de nuevo en unos minutos.");
    }
    refreshDerivedState();
  }

  init();
})();
