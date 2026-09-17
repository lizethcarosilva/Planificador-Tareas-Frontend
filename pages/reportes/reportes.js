(() => {
  "use strict";

  const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

  const PAGE_SIZE = 5;

  const STATUS_BADGE = {
    "PENDIENTE": "status-pendiente",
    "EN PROGRESO": "status-progreso",
    "REVISIÓN": "status-revision",
    "HECHO": "status-hecho",
    "DONE": "status-hecho",
  };

  function isDone(task) {
    return task.status === "HECHO" || task.status === "DONE";
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function toDateInputValue(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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

  function formatLong(d) {
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  }

  // ==========================================
  // Cálculo de rangos ISO semana / mes
  // ==========================================
  function isoWeekToMonday(isoWeekStr) {
    const [yearStr, weekStr] = isoWeekStr.split("-W");
    const year = Number(yearStr);
    const week = Number(weekStr);
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = simple.getDay() || 7;
    const monday = new Date(simple);
    if (dayOfWeek <= 4) {
      monday.setDate(simple.getDate() - dayOfWeek + 1);
    } else {
      monday.setDate(simple.getDate() + 8 - dayOfWeek);
    }
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  function currentIsoWeekValue(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${pad(weekNo)}`;
  }

  function endOfDay(d) {
    const copy = new Date(d);
    copy.setHours(23, 59, 59, 999);
    return copy;
  }

  // ==========================================
  // Elementos del DOM
  // ==========================================
  const reportError = document.getElementById("reportError");
  const periodTypeTabs = document.getElementById("periodTypeTabs");
  const periodDay = document.getElementById("periodDay");
  const periodFrom = document.getElementById("periodFrom");
  const periodTo = document.getElementById("periodTo");
  const periodWeek = document.getElementById("periodWeek");
  const periodMonth = document.getElementById("periodMonth");
  const periodStatus = document.getElementById("periodStatus");
  const reportRangeLabel = document.getElementById("reportRangeLabel");
  const reportSummary = document.getElementById("reportSummary");
  const reportTableBody = document.getElementById("reportTableBody");
  const reportEmptyState = document.getElementById("reportEmptyState");
  const reportPagination = document.getElementById("reportPagination");

  function showError(message) {
    reportError.textContent = message;
    reportError.hidden = false;
  }

  let tasks = [];
  let filteredTasks = [];
  let currentPeriod = "day";
  let page = 1;

  // ==========================================
  // Valores iniciales de los campos de fecha
  // ==========================================
  const today = new Date();
  periodDay.value = toDateInputValue(today);
  periodFrom.value = toDateInputValue(today);
  periodTo.value = toDateInputValue(today);
  periodWeek.value = currentIsoWeekValue(today);
  periodMonth.value = `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;

  periodTypeTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".period-btn");
    if (!btn) return;

    currentPeriod = btn.dataset.period;

    [...periodTypeTabs.querySelectorAll(".period-btn")].forEach((b) =>
      b.classList.toggle("active", b === btn)
    );

    document.querySelectorAll(".period-field").forEach((field) => {
      field.classList.toggle("d-none", field.dataset.periodField !== currentPeriod);
    });

    render();
  });

  [periodDay, periodFrom, periodTo, periodWeek, periodMonth, periodStatus].forEach((input) => {
    input.addEventListener("change", render);
  });

  function computeRange() {
    if (currentPeriod === "day") {
      const [y, m, d] = periodDay.value.split("-").map(Number);
      const start = new Date(y, m - 1, d);
      return { start, end: endOfDay(start), label: `Reporte del ${formatLong(start)}` };
    }

    if (currentPeriod === "range") {
      const [y1, m1, d1] = periodFrom.value.split("-").map(Number);
      const [y2, m2, d2] = periodTo.value.split("-").map(Number);
      const start = new Date(y1, m1 - 1, d1);
      const end = endOfDay(new Date(y2, m2 - 1, d2));
      return { start, end, label: `Reporte del ${formatLong(start)} al ${formatLong(end)}` };
    }

    if (currentPeriod === "week") {
      const start = isoWeekToMonday(periodWeek.value);
      const end = endOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6));
      return { start, end, label: `Semana del ${formatLong(start)} al ${formatLong(end)}` };
    }

    // month
    const [y, m] = periodMonth.value.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = endOfDay(new Date(y, m, 0));
    const monthLabel = start.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    return { start, end, label: `Reporte de ${monthLabel}` };
  }

  function renderTableRow(task) {
    const badge = STATUS_BADGE[task.status] || "status-revision";
    return `
      <tr>
        <td class="fw-semibold">${escapeHtml(task.title)}</td>
        <td class="text-body-secondary">${escapeHtml(task.desc || "—")}</td>
        <td>${formatDate(task.date)}</td>
        <td><span class="badge rounded-pill ${badge}">${task.status}</span></td>
      </tr>
    `;
  }

  function renderPagination(totalItems) {
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    if (page > totalPages) page = totalPages;

    if (totalPages <= 1) {
      reportPagination.innerHTML = "";
      reportPagination.closest("nav").style.display = "none";
      return;
    }

    let html = `
      <li class="page-item ${page === 1 ? "disabled" : ""}">
        <button class="page-link" data-report-page="${page - 1}">←</button>
      </li>
    `;

    for (let p = 1; p <= totalPages; p++) {
      html += `
        <li class="page-item ${p === page ? "active" : ""}">
          <button class="page-link" data-report-page="${p}">${p}</button>
        </li>
      `;
    }

    html += `
      <li class="page-item ${page === totalPages ? "disabled" : ""}">
        <button class="page-link" data-report-page="${page + 1}">→</button>
      </li>
    `;

    reportPagination.innerHTML = html;
    reportPagination.closest("nav").style.display = "block";
  }

  reportPagination.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-report-page]");
    if (!btn || btn.disabled) return;

    page = Number(btn.dataset.reportPage);
    renderTable();
  });

  function renderTable() {
    if (filteredTasks.length === 0) {
      reportTableBody.innerHTML = "";
      reportEmptyState.hidden = false;
    } else {
      reportEmptyState.hidden = true;
      const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE));
      if (page > totalPages) page = totalPages;
      const start = (page - 1) * PAGE_SIZE;
      const pageItems = filteredTasks.slice(start, start + PAGE_SIZE);
      reportTableBody.innerHTML = pageItems.map(renderTableRow).join("");
    }

    renderPagination(filteredTasks.length);
  }

  function render() {
    const { start, end, label } = computeRange();
    const statusFilter = periodStatus.value;

    filteredTasks = tasks
      .filter((t) => t.date)
      .filter((t) => {
        const taskDate = new Date(t.date);
        return taskDate >= start && taskDate <= end;
      })
      .filter((t) => statusFilter === "todos" || t.status === statusFilter)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    reportRangeLabel.textContent = label;

    const completed = filteredTasks.filter(isDone).length;
    reportSummary.textContent = `${filteredTasks.length} tarea${filteredTasks.length === 1 ? "" : "s"} · ${completed} completada${completed === 1 ? "" : "s"}`;

    page = 1;
    renderTable();
  }

  // ==========================================
  // Exportaciones
  // ==========================================
  function fileStamp() {
    const { start, end } = computeRange();
    return `${toDateInputValue(start)}_a_${toDateInputValue(end)}`;
  }

  document.getElementById("btnPrint").addEventListener("click", () => window.print());

  // Al imprimir se muestra el reporte completo (todas las páginas), no solo
  // la página visible en pantalla; al terminar se restaura la vista paginada.
  window.addEventListener("beforeprint", () => {
    reportTableBody.innerHTML = filteredTasks.map(renderTableRow).join("");
  });

  window.addEventListener("afterprint", () => {
    renderTable();
  });

  document.getElementById("btnExportPdf").addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text(reportRangeLabel.textContent, 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(reportSummary.textContent, 14, 22);

    doc.autoTable({
      startY: 28,
      head: [["Título", "Descripción", "Fecha", "Estado"]],
      body: filteredTasks.map((t) => [t.title, t.desc || "—", formatDate(t.date), t.status]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [124, 58, 237] },
    });

    doc.save(`reporte-tareas-${fileStamp()}.pdf`);
  });

  document.getElementById("btnExportExcel").addEventListener("click", () => {
    const rows = filteredTasks.map((t) => ({
      "Título": t.title,
      "Descripción": t.desc || "",
      "Fecha": formatDate(t.date),
      "Estado": t.status,
    }));

    const worksheet = window.XLSX.utils.json_to_sheet(rows);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, "Tareas");
    window.XLSX.writeFile(workbook, `reporte-tareas-${fileStamp()}.xlsx`);
  });

  document.getElementById("btnExportWord").addEventListener("click", () => {
    const rowsHtml = filteredTasks.map((t) => `
      <tr>
        <td>${escapeHtml(t.title)}</td>
        <td>${escapeHtml(t.desc || "")}</td>
        <td>${formatDate(t.date)}</td>
        <td>${escapeHtml(t.status)}</td>
      </tr>
    `).join("");

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>Reporte de tareas</title></head>
      <body style="font-family:Arial, sans-serif;">
        <h2>${escapeHtml(reportRangeLabel.textContent)}</h2>
        <p>${escapeHtml(reportSummary.textContent)}</p>
        <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-size:12px;width:100%;">
          <thead>
            <tr style="background:#7c3aed;color:#ffffff;">
              <th>Título</th><th>Descripción</th><th>Fecha</th><th>Estado</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(["﻿", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-tareas-${fileStamp()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  async function init() {
    try {
      tasks = await window.Api.getTasks();
      reportError.hidden = true;
    } catch (error) {
      tasks = [];
      showError("No se pudieron cargar tus tareas. Intenta de nuevo en unos minutos.");
    }
    render();
  }

  init();
})();
