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

// DASHBOARD CRUD
if (window.location.pathname.includes("dashboard.html")) {
  if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "login.html";
  }

  const uploadForm = document.getElementById("uploadForm");
  const uploadMsg = document.getElementById("uploadMsg");
  const assignmentList = document.getElementById("assignmentList");

  uploadForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(uploadForm);
    try {
      const res = await fetch("/upload", { method: "POST", body: formData });
      const result = await res.json();
      uploadMsg.textContent = result.message;
      uploadForm.reset();
      fetchAssignments();
    } catch (err) {
      uploadMsg.textContent = "Upload failed!";
    }
  });

  async function fetchAssignments() {
    assignmentList.innerHTML = "<p>Loading...</p>";
    try {
      const res = await fetch("/assignments");
      const assignments = await res.json();
      assignmentList.innerHTML = "";
      if (assignments.length === 0) return assignmentList.innerHTML = "<p>No assignments uploaded yet.</p>";

      assignments.reverse().forEach(a => {
        const fname = a.file.split("/").pop();
        assignmentList.innerHTML += `
          <div class="assignment-card">
            <h4>${a.title}</h4>
            <p><strong>Subject:</strong> ${a.subject}</p>
            <p>${a.description}</p>
            <a href="${a.file}" target="_blank">View</a>
            <div class="crud-buttons">
              <button onclick="editAssignment('${fname}')">Edit</button>
              <button onclick="deleteAssignment('${fname}')">Delete</button>
            </div>
            <div id="edit-${fname}" class="edit-form" style="display:none;">
              <input type="text" id="title-${fname}" value="${a.title}" />
              <input type="text" id="subject-${fname}" value="${a.subject}" />
              <textarea id="desc-${fname}">${a.description}</textarea>
              <button onclick="submitEdit('${fname}')">Save</button>
              <button onclick="cancelEdit('${fname}')">Cancel</button>
            </div>
          </div>
        `;
      });
    } catch {
      assignmentList.innerHTML = "<p>Error loading assignments.</p>";
    }
  }

  window.deleteAssignment = async function (filename) {
    if (!confirm("Delete this assignment?")) return;
    const res = await fetch(`/assignments/${filename}`, { method: "DELETE" });
    const data = await res.json();
    alert(data.message);
    fetchAssignments();
  };

  window.editAssignment = function (f) {
    document.getElementById(`edit-${f}`).style.display = "block";
  };

  window.cancelEdit = function (f) {
    document.getElementById(`edit-${f}`).style.display = "none";
  };

  window.submitEdit = async function (f) {
    const title = document.getElementById(`title-${f}`).value;
    const subject = document.getElementById(`subject-${f}`).value;
    const desc = document.getElementById(`desc-${f}`).value;

    const res = await fetch(`/assignments/${f}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, subject, description: desc }),
    });
    const data = await res.json();
    alert(data.message);
    fetchAssignments();
  };

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("loggedIn");
    window.location.href = "login.html";
  });

  fetchAssignments();
}
