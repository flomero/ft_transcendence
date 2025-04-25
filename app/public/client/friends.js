class FriendsManager {
  async sendFriendRequest(userID) {
    await fetch(`/friend/request/${userID}`, {
      method: "POST",
    });
  }
  async sendFriendRequestWithAnimation(event) {
    const element = event.target;
    const userID = element.getAttribute("data-id");
    if (!userID) {
      console.error("No user ID found on element");
      return;
    }
    await this.sendFriendRequest(userID);
    const btnElement = element;
    const msgElement = element.nextElementSibling;
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
  async acceptFriendRequest(userID) {
    await fetch(`/friend/accept/${userID}`, {
      method: "POST",
    });
  }
  async acceptFriendRequestButton(event) {
    const element = event.target;
    const userID = element.getAttribute("data-id");
    if (!userID) {
      console.error("No user ID found on element");
      return;
    }
    await this.acceptFriendRequest(userID);
    window.router.refresh();
  }
  async declineFriendRequest(userID) {
    await fetch(`/friend/delete/${userID}`, {
      method: "POST",
    });
  }
  async declineFriendRequestButton(event) {
    const element = event.target;
    const userID = element.getAttribute("data-id");
    if (!userID) {
      console.error("No user ID found on element");
      return;
    }
    await this.declineFriendRequest(userID);
    window.router.refresh();
  }
  async removeFriend(userID) {
    await fetch(`/friend/delete/${userID}`, {
      method: "POST",
    });
  }
  async removeFriendButton(event) {
    const element = event.target;
    const userID = element.getAttribute("data-id");
    if (!userID) {
      console.error("No user ID found on element");
      return;
    }
    await this.removeFriend(userID);
    window.router.refresh();
  }
  async blockUser(userID) {
    await fetch(`/friend/block/${userID}`, {
      method: "POST",
    });
  }
  async blockUserWithAnimation(event) {
    const element = event.target;
    const userID = element.getAttribute("data-id");
    if (!userID) {
      console.error("No user ID found on element");
      return;
    }
    await this.blockUser(userID);
    window.router.refresh();
  }
  async unblockUser(userID) {
    await fetch(`/friend/block/${userID}`, {
      method: "DELETE",
    });
  }
  async unblockUserWithAnimation(event) {
    const element = event.target;
    const userID = element.getAttribute("data-id");
    if (!userID) {
      console.error("No user ID found on element");
      return;
    }
    await this.unblockUser(userID);
    window.router.refresh();
  }
  searchFriends(event) {
    const input = event.target;
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
//# sourceMappingURL=friends.js.map
