import type Router from "./router.js";

declare global {
  interface Window {
    FriendsManager: typeof FriendsManager;
    friendsManager: FriendsManager;
    router: Router;
  }
}

class FriendsManager {
  async sendFriendRequest(userID: string) {
    await fetch(`/friend/request/${userID}`, {
      method: "POST",
    });
  }

  async sendFriendRequestWithAnimation(event: Event) {
    const element = event.target as HTMLElement;
    const userID = element.getAttribute("data-id");

    if (!userID) {
      console.error("No user ID found on element");
      return;
    }
    await this.sendFriendRequest(userID);
    const btnElement = element;
    const msgElement = element.nextElementSibling as HTMLElement;
    if (!msgElement || !msgElement.classList.contains("request-sent")) {
      console.error("Could not find message element");
      return;
    }
    btnElement.classList.add("fade-transition", "fade-out");
    setTimeout(() => {
      btnElement.classList.add("hidden");
      msgElement.classList.remove("hidden");

      setTimeout(() => {
        msgElement.classList.remove("opacity-0");
      }, 50);
    }, 300);
  }

  async acceptFriendRequest(userID: string) {
    await fetch(`/friend/accept/${userID}`, {
      method: "POST",
    });
  }

  async acceptFriendRequestButton(event: Event) {
    const element = event.target as HTMLElement;
    const userID = element.getAttribute("data-id");

    if (!userID) {
      console.error("No user ID found on element");
      return;
    }
    await this.acceptFriendRequest(userID);
    window.router.refresh(); // TODO: maybe solve this more efficient
  }

  async declineFriendRequest(userID: string) {
    await fetch(`/friend/delete/${userID}`, {
      method: "POST",
    });
  }

  async declineFriendRequestButton(event: Event) {
    const element = event.target as HTMLElement;
    const userID = element.getAttribute("data-id");

    if (!userID) {
      console.error("No user ID found on element");
      return;
    }
    await this.declineFriendRequest(userID);
    window.router.refresh(); // TODO: maybe solve this more efficient
  }

  async removeFriend(userID: string) {
    await fetch(`/friend/delete/${userID}`, {
      method: "POST",
    });
  }

  async removeFriendButton(event: Event) {
    const element = event.target as HTMLElement;
    const userID = element.getAttribute("data-id");

    if (!userID) {
      console.error("No user ID found on element");
      return;
    }
    await this.removeFriend(userID);
    window.router.refresh(); // TODO: maybe solve this more efficient
  }

  async blockUser(userID: string) {
    await fetch(`/friend/block/${userID}`, {
      method: "POST",
    });
  }

  async blockUserWithAnimation(event: Event) {
    const element = event.target as HTMLElement;
    const userID = element.getAttribute("data-id");

    if (!userID) {
      console.error("No user ID found on element");
      return;
    }
    await this.blockUser(userID);
    window.router.refresh();
  }

  async unblockUser(userID: string) {
    await fetch(`/friend/block/${userID}`, {
      method: "DELETE",
    });
  }

  async unblockUserWithAnimation(event: Event) {
    const element = event.target as HTMLElement;
    const userID = element.getAttribute("data-id");

    if (!userID) {
      console.error("No user ID found on element");
      return;
    }
    await this.unblockUser(userID);
    window.router.refresh();
  }

  searchFriends(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value.length < 3) {
      return;
    }

    fetch(`/friends/search/${value}`)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error("Error fetching search results");
      })
      .then((html) => {
        const container = document.getElementById("friends-search-results");
        if (!container) {
          console.error("Search results container not found");
          return;
        }
        container.innerHTML = html;
      });
  }
}

window.friendsManager = new FriendsManager();

export default FriendsManager;
