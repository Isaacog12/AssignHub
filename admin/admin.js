// LOGIN
if (window.location.pathname.includes("login.html")) {
  document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;
    if (user === "admin" && pass === "1234") {
      localStorage.setItem("loggedIn", "true");
      window.location.href = "dashboard.html";
    } else {
      document.getElementById("loginError").textContent = "Invalid credentials!";
    }
  });
}

// DASHBOARD CRUD + SEARCH
if (window.location.pathname.includes("dashboard.html")) {
  if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "login.html";
  }

  const uploadForm = document.getElementById("uploadForm");
  const uploadMsg = document.getElementById("uploadMsg");
  const assignmentList = document.getElementById("assignmentList");
  const searchInput = document.getElementById("searchInput");

  let assignments = [];

  uploadForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(uploadForm);
    try {
      const res = await fetch("/upload", { method: "POST", body: formData });
      const result = await res.json();
      uploadMsg.textContent = result.message;
      uploadForm.reset();
      await fetchAssignments();
    } catch (err) {
      uploadMsg.textContent = "Upload failed!";
    }
  });

  async function fetchAssignments() {
    assignmentList.innerHTML = "<p>Loading...</p>";
    try {
      const res = await fetch("/assignments");
      assignments = await res.json();
      displayAssignments(assignments);
    } catch {
      assignmentList.innerHTML = "<p>Error loading assignments.</p>";
    }
  }

  function displayAssignments(data) {
    assignmentList.innerHTML = "";
    if (!data.length) {
      assignmentList.innerHTML = "<p>No assignments found.</p>";
      return;
    }

    data.forEach(a => {
      const card = document.createElement("div");
      card.className = "assignment-card";
      card.innerHTML = `
        <h4>${a.title}</h4>
        <p><strong>Subject:</strong> ${a.subject}</p>
        <p>${a.description}</p>
        <a href="${a.file}" target="_blank">View</a>
        <div class="crud-buttons">
          <button onclick="editAssignment(${a.id})">Edit</button>
          <button onclick="deleteAssignment(${a.id})">Delete</button>
        </div>
        <div id="edit-${a.id}" class="edit-form" style="display:none;">
          <input type="text" id="title-${a.id}" value="${a.title}" />
          <input type="text" id="subject-${a.id}" value="${a.subject}" />
          <textarea id="desc-${a.id}">${a.description}</textarea>
          <button onclick="submitEdit(${a.id})">Save</button>
          <button onclick="cancelEdit(${a.id})">Cancel</button>
        </div>
      `;
      assignmentList.appendChild(card);
    });
  }

  window.deleteAssignment = async function (id) {
    if (!confirm("Delete this assignment?")) return;
    const res = await fetch(`/assignments/${id}`, { method: "DELETE" });
    const data = await res.json();
    alert(data.message);
    await fetchAssignments();
  };

  window.editAssignment = function (id) {
    document.getElementById(`edit-${id}`).style.display = "block";
  };

  window.cancelEdit = function (id) {
    document.getElementById(`edit-${id}`).style.display = "none";
  };

  window.submitEdit = async function (id) {
    const title = document.getElementById(`title-${id}`).value;
    const subject = document.getElementById(`subject-${id}`).value;
    const desc = document.getElementById(`desc-${id}`).value;

    const res = await fetch(`/assignments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, subject, description: desc }),
    });
    const data = await res.json();
    alert(data.message);
    await fetchAssignments();
  };

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("loggedIn");
    window.location.href = "login.html";
  });

  // ✅ Real-time Search
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase();
      const filtered = assignments.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.subject.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query)
      );
      displayAssignments(filtered);
    });
  }

  fetchAssignments();
}
