document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Fetch and display activities
  async function loadActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      const activitiesList = document.getElementById("activities-list");
      const activitySelect = document.getElementById("activity");

      // Clear loading message and activity options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        // Create activity card
        const card = document.createElement("div");
        card.className = "activity-card";

        card.innerHTML = `
          <h4>${name}</h4>
          <p><strong>Description:</strong> ${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Available Spots:</strong> ${details.max_participants - details.participants.length} of ${details.max_participants}</p>
          <div class="participants">
            <p><strong>Current Participants:</strong></p>
            <ul class="participants-list" data-activity="${name}">
              ${details.participants.map(email => `
                <li>
                  ${email}
                  <span class="delete-participant" data-email="${email}" title="Unregister participant">✖</span>
                </li>
              `).join('')}
            </ul>
          </div>
        `;

        activitiesList.appendChild(card);

        // Add to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error loading activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;
    const messageDiv = document.getElementById("message");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email }),
        }
      );

      const result = await response.json();

      messageDiv.textContent = response.ok ? "Successfully signed up!" : result.detail;
      messageDiv.className = response.ok ? "message success" : "message error";
      messageDiv.classList.remove("hidden");

      if (response.ok) {
        // Reset form
        e.target.reset();
        // Wait a moment for the server to update before reloading activities
        await new Promise(resolve => setTimeout(resolve, 100));
        // Reload activities to show updated participants
        await loadActivities();
      }
    } catch (error) {
      messageDiv.textContent = "An error occurred. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle unregister participant
  document.addEventListener('click', async (e) => {
    if (e.target.matches('.delete-participant')) {
      const email = e.target.dataset.email;
      const activityName = e.target.closest('.participants-list').dataset.activity;
      
      if (confirm(`Are you sure you want to unregister ${email} from ${activityName}?`)) {
        try {
          const response = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
          });

          const result = await response.json();
          
          if (response.ok) {
            messageDiv.textContent = "Successfully unregistered participant!";
            messageDiv.className = "message success";
            // Reload activities to show updated participants
            loadActivities();
          } else {
            messageDiv.textContent = result.detail;
            messageDiv.className = "message error";
          }
          messageDiv.classList.remove("hidden");
        } catch (error) {
          messageDiv.textContent = "An error occurred. Please try again.";
          messageDiv.className = "message error";
          messageDiv.classList.remove("hidden");
          console.error("Error unregistering participant:", error);
        }
      }
    }
  });

  // Load activities when page loads
  loadActivities();
});
