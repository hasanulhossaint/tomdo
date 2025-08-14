// ===================
// Storage Layer
// ===================
const STORAGE_KEY = "tomdo_tasks";
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ===================
// Render Functions
// ===================
const columns = {
  todo: document.getElementById("todoList"),
  doing: document.getElementById("doingList"),
  done: document.getElementById("doneList"),
};

function renderTasks(filterText = "") {
  Object.values(columns).forEach((col) => (col.innerHTML = ""));
  const search = filterText.toLowerCase().trim();

  tasks.forEach((task) => {
    // Search filter
    if (
      search &&
      !task.title.toLowerCase().includes(search) &&
      !task.description.toLowerCase().includes(search) &&
      !(task.tags || []).some((t) => t.toLowerCase().includes(search))
    ) {
      return;
    }

    const li = document.createElement("li");
    li.className = "task";
    li.draggable = true;
    li.dataset.id = task.id;

    const header = document.createElement("div");
    header.className = "task-header";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.status === "done";
    checkbox.addEventListener("change", () => {
      task.status = checkbox.checked ? "done" : "todo";
      task.updatedAt = Date.now();
      saveTasks();
      renderTasks(search);
    });

    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.title;

    header.appendChild(checkbox);
    header.appendChild(title);

    const desc = document.createElement("div");
    desc.className = "task-desc";
    desc.textContent = task.description || "";

    const tagsWrap = document.createElement("div");
    tagsWrap.className = "task-tags";
    (task.tags || []).forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "tag";
      chip.textContent = tag;
      tagsWrap.appendChild(chip);
    });

    li.appendChild(header);
    if (task.description) li.appendChild(desc);
    if (task.tags && task.tags.length) li.appendChild(tagsWrap);

    li.addEventListener("dblclick", () => openEditModal(task.id));

    columns[task.status].appendChild(li);
  });

  enableDragAndDrop();
}

// ===================
// Add Task
// ===================
function addTask(title, description, tags, status) {
  tasks.push({
    id: Date.now().toString(),
    title,
    description,
    tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    status,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  saveTasks();
  renderTasks(document.getElementById("searchInput").value);
}

// Handle column add forms
document.querySelectorAll(".add-task-form").forEach((form) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = form.title.value.trim();
    if (!title) return;
    addTask(title, form.description.value.trim(), form.tags.value.trim(), form.dataset.status);
    form.reset();
  });
});

// ===================
// Edit Task
// ===================
const editModal = document.getElementById("editModal");
const editTitle = document.getElementById("editTitle");
const editDescription = document.getElementById("editDescription");
const editTags = document.getElementById("editTags");
let editingId = null;

function openEditModal(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  editingId = id;
  editTitle.value = task.title;
  editDescription.value = task.description;
  editTags.value = (task.tags || []).join(", ");
  editModal.showModal();
}

document.getElementById("saveBtn").addEventListener("click", () => {
  const task = tasks.find((t) => t.id === editingId);
  if (!task) return;
  task.title = editTitle.value.trim();
  task.description = editDescription.value.trim();
  task.tags = editTags.value.split(",").map((t) => t.trim()).filter(Boolean);
  task.updatedAt = Date.now();
  saveTasks();
  editModal.close();
  renderTasks(document.getElementById("searchInput").value);
});

document.getElementById("deleteBtn").addEventListener("click", () => {
  tasks = tasks.filter((t) => t.id !== editingId);
  saveTasks();
  editModal.close();
  renderTasks(document.getElementById("searchInput").value);
});

document.getElementById("cancelBtn").addEventListener("click", () => editModal.close());

// ===================
// Search
// ===================
document.getElementById("searchInput").addEventListener("input", (e) => {
  renderTasks(e.target.value);
});

// ===================
// Drag-and-Drop
// ===================
function enableDragAndDrop() {
  document.querySelectorAll(".task").forEach((taskEl) => {
    taskEl.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", taskEl.dataset.id);
      setTimeout(() => (taskEl.style.display = "none"), 0);
    });
    taskEl.addEventListener("dragend", (e) => {
      taskEl.style.display = "";
    });
  });

  document.querySelectorAll(".task-list").forEach((list) => {
    list.addEventListener("dragover", (e) => e.preventDefault());
    list.addEventListener("drop", (e) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain");
      const task = tasks.find((t) => t.id === id);
      if (task) {
        const status = list.id.replace("List", "");
        task.status = status;
        task.updatedAt = Date.now();
        saveTasks();
        renderTasks(document.getElementById("searchInput").value);
      }
    });
  });
}

// ===================
// Theme Toggle
// ===================
const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
  themeToggle.textContent = document.body.classList.contains("light-theme") ? "☀️" : "🌙";
});

// ===================
// Import / Export
// ===================
document.getElementById("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tomdo-tasks-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("importBtn").addEventListener("click", () => {
  document.getElementById("importFile").click();
});

document.getElementById("importFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (Array.isArray(data)) {
        tasks = data;
        saveTasks();
        renderTasks();
      } else {
        alert("Invalid file format.");
      }
    } catch (err) {
      alert("Error parsing file.");
    }
  };
  reader.readAsText(file);
});

// ===================
// Init
// ===================
renderTasks();
