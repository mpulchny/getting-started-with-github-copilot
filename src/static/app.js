document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Clear existing activity options (except placeholder)
      // This prevents duplicate options if fetchActivities runs more than once
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section (added)
        const participantsTitle = document.createElement("h5");
        participantsTitle.className = "participants-title";
        participantsTitle.textContent = "Participants";

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const nameSpan = document.createElement("span");
            nameSpan.textContent = p; // safe text

            // Create delete button
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-participant";
            deleteBtn.setAttribute("aria-label", `Unregister ${p} from ${name}`);
            deleteBtn.innerHTML = "&times;"; // simple X icon

            // Attach click handler to unregister participant
            deleteBtn.addEventListener("click", async () => {
              if (!confirm(`Unregister ${p} from ${name}?`)) return;

              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants/${encodeURIComponent(p)}`,
                  { method: "DELETE" }
                );

                if (resp.ok) {
                  // Remove this participant from the DOM
                  li.remove();

                  // If list is now empty, show placeholder
                  if (participantsList.querySelectorAll(".participant-item").length === 0) {
                    const none = document.createElement("li");
                    none.className = "no-participants";
                    none.textContent = "No participants yet";
                    participantsList.appendChild(none);
                  }
                } else {
                  const err = await resp.json().catch(() => ({}));
                  alert(err.detail || "Failed to unregister participant");
                }
              } catch (error) {
                console.error("Error unregistering:", error);
                alert("Failed to unregister participant. Please try again.");
              }
            });

            li.appendChild(nameSpan);
            li.appendChild(deleteBtn);
            participantsList.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.className = "no-participants";
          li.textContent = "No participants yet";
          participantsList.appendChild(li);
        }

        activityCard.appendChild(participantsTitle);
        activityCard.appendChild(participantsList);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
