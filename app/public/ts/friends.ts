class FriendsManager {
  sendFriendRequest(userID: string) {
    console.log("Sending friend request to:", userID);
  }

  acceptFriendRequest(userID: string) {
    console.log("Accepting friend request from:", userID);
  }

  declineFriendRequest(userID: string) {
    console.log("Declining friend request from:", userID);
  }

  removeFriend(userID: string) {
    console.log("Removing friend:", userID);
  }

  sendFriendRequestWithAnimation(element: HTMLElement) {
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
}

declare global {
  interface Window {
    FriendsManager: typeof FriendsManager;
    friendsManager: FriendsManager;
  }
}

window.friendsManager = new FriendsManager();

export default FriendsManager;
