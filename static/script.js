
"use strict";

const $ = (selector) => document.querySelector(selector);

const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);

async function api(url, options = {}) {
  let response;

  try {
    response = await fetch(url, options);
  } catch {
    throw new Error(
      "Cannot connect to the server. Make sure uvicorn is running."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail || `Request failed with status ${response.status}.`
    );
  }

  return data;
}

function setBusy(button, busy, message = "Please wait...") {
  if (!button) return;

  if (busy) {
    if (!button.dataset.originalHtml) {
      button.dataset.originalHtml = button.innerHTML;
    }

    button.disabled = true;
    button.innerHTML = `<span class="spinner"></span> ${escapeHTML(message)}`;
  } else {
    button.disabled = false;

    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
      delete button.dataset.originalHtml;
    }
  }
}

function showMessage(container, message, type = "error") {
  if (!container) return;

  container.innerHTML = `
    <div class="app-message ${type}" role="status">
      ${escapeHTML(message)}
    </div>
  `;
}

function setTheme(theme) {
  const dark = theme === "dark";

  document.documentElement.dataset.theme = dark ? "dark" : "light";

  const icon = $("#theme-icon");
  const label = $("#theme-label");
  const toggle = $("#theme-toggle");

  if (icon) icon.textContent = dark ? "☀" : "☾";
  if (label) label.textContent = dark ? "Light mode" : "Dark mode";

  if (toggle) {
    toggle.setAttribute(
      "aria-label",
      dark ? "Switch to light mode" : "Switch to dark mode"
    );
  }

  try {
    localStorage.setItem("knowledge-ai-theme", theme);
  } catch {
    // Theme still works for the current page.
  }
}

function initializeTheme() {
  let savedTheme = "light";

  try {
    savedTheme = localStorage.getItem("knowledge-ai-theme") || "light";
  } catch {
    // Use the light theme if storage is unavailable.
  }

  setTheme(savedTheme === "dark" ? "dark" : "light");

  $("#theme-toggle")?.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme;
    setTheme(current === "dark" ? "light" : "dark");
  });
}

async function refreshStats() {
  try {
    const data = await api("/api/stats");

    $("#doc-count").textContent = data.documents;
    $("#chunk-count").textContent = data.chunks;
  } catch (error) {
    $("#doc-count").textContent = "!";
    $("#chunk-count").textContent = "!";
    console.error("Stats error:", error.message);
  }
}

async function refreshDocuments() {
  const container = $("#document-list");
  container.textContent = "Loading documents...";

  try {
    const data = await api("/api/documents");

    if (!data.documents.length) {
      container.innerHTML =
        '<p class="muted">No documents indexed yet.</p>';
      return;
    }

    container.innerHTML = data.documents.map((doc) => `
      <div class="document-row">
        <div>
          <strong>${escapeHTML(doc.filename)}</strong>
          <p>${doc.chunks} indexed chunks</p>
        </div>
        <button type="button" class="delete-btn"
          data-delete="${escapeHTML(doc.filename)}">Remove</button>
      </div>
    `).join("");
  } catch (error) {
    showMessage(container, error.message);
  }
}

function initializeNavigation() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", async () => {
      const view = button.dataset.view;

      document.querySelectorAll(".nav-item").forEach((item) => {
        item.classList.toggle("active", item === button);
      });

      ["assistant", "documents", "evaluation"].forEach((name) => {
        $(`#${name}-view`)?.classList.toggle("hidden", name !== view);
      });

      const titles = {
        assistant: "AI Knowledge Assistant",
        documents: "Your Document Library",
        evaluation: "Prompt Engineering Lab"
      };

      $("#page-title").textContent = titles[view] || titles.assistant;

      if (view === "documents") {
        await refreshDocuments();
      }
    });
  });
}

