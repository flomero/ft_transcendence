import { showById, hideById } from "./utils.js";

class ProfileEditor {
  showEditUsernameForm = () => {
    showById("edit-username-form");
    hideById("edit-username-button");
    hideById("current-username");
  };

  hideEditUsernameForm = () => {
    hideById("edit-username-form");
    showById("edit-username-button");
    showById("current-username");
  };

  saveUsername = (event: Event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const username = form.username.value;

    hideById("error-message");

    fetch("/profile/update/username", {
      method: "POST",
      body: username.toString(),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          const errorMessage = document.getElementById("error-message");
          if (!errorMessage) return;
          errorMessage.innerText = data.error;
          showById("error-message");
          return;
        }
        const currentUsername = document.getElementById("current-username");
        if (!currentUsername) return;
        currentUsername.innerText = username;
        this.hideEditUsernameForm();
      })
      .catch((error) => {
        console.error("Error sending message:", error);
      });
  };
}

const profileEditor = new ProfileEditor();

declare global {
  interface Window {
    profileEditor: ProfileEditor;
  }
}

window.profileEditor = profileEditor;
