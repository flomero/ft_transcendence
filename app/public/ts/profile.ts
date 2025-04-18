import { showById, hideById, innerTextById, focusById } from "./utils.js";

class ProfileEditor {
  private showError = (message: string) => {
    innerTextById("profile-error-message", message);
    showById("profile-error-message");
  };

  private hideError = () => {
    hideById("profile-error-message");
  };

  private toggleFormVisibility = (formId: string, show: boolean) => {
    const form = document.getElementById(formId);

    // Hide common elements when showing a form
    if (show) {
      hideById("edit-username-button");
      hideById("edit-profile-picture-button");
      showById(formId);

      if (form) {
        form.classList.add("animate-slide-in-up");
        form.classList.remove("animate-slide-out-down");
      }
    } else {
      if (form && form instanceof HTMLFormElement) {
        form.classList.remove("animate-slide-in-up");
        form.classList.add("animate-slide-out-down");
        form.reset();

        setTimeout(() => {
          hideById(formId);
          this.hideError();
          showById("edit-username-button");
          showById("edit-profile-picture-button");
        }, 300);
      }
    }
  };

  showEditUsernameForm = () => {
    this.toggleFormVisibility("edit-username-form", true);
    focusById("edit-username-input");
  };

  hideEditUsernameForm = () => {
    this.toggleFormVisibility("edit-username-form", false);
  };

  showEditProfilePictureForm = () => {
    this.toggleFormVisibility("edit-profile-picture-form", true);
  };

  hideEditProfilePictureForm = () => {
    this.toggleFormVisibility("edit-profile-picture-form", false);
  };

  saveUsername = (event: Event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const username = form.username.value;

    this.hideError();

    fetch("/profile/update/username", {
      method: "POST",
      body: username.toString(),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          this.showError(data.error);
          return;
        }
        innerTextById("current-username", username);
        this.hideEditUsernameForm();
      })
      .catch((error) => {
        this.showError(error.message || "An error occurred");
      });
  };

  saveProfilePicture = (event: Event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    this.hideError();

    fetch("/profile/update/image", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error || data.statusCode >= 400) {
          console.table(data);
          this.showError(
            `Error uploading profile picture: ${data.message || data.error}`,
          );
          return;
        }

        const profilePicture = document.querySelector(
          'img[alt="User Avatar"]',
        ) as HTMLImageElement;
        if (profilePicture) {
          const baseUrl = data.imageUrl || profilePicture.src.split("?")[0];
          profilePicture.src = `${baseUrl}?t=${new Date().getTime()}`;
        }

        this.hideEditProfilePictureForm();
      })
      .catch((error) => {
        this.showError(`Error uploading profile picture: ${error}`);
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
