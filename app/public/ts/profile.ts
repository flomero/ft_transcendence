import { showById, hideById } from "./utils.js";

class ProfileEditor {
  showEditUsernameForm = () => {
    hideById("edit-username-button");
    hideById("edit-profile-picture-button");
    showById("edit-username-form");
    const form = document.getElementById("edit-username-form");
    if (form) {
      form.classList.add("slide-in-up");
      form.classList.remove("slide-out-down");
    }
  };

  hideEditUsernameForm = () => {
    const form = document.getElementById("edit-username-form");
    if (form && form instanceof HTMLFormElement) {
      form.classList.remove("slide-in-up");
      form.classList.add("slide-out-down");
      form.reset();
      setTimeout(() => {
        hideById("edit-username-form");
        hideById("error-message");
        showById("edit-username-button");
        showById("edit-profile-picture-button");
      }, 300);
    }
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

  showEditProfilePictureForm = () => {
    hideById("edit-username-button");
    hideById("edit-profile-picture-button");

    showById("edit-profile-picture-form");
    const form = document.getElementById("edit-profile-picture-form");
    if (form) {
      form.classList.add("slide-in-up");
      form.classList.remove("slide-out-down");
    }
  };

  hideEditProfilePictureForm = () => {
    const form = document.getElementById("edit-profile-picture-form");
    if (form && form instanceof HTMLFormElement) {
      form.classList.remove("slide-in-up");
      form.classList.add("slide-out-down");
      form.reset();
      setTimeout(() => {
        hideById("edit-profile-picture-form");
        hideById("error-message");
        showById("edit-username-button");
        showById("edit-profile-picture-button");
      }, 300);
    }
  };
}

const profileEditor = new ProfileEditor();

declare global {
  interface Window {
    profileEditor: ProfileEditor;
  }
}

window.profileEditor = profileEditor;
