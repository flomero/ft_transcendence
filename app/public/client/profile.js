import { showById, hideById, innerTextById, focusById } from "./utils.js";
class ProfileEditor {
  constructor() {
    this.showError = (message) => {
      innerTextById("profile-error-message", message);
      showById("profile-error-message");
    };
    this.hideError = () => {
      hideById("profile-error-message");
    };
    this.toggleFormVisibility = (formId, show) => {
      const form = document.getElementById(formId);
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
    this.showEditUsernameForm = () => {
      this.toggleFormVisibility("edit-username-form", true);
      focusById("edit-username-input");
    };
    this.hideEditUsernameForm = () => {
      this.toggleFormVisibility("edit-username-form", false);
    };
    this.showEditProfilePictureForm = () => {
      this.toggleFormVisibility("edit-profile-picture-form", true);
    };
    this.hideEditProfilePictureForm = () => {
      this.toggleFormVisibility("edit-profile-picture-form", false);
    };
    this.saveUsername = (event) => {
      event.preventDefault();
      const form = event.target;
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
    this.saveProfilePicture = (event) => {
      event.preventDefault();
      const form = event.target;
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
            this.showError(
              `Error uploading profile picture: ${data.message || data.error}`,
            );
            return;
          }
          const profilePicture = document.querySelector(
            'img[alt="User Avatar"]',
          );
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
}
const profileEditor = new ProfileEditor();
window.profileEditor = profileEditor;
//# sourceMappingURL=profile.js.map
