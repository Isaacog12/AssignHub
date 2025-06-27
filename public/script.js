const listContainer = document.getElementById('assignmentsList');
const searchInput = document.getElementById('searchInput');

if (listContainer && searchInput) {
  // Fetch assignments from the backend
  fetch("/assignments")
    .then(response => {
      if (!response.ok) throw new Error("Failed to load assignments.");
      return response.json();
    })
    .then(assignments => {
      displayAssignments(assignments);

      // Add search filtering
      searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        const filtered = assignments.filter(assignment =>
          assignment.title.toLowerCase().includes(query) ||
          assignment.subject.toLowerCase().includes(query) ||
          assignment.description.toLowerCase().includes(query)
        );
        displayAssignments(filtered);
      });
    })
    .catch(error => {
      listContainer.innerHTML = `<p style="color:red;">Error loading assignments. Please try again later.</p>`;
      console.error(error);
    });

  function displayAssignments(data) {
    listContainer.innerHTML = '';

    if (!data.length) {
      listContainer.innerHTML = "<p>No assignments found.</p>";
      return;
    }

    data.forEach(assignment => {
      const card = document.createElement("div");
      card.className = "assignment-card";
      card.innerHTML = `
        <h3>${assignment.title}</h3>
        <p><strong>Subject:</strong> ${assignment.subject}</p>
        <p>${assignment.description}</p>
        <a href="${assignment.file}" download>Download</a>
      `;
      listContainer.appendChild(card);
    });
  }
}
