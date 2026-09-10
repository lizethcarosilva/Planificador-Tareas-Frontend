(() => {
  "use strict";

  class TaskManager {
    constructor(currentId = 0) {
      this.tasks = [];
      this.currentId = currentId;
    }

    addTask(name, description, dueDate, status = "PENDIENTE") {
      this.currentId += 1;

      const task = {
        id: this.currentId,
        name: name,
        title: name,
        description: description,
        desc: description,
        dueDate: dueDate,
        date: dueDate,
        status: status || "PENDIENTE",
      };

      this.tasks.push(task);

      return task;
    }

    deleteTask(id) {
      const taskId = Number(id);

      this.tasks = this.tasks.filter(
        (task) => task.id !== taskId
      );

      return this.tasks;
    }

    getTaskById(taskId) {
      const id = Number(taskId);
      let foundTask;

      for (const task of this.tasks) {
        if (task.id === id) {
          foundTask = task;
          break;
        }
      }

      return foundTask;
    }

    toggleTask(id) {
      const taskId = Number(id);

      const task = this.tasks.find(
        (item) => item.id === taskId
      );

      if (!task) return null;

      task.status =
        task.status === "HECHO" || task.status === "DONE"
          ? "PENDIENTE"
          : "DONE";

      return task;
    }

    // ==========================================
    // TAREA 8 - GUARDAR EN LOCALSTORAGE
    // ==========================================
    save() {
      const tasksJson = JSON.stringify(this.tasks);

      localStorage.setItem("tasks", tasksJson);

      const currentId = String(this.currentId);

      localStorage.setItem("currentId", currentId);
    }


    load() {
      const tasksJson = localStorage.getItem("tasks");

      if (tasksJson) {
        try {
          this.tasks = JSON.parse(tasksJson);
          if (Array.isArray(this.tasks)) {
            this.tasks.forEach((t) => {
              if (!t.name && t.title) t.name = t.title;
              if (!t.title && t.name) t.title = t.name;
              if (!t.description && t.desc) t.description = t.desc;
              if (!t.desc && t.description) t.desc = t.description;
              if (!t.dueDate && t.date) t.dueDate = t.date;
              if (!t.date && t.dueDate) t.date = t.dueDate;
            });
          } else {
            this.tasks = [];
          }
        } catch (error) {
          console.error(
            "Error al cargar las tareas:",
            error
          );

          this.tasks = [];
        }
      }

      const currentId = localStorage.getItem("currentId");

      if (currentId) {
        this.currentId = Number(currentId);
      } else if (this.tasks.length > 0) {
        // Respaldo por si existen tareas pero no currentId
        this.currentId = this.tasks.reduce(
          (maxId, task) => {
            return Math.max(
              maxId,
              Number(task.id) || 0
            );
          },
          0
        );
      }
    }

    render() {
      if (typeof window !== "undefined" && typeof window.renderTasksUI === "function") {
        window.renderTasksUI();
      }
    }
  }


  window.TaskManager = TaskManager;



  const PAGE_SIZE = 4;

  const NEXT_STATUS = {
    "PENDIENTE": "EN PROGRESO",
    "EN PROGRESO": "REVISIÓN",
    "REVISIÓN": "HECHO",
    "HECHO": "HECHO",
    "DONE": "HECHO",
  };

  const MONTHS = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];


  function padDate(value) {
    return String(value).padStart(2, "0");
  }

  function toISODateTime(
    offsetDays,
    hour,
    minutes = 0
  ) {
    const date = new Date();

    date.setHours(hour, minutes, 0, 0);

    date.setDate(
      date.getDate() + offsetDays
    );

    return `${date.getFullYear()}-${padDate(
      date.getMonth() + 1
    )}-${padDate(
      date.getDate()
    )}T${padDate(hour)}:${padDate(minutes)}`;
  }

  // ==========================================
  // TAREAS INICIALES
  // ==========================================

  const seedTasks = () => [
    {
      id: 1,
      title: "Comprar materiales",
      desc: "Revisar la lista y comprar los materiales necesarios para la semana.",
      status: "HECHO",
      date: toISODateTime(0, 8, 0),
    },

    {
      id: 2,
      title: "Preparar presentación",
      desc: "Crear la presentación del avance del proyecto y revisar los datos clave.",
      status: "PENDIENTE",
      date: toISODateTime(0, 9, 0),
    },

    {
      id: 3,
      title: "Entrenar rutina",
      desc: "Completar la sesión de cardio y fuerza del día.",
      status: "EN PROGRESO",
      date: toISODateTime(0, 10, 0),
    },

    {
      id: 4,
      title: "Leer capítulo",
      desc: "Leer 20 páginas del libro recomendado y resumir 3 ideas clave.",
      status: "PENDIENTE",
      date: toISODateTime(0, 11, 0),
    },

    {
      id: 5,
      title: "Finalizar informe",
      desc: "Cerrar el informe mensual con resultados y próximos pasos.",
      status: "REVISIÓN",
      date: toISODateTime(0, 14, 0),
    },

    {
      id: 6,
      title: "Organizar escritorio",
      desc: "Ordenar archivos y dejar el espacio de trabajo listo para la semana.",
      status: "EN PROGRESO",
      date: toISODateTime(1, 11, 0),
    },

    {
      id: 7,
      title: "Revisar viaje",
      desc: "Confirmar hospedaje y preparar el itinerario del fin de semana.",
      status: "HECHO",
      date: toISODateTime(2, 10, 15),
    },

    {
      id: 8,
      title: "Ver documental",
      desc: "Ver un documental corto sobre productividad y organización.",
      status: "PENDIENTE",
      date: toISODateTime(3, 20, 0),
    },
  ];



  const state = {
    tasks: [],
    filter: "todos",
    page: 1,
  };


  const taskManager = new TaskManager();

  window.taskManager = taskManager;



  taskManager.load();

  const hasStorageRecord = localStorage.getItem("tasks") !== null;

  if (!hasStorageRecord) {
    state.tasks = seedTasks();

    taskManager.tasks = state.tasks.map(
      (task) => ({
        id: task.id,
        name: task.title,
        title: task.title,
        description: task.desc || "",
        desc: task.desc || "",
        dueDate: task.date || "",
        date: task.date || "",
        status:
          task.status || "PENDIENTE",
      })
    );

    taskManager.currentId = Math.max(
      ...taskManager.tasks.map(
        (task) => Number(task.id)
      ),
      0
    );

    taskManager.save();

  } else {

    state.tasks = taskManager.tasks.map(
      (task) => ({
        id: Number(task.id),
        title: task.name || task.title,
        name: task.name || task.title,
        desc: task.description || task.desc || "",
        description: task.description || task.desc || "",
        status:
          task.status || "PENDIENTE",
        date: task.dueDate || task.date || "",
        dueDate: task.dueDate || task.date || "",
      })
    );
  }

  function sortTasks() {
    state.tasks = [...state.tasks].sort(
      (a, b) => {
        const dateA = a.date
          ? new Date(a.date).getTime()
          : Number.MAX_SAFE_INTEGER;

        const dateB = b.date
          ? new Date(b.date).getTime()
          : Number.MAX_SAFE_INTEGER;

        return dateA - dateB;
      }
    );
  }


  function formatDate(isoDateTime) {
    if (!isoDateTime) return "";

    const [
      datePart,
      timePart,
    ] = isoDateTime.split("T");

    const [
      y,
      m,
      d,
    ] = datePart
      .split("-")
      .map(Number);

    if (!y || !m || !d) {
      return isoDateTime;
    }

    let formatted = `${d} ${MONTHS[m - 1]
      } ${y}`;

    if (timePart) {
      const [
        hh,
        mm,
      ] = timePart
        .split(":")
        .map(Number);

      const period =
        hh >= 12 ? "PM" : "AM";

      const hour12 =
        hh % 12 === 0
          ? 12
          : hh % 12;

      formatted += ` · ${hour12}:${String(
        mm
      ).padStart(2, "0")} ${period}`;
    }

    return formatted;
  }


  function escapeHtml(str) {
    const div =
      document.createElement("div");

    div.textContent = str;

    return div.innerHTML;
  }



  const filterTabs =
    document.getElementById(
      "filterTabs"
    );

  filterTabs.addEventListener(
    "click",
    (e) => {
      const btn =
        e.target.closest(
          ".nav-link"
        );

      if (!btn) return;

      state.filter =
        btn.dataset.filter;

      state.page = 1;

      [
        ...filterTabs.querySelectorAll(
          ".nav-link"
        ),
      ].forEach((b) =>
        b.classList.toggle(
          "active",
          b === btn
        )
      );

      render();
    }
  );



  const form =
    document.getElementById(
      "taskForm"
    );

  const titleInput =
    document.getElementById(
      "taskTitle"
    );

  const descInput =
    document.getElementById(
      "taskDesc"
    );

  const statusSelect =
    document.getElementById(
      "taskStatus"
    );

  const dateInput =
    document.getElementById(
      "taskDate"
    );

  const formError =
    document.getElementById(
      "formError"
    );


  function updateMinDateTime() {
    if (!dateInput) return;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const minDateTime = `${now.getFullYear()}-${pad(
      now.getMonth() + 1
    )}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(
      now.getMinutes()
    )}`;
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



  function validFormFieldInput(
    data
  ) {
    if (!data.title) {
      return "El título de la tarea no puede estar vacío.";
    }

    if (!data.status) {
      return "Debes seleccionar un estado.";
    }

    if (!data.date) {
      return "Debes seleccionar una fecha de entrega.";
    }

    const selectedDate = new Date(data.date);
    const now = new Date();


    if (selectedDate.getTime() < now.getTime() - 60000) {
      return "La fecha límite no puede ser anterior a la fecha y hora actual.";
    }

    return null;
  }



  form.addEventListener(
    "submit",
    (e) => {
      e.preventDefault();

      const data = {
        title:
          titleInput.value.trim(),

        desc:
          descInput.value.trim(),

        status:
          statusSelect.value,

        date:
          dateInput.value,
      };

      const errorMessage =
        validFormFieldInput(data);

      if (errorMessage) {
        formError.textContent =
          errorMessage;

        formError.hidden = false;

        if (errorMessage.includes("fecha")) {
          dateInput.classList.add("is-invalid");
          dateInput.focus();
        }

        return;
      }

      formError.hidden = true;
      dateInput.classList.remove("is-invalid");


      const createdTask =
        window.taskManager.addTask(
          data.title,
          data.desc,
          data.date,
          data.status
        );

      state.tasks.push({
        id: createdTask.id,
        title: createdTask.name,
        name: createdTask.name,
        desc: createdTask.description,
        description: createdTask.description,
        status: createdTask.status,
        date: createdTask.dueDate,
        dueDate: createdTask.dueDate,
      });

      sortTasks();



      taskManager.save();

      form.reset();
      updateMinDateTime();

      state.filter = "todos";

      [
        ...filterTabs.querySelectorAll(
          ".nav-link"
        ),
      ].forEach((b) =>
        b.classList.toggle(
          "active",
          b.dataset.filter ===
          "todos"
        )
      );

      state.page = Math.max(
        1,
        Math.ceil(
          state.tasks.length /
          PAGE_SIZE
        )
      );

      render();
    }
  );


  const taskListEl =
    document.getElementById(
      "taskList"
    );

  taskListEl.addEventListener(
    "click",
    (e) => {
      const doneBtn =
        e.target.closest(
          ".done-button"
        );

      const delBtn =
        e.target.closest(
          ".task-delete"
        );



      if (doneBtn) {
        const parentTask =
          doneBtn.closest(
            "[data-task-id]"
          );

        if (!parentTask) return;

        const taskId = Number(
          parentTask.dataset.taskId
        );

        const task =
          taskManager.getTaskById(
            taskId
          );

        const stateTask =
          state.tasks.find(
            (item) =>
              item.id === taskId
          );

        if (
          !task ||
          !stateTask
        ) {
          return;
        }

        task.status = "DONE";
        stateTask.status = "DONE";


        taskManager.save();

        render();

        return;
      }



      if (delBtn) {
        const id = Number(
          delBtn.dataset.id
        );

        state.tasks =
          state.tasks.filter(
            (t) => t.id !== id
          );

        window.taskManager.deleteTask(
          id
        );


        taskManager.save();

        const filtered =
          getFilteredTasks();

        const totalPages =
          Math.max(
            1,
            Math.ceil(
              filtered.length /
              PAGE_SIZE
            )
          );

        state.page = Math.min(
          state.page,
          totalPages
        );

        render();
      }
    }
  );


  const paginationEl =
    document.getElementById(
      "pagination"
    );

  paginationEl.addEventListener(
    "click",
    (e) => {
      const btn =
        e.target.closest(
          "[data-page]"
        );

      if (
        !btn ||
        btn.disabled
      ) {
        return;
      }

      state.page = Number(
        btn.dataset.page
      );

      render();
    }
  );


  function getFilteredTasks() {
    if (
      state.filter ===
      "todos"
    ) {
      return state.tasks;
    }

    if (
      state.filter ===
      "HECHO"
    ) {
      return state.tasks.filter(
        (t) =>
          t.status ===
          "HECHO" ||
          t.status === "DONE"
      );
    }

    return state.tasks.filter(
      (t) =>
        t.status ===
        state.filter
    );
  }



  function renderTaskCard(
    task
  ) {
    const statusColors = {
      "PENDIENTE":
        "status-pendiente",

      "EN PROGRESO":
        "status-progreso",

      "REVISIÓN":
        "status-revision",

      "HECHO":
        "status-hecho",

      "DONE":
        "status-hecho",
    };

    const statusColor =
      statusColors[
      task.status
      ] ||
      "status-revision";

    return `
      <div
        class="card task-card"
        data-task-id="${task.id}"
      >
        <div class="card-body d-flex gap-3">

          <div class="flex-grow-1">

            <div class="d-flex align-items-center gap-2 flex-wrap">

              <p class="task-title fw-bold mb-0">
                ${escapeHtml(
      task.title
    )}
              </p>

              <span class="badge rounded-pill ${statusColor}">
                ${task.status}
              </span>

            </div>

            ${task.desc
        ? `
                  <p class="task-desc small mb-1 mt-1">
                    ${escapeHtml(
          task.desc
        )}
                  </p>
                `
        : ""
      }

            ${task.date
        ? `
                  <p class="small text-body-secondary mb-0 mt-2">
                    ${formatDate(
          task.date
        )}
                  </p>
                `
        : ""
      }

          </div>

          <button
            class="done-button btn btn-success"
            type="button"
            ${task.status ===
        "HECHO" ||
        task.status === "DONE"
        ? "disabled"
        : ""
      }
          >
            ${task.status ===
        "HECHO" ||
        task.status === "DONE"
        ? "Hecho"
        : "Mark As Done"
      }
          </button>

          <button
            class="task-delete"
            data-id="${task.id}"
            aria-label="Eliminar tarea"
          >
            ×
          </button>

        </div>
      </div>
    `;
  }


  function renderPagination(
    totalItems
  ) {
    const totalPages =
      Math.max(
        1,
        Math.ceil(
          totalItems /
          PAGE_SIZE
        )
      );

    if (
      state.page >
      totalPages
    ) {
      state.page =
        totalPages;
    }

    let html = `
      <li class="page-item ${state.page === 1
        ? "disabled"
        : ""
      }">
        <button
          class="page-link"
          data-page="${state.page - 1
      }"
        >
          ←
        </button>
      </li>
    `;

    for (
      let p = 1;
      p <= totalPages;
      p++
    ) {
      html += `
        <li class="page-item ${p === state.page
          ? "active"
          : ""
        }">
          <button
            class="page-link"
            data-page="${p}"
          >
            ${p}
          </button>
        </li>
      `;
    }

    html += `
      <li class="page-item ${state.page ===
        totalPages
        ? "disabled"
        : ""
      }">
        <button
          class="page-link"
          data-page="${state.page + 1
      }"
        >
          →
        </button>
      </li>
    `;

    paginationEl.innerHTML =
      html;

    paginationEl
      .closest("nav")
      .style.display =
      totalPages <= 1
        ? "none"
        : "block";
  }


  const RING_CIRCUMFERENCE =
    2 * Math.PI * 26;


  function render() {
    const total =
      state.tasks.length;

    const completed =
      state.tasks.filter(
        (t) =>
          t.status ===
          "HECHO" ||
          t.status === "DONE"
      ).length;

    const pending =
      state.tasks.filter(
        (t) =>
          t.status ===
          "PENDIENTE"
      ).length;

    const inProgress =
      state.tasks.filter(
        (t) =>
          t.status ===
          "EN PROGRESO"
      ).length;

    const inReview =
      state.tasks.filter(
        (t) =>
          t.status ===
          "REVISIÓN"
      ).length;



    const countAltaEl =
      document.getElementById(
        "countAlta"
      );

    const countMediaEl =
      document.getElementById(
        "countMedia"
      );

    const countBajaEl =
      document.getElementById(
        "countBaja"
      );

    const countHechoEl =
      document.getElementById(
        "countHecho"
      );

    if (countAltaEl) {
      countAltaEl.textContent =
        inProgress;
    }

    if (countMediaEl) {
      countMediaEl.textContent =
        inReview;
    }

    if (countBajaEl) {
      countBajaEl.textContent =
        pending;
    }

    if (countHechoEl) {
      countHechoEl.textContent =
        completed;
    }



    const completedRatioEl =
      document.getElementById(
        "completedRatio"
      );

    if (completedRatioEl) {
      completedRatioEl.textContent =
        `${completed}/${total} completadas`;
    }


    const taskCountEl =
      document.getElementById(
        "taskCount"
      );

    if (taskCountEl) {
      taskCountEl.textContent =
        `${total} tarea${total === 1
          ? ""
          : "s"
        }`;
    }


    const pct =
      total === 0
        ? 0
        : Math.round(
          (completed /
            total) *
          100
        );

    const progressPctEl =
      document.getElementById(
        "progressPct"
      );

    if (progressPctEl) {
      progressPctEl.textContent =
        `${pct}%`;
    }



    const ringFill =
      document.getElementById(
        "progressRingFill"
      );

    if (ringFill) {
      ringFill.style.strokeDasharray =
        String(
          RING_CIRCUMFERENCE
        );

      ringFill.style.strokeDashoffset =
        String(
          RING_CIRCUMFERENCE *
          (1 -
            pct / 100)
        );
    }



    const filtered =
      getFilteredTasks();



    const start =
      (state.page - 1) *
      PAGE_SIZE;

    const pageItems =
      filtered.slice(
        start,
        start + PAGE_SIZE
      );



    const emptyState =
      document.getElementById(
        "emptyState"
      );

    if (
      filtered.length === 0
    ) {
      taskListEl.innerHTML =
        "";

      if (emptyState) {
        emptyState.hidden =
          false;
      }
    } else {
      if (emptyState) {
        emptyState.hidden =
          true;
      }

      taskListEl.innerHTML =
        pageItems
          .map(
            renderTaskCard
          )
          .join("");
    }

    renderPagination(
      filtered.length
    );
  }



  function createTaskHtml(id, name, description, dueDate, status) {
    return renderTaskCard({
      id: id,
      title: name,
      name: name,
      desc: description,
      description: description,
      date: dueDate,
      dueDate: dueDate,
      status: status,
    });
  }

  window.createTaskHtml = createTaskHtml;
  window.renderTasksUI = render;
  window.taskManager.render = render;



  taskManager.render();

})();