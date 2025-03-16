import type Router from "./router.js";

declare global {
  interface Window {
    FriendsManager: typeof FriendsManager;
    friendsManager: FriendsManager;
    router: Router;
  }
}

class FriendsManager {
  sendFriendRequest(userID: string) {
    console.log("Sending friend request to:", userID);
  }

  sendFriendRequestWithAnimation(event: Event) {
    const element = event.target as HTMLElement;
    const userID = element.getAttribute("data-id");

    if (!userID) {
      console.error("No user ID found on element");
      return;
    }
    this.sendFriendRequest(userID);
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

  acceptFriendRequest(userID: string) {
    fetch(`/friend/accept/${userID}`, {
      method: "POST",
    });
  }

  acceptFriendRequestButton(event: Event) {
    const element = event.target as HTMLElement;
    const userID = element.getAttribute("data-id");

    if (!userID) {
      console.error("No user ID found on element");
      return;
    }
    this.acceptFriendRequest(userID);
    window.router.refresh(); // TODO: maybe solve this more efficient
  }

  declineFriendRequest(userID: string) {
    console.log("Declining friend request from:", userID);
  }

  declineFriendRequestButton(event: Event) {
    const element = event.target as HTMLElement;
    const userID = element.getAttribute("data-id");

    if (!userID) {
      console.error("No user ID found on element");
      return;
    }
    this.declineFriendRequest(userID);
    window.router.refresh(); // TODO: maybe solve this more efficient
  }

  removeFriend(userID: string) {
    fetch(`/friend/delete/${userID}`, {
      method: "POST",
    });
  }

  removeFriendButton(event: Event) {
    const element = event.target as HTMLElement;
    const userID = element.getAttribute("data-id");

    if (!userID) {
      console.error("No user ID found on element");
      return;
    }
    this.removeFriend(userID);
    window.router.refresh(); // TODO: maybe solve this more efficient
  }
  blockUser(userID: string) {
    console.log("Blocking user:", userID);
  }

  unblockUser(userID: string) {
    console.log("Unblocking user:", userID);
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
