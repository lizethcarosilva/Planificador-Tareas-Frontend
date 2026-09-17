(() => {
  "use strict";

  const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

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

  function isDone(task) {
    return task.status === "HECHO" || task.status === "DONE";
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function toDateKey(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : str;
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

  const dashError = document.getElementById("dashError");
  const dashTodayTasks = document.getElementById("dashTodayTasks");
  const dashTodayEmpty = document.getElementById("dashTodayEmpty");

  function showError(message) {
    dashError.textContent = message;
    dashError.hidden = false;
  }

  function renderTodayTask(task) {
    const badge = STATUS_BADGE[task.status] || "status-pendiente";
    return `
      <div class="today-task-item" data-task-id="${task.id}">
        <span class="today-task-radio ${isDone(task) ? "active" : ""}" role="button" aria-label="Marcar tarea"></span>
        <div class="flex-grow-1 min-w-0">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <p class="mb-0 fw-medium small" style="line-height: 1.35;">${escapeHtml(task.title)}</p>
            <span class="badge rounded-pill ${badge}" style="font-size: 10px;">${task.status}</span>
          </div>
          <span class="text-body-secondary" style="font-size: 11px;">${formatTime(task.date)}</span>
        </div>
      </div>
    `;
  }

  function renderTodayTasks(tasks) {
    const todayKey = toDateKey(new Date());
    const todayTasks = tasks
      .filter((t) => t.date && t.date.slice(0, 10) === todayKey)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (todayTasks.length === 0) {
      dashTodayTasks.innerHTML = "";
      dashTodayEmpty.hidden = false;
    } else {
      dashTodayEmpty.hidden = true;
      dashTodayTasks.innerHTML = todayTasks.map(renderTodayTask).join("");
    }

    return todayTasks;
  }

  dashTodayTasks.addEventListener("click", async (e) => {
    const radio = e.target.closest(".today-task-radio");
    if (!radio) return;

    const parent = radio.closest("[data-task-id]");
    const taskId = Number(parent.dataset.taskId);
    const task = allTasks.find((t) => t.id === taskId);
    if (!task || isDone(task)) return;

    const nextStatus = NEXT_STATUS[task.status] || "EN PROGRESO";
    if (nextStatus === "HECHO") radio.classList.add("active");

    try {
      const updated = await window.Api.updateTask(taskId, { ...task, status: nextStatus });
      Object.assign(task, updated);
      renderTodayTasks(allTasks);
      renderProgress(allTasks);
      renderStreak(allTasks);
      window.Components && window.Components.fillStats && window.Components.fillStats();
    } catch (error) {
      radio.classList.remove("active");
      showError(error.message || "No se pudo actualizar la tarea.");
    }
  });

  const DASH_RING_CIRCUMFERENCE = 2 * Math.PI * 100;

  function renderProgress(tasks) {
    const todayKey = toDateKey(new Date());
    const todayTasks = tasks.filter((t) => t.date && t.date.slice(0, 10) === todayKey);
    const completed = todayTasks.filter(isDone).length;
    const pct = todayTasks.length === 0 ? 0 : Math.round((completed / todayTasks.length) * 100);
    document.getElementById("dashProgressPct").textContent = `${pct}%`;

    const ring = document.getElementById("dashProgressRing");
    if (ring) {
      ring.style.strokeDasharray = String(DASH_RING_CIRCUMFERENCE);
      ring.style.strokeDashoffset = String(DASH_RING_CIRCUMFERENCE * (1 - pct / 100));
    }
  }

  function renderStreak(tasks) {
    const doneDates = new Set(
      tasks.filter(isDone).map((t) => t.date && t.date.slice(0, 10)).filter(Boolean)
    );

    let streak = 0;
    const cursor = new Date();
    for (let i = 0; i < 365; i++) {
      if (doneDates.has(toDateKey(cursor))) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    document.getElementById("dashStreakDays").textContent = streak;
    document.getElementById("dashStreakMsg").textContent =
      streak > 0 ? "¡Sigue así!" : "Completa una tarea hoy";
  }

  function renderMiniCalendar(tasks) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    document.getElementById("dashMiniCalMonth").textContent = `${MONTH_NAMES[month]} ${year}`;

    const tasksByDate = new Set(tasks.map((t) => t.date && t.date.slice(0, 10)).filter(Boolean));

    const firstOfMonth = new Date(year, month, 1);
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
    const todayKey = toDateKey(today);

    const user = window.Auth && window.Auth.getUser();
    const birthMonthDay = user && user.birthDate ? (() => {
      const [, bm, bd] = user.birthDate.split("-").map(Number);
      return { month: bm, day: bd };
    })() : null;

    let html = "";
    for (let i = 0; i < totalCells; i += 7) {
      html += "<tr>";
      for (let j = 0; j < 7; j++) {
        const dayNumber = i + j - firstWeekday + 1;
        const isOtherMonth = dayNumber < 1 || dayNumber > daysInMonth;
        const isWeekend = j >= 5;
        const cellDate = new Date(year, month, dayNumber);
        const key = toDateKey(cellDate);
        const isToday = !isOtherMonth && key === todayKey;
        const hasTask = !isOtherMonth && tasksByDate.has(key);
        const isBirthday = !isOtherMonth && birthMonthDay &&
          (month + 1) === birthMonthDay.month && cellDate.getDate() === birthMonthDay.day;

        const classes = [isOtherMonth ? "cal-other-month" : "", isWeekend ? "cal-weekend" : ""].join(" ");
        const plainDay = isOtherMonth ? ((dayNumber < 1) ? dayNumber + new Date(year, month, 0).getDate() : dayNumber - daysInMonth) : dayNumber;
        const content = isBirthday
          ? `<span class="cal-birthday-badge" title="¡Cumpleaños!"><i class="bi bi-gift-fill"></i>${plainDay}</span>`
          : (isToday ? `<span class="cal-today-badge">${plainDay}</span>` : String(plainDay));

        html += `<td class="${classes}">${content}${hasTask ? '<span class="mini-cal-task-dot"></span>' : ""}</td>`;
      }
      html += "</tr>";
    }

    document.getElementById("dashMiniCalBody").innerHTML = html;
  }

  let allTasks = [];

  async function init() {
    try {
      allTasks = await window.Api.getTasks();
      dashError.hidden = true;
    } catch (error) {
      allTasks = [];
      showError("No se pudieron cargar tus tareas. Intenta de nuevo en unos minutos.");
    }

    renderTodayTasks(allTasks);
    renderProgress(allTasks);
    renderStreak(allTasks);
    renderMiniCalendar(allTasks);
  }

  init();
})();
