class Chat {
  currentRoomId: string | undefined = undefined;
  private socket: WebSocket;

  constructor() {
    const currentUrl = window.location.origin;
    const wsUrl = currentUrl.replace(/^http/, "ws");
    this.socket = new WebSocket(`${wsUrl}/chat/ws`);
    this.initSocketHandlers();
  }

  private initSocketHandlers(): void {
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "message": {
          if (data.id !== this.currentRoomId) {
            return;
          }
          const chatMessages = document.getElementById("chat-messages");
          if (chatMessages) {
            chatMessages.innerHTML += data.html;
            this.scrollToBottom();
          }
          break;
        }
        case "room": {
          const existingRoom = document.querySelector(
            `[data-room-id="${data.id}"]`,
          );

          if (existingRoom) {
            existingRoom.outerHTML = data.html;
          } else {
            const chatRooms = document.getElementById("chat-rooms");
            if (chatRooms) {
              chatRooms.innerHTML += data.html;
            }
          }
          break;
        }
      }
    };
  }

  backToChats = (): void => {
    const chatRoomsView = document.getElementById("chat-rooms-view");
    const chatMessagesView = document.getElementById("chat-messages-view");
    const backButton = document.getElementById("back-to-chats");
    const chatTitle = document.getElementById("chat-title");

    if (!chatRoomsView || !chatMessagesView || !backButton || !chatTitle) {
      return;
    }

    // Show rooms view, hide messages view
    chatRoomsView.classList.remove("hidden");
    chatMessagesView.classList.add("hidden");
    chatMessagesView.classList.remove("flex");

    // Update header
    backButton.classList.add("hidden");
    chatTitle.textContent = "All Chats";

    // Reset current room
    this.currentRoomId = undefined;
  };

  scrollToBottom = (): void => {
    const messagesDiv = document.getElementById("chat-messages");
    if (messagesDiv) {
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  };

  sendMessage = (event: Event): void => {
    event.preventDefault();
    console.log("Sending message");
    if (!(event.target && event.target instanceof HTMLFormElement)) {
      return;
    }

    const form = event.target as HTMLFormElement;
    const message = (form.elements.namedItem("message") as HTMLInputElement)
      .value;

    if (!message.trim() || !this.currentRoomId) return;

    fetch(`/chat/${this.currentRoomId}`, {
      method: "POST",
      body: message,
    })
      .then((response) => response.json())
      .then((data) => {
        form.reset();
        setTimeout(() => this.scrollToBottom(), 100);
      })
      .catch((error) => console.error("Error sending message:", error));
  };

  selectRoom = (event: Event): void => {
    const clickedRoom = event.currentTarget;
    if (!(clickedRoom instanceof Element)) {
      return;
    }

    const roomId = clickedRoom.getAttribute("data-room-id");
    const roomNameElement = clickedRoom.querySelector(".chat-room-name p");
    const roomName = roomNameElement ? roomNameElement.textContent || "" : "";

    if (!roomId) {
      console.error("No room ID found");
      return;
    }

    // Fetch the room content
    fetch(`/chat/${roomId}`)
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.text();
      })
      .then((html) => {
        const chatMessagesContainer = document.getElementById(
          "chat-messages-container",
        );

        if (chatMessagesContainer) {
          chatMessagesContainer.innerHTML = html;

          // Show messages view, hide rooms view
          document.getElementById("chat-rooms-view")?.classList.add("hidden");
          document
            .getElementById("chat-messages-view")
            ?.classList.remove("hidden");
          document.getElementById("chat-messages-view")?.classList.add("flex");

          // Update header
          document.getElementById("back-to-chats")?.classList.remove("hidden");
          const chatTitle = document.getElementById("chat-title");
          if (chatTitle) chatTitle.textContent = roomName;

          // Set current room
          this.currentRoomId = roomId;

          // Scroll to bottom of messages
          this.scrollToBottom();
        }
      })
      .catch((error) => console.error("Error fetching room:", error));
  };
}

export {};

// Create a single chat instance
const chat = new Chat();

// Make the chat object available globally
declare global {
  interface Window {
    chat: Chat;
  }
}

// Assign the chat object to window
window.chat = chat;