function initializeUpload() {
  const fileInput = $("#file-input");
  const button = $("#upload-btn");
  const status = $("#upload-status");

  if (!fileInput || !button || !status) {
    console.error("Upload controls are missing from index.html.");
    return;
  }

  button.addEventListener("click", async () => {
    const file = fileInput.files?.[0];

    if (!file) {
      status.textContent = "Please select a document first.";
      fileInput.focus();
      return;
    }

    const allowed = [".pdf", ".txt", ".md", ".markdown"];
    const extension = "." + file.name.split(".").pop().toLowerCase();

    if (!allowed.includes(extension)) {
      status.textContent = "Please choose a PDF, TXT, or Markdown file.";
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      status.textContent = "File size must be 15 MB or less.";
      return;
    }

    setBusy(button, true, "Uploading and indexing...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await api("/api/upload", {
        method: "POST",
        body: formData
      });

      status.textContent =
        `${result.filename}: ${result.chunks_indexed} chunks indexed successfully.`;

      fileInput.value = "";

      await refreshStats();
      await refreshDocuments();
    } catch (error) {
      status.textContent = `Upload failed: ${error.message}`;
    } finally {
      setBusy(button, false);
    }
  });
}

function initializeQuestions() {
  const button = $("#ask-btn");
  const questionInput = $("#question-input");
  const answer = $("#answer-content");
  const sources = $("#sources");

  if (!button || !questionInput || !answer || !sources) {
    console.error("Question-answer controls are missing from index.html.");
    return;
  }

  async function askQuestion() {
    const question = questionInput.value.trim();

    if (!question) {
      showMessage(answer, "Please enter a question first.");
      questionInput.focus();
      return;
    }

    setBusy(button, true, "Searching documents...");
    $("#answer-badge").textContent = "Generating answer...";
    sources.replaceChildren();

    try {
      const result = await api("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          technique: $("#technique-select").value
        })
      });

      answer.innerHTML = `
        <div class="answer-text">${escapeHTML(result.answer)}</div>
      `;

      $("#answer-badge").textContent =
        `${result.sources.length} evidence passages`;

      sources.innerHTML = result.sources.map((item, index) => `
        <article class="source-card">
          <div class="source-top">
            <span>Source ${index + 1}</span>
            <span class="source-score">
              Similarity ${(item.similarity * 100).toFixed(1)}%
            </span>
          </div>
          <p><strong>${escapeHTML(item.source)}</strong></p>
          <p>Chunk ${item.chunk} · Distance ${item.distance}</p>
          <p>${escapeHTML(item.text)}</p>
        </article>
      `).join("");
    } catch (error) {
      showMessage(answer, error.message);
      $("#answer-badge").textContent = "Request failed";
    } finally {
      setBusy(button, false);
    }
  }

  button.addEventListener("click", askQuestion);

  questionInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      askQuestion();
    }
  });
}

function initializeDocuments() {
  $("#document-list")?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-delete]");
    if (!button) return;

    const filename = button.dataset.delete;

    if (!confirm(`Remove indexed chunks for ${filename}?`)) return;

    button.disabled = true;

    try {
      await api(`/api/documents/${encodeURIComponent(filename)}`, {
        method: "DELETE"
      });

      await refreshDocuments();
      await refreshStats();
    } catch (error) {
      alert(error.message);
      button.disabled = false;
    }
  });
}

function initializeEvaluation() {
  const button = $("#evaluate-btn");
  const container = $("#evaluation-results");

  if (!button || !container) return;

  button.addEventListener("click", async () => {
    setBusy(button, true, "Running evaluations...");
    container.textContent =
      "Testing all five questions with three prompting techniques...";

    try {
      const data = await api("/api/evaluate");

      const groups = {};

      data.results.forEach((item) => {
        if (!groups[item.question]) groups[item.question] = [];
        groups[item.question].push(item);
      });

      container.innerHTML = Object.entries(groups).map(
        ([question, results]) => `
          <article class="eval-card">
            <h3>${escapeHTML(question)}</h3>
            ${results.map((item) => `
              <div class="eval-answer">
                <strong>${escapeHTML(
                  item.technique.replaceAll("_", " ").toUpperCase()
                )}</strong>
                <p>${escapeHTML(item.answer)}</p>
                <p class="muted">
                  Retrieved evidence: ${item.sources.length} passages
                </p>
              </div>
            `).join("")}
          </article>
        `
      ).join("");

      if (!data.results.length) {
        container.textContent = "No evaluation results were returned.";
      }
    } catch (error) {
      showMessage(container, error.message);
    } finally {
      setBusy(button, false);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initializeTheme();
  initializeNavigation();
  initializeUpload();
  initializeQuestions();
  initializeDocuments();
  initializeEvaluation();

  refreshStats();
});
