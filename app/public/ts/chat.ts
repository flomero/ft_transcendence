import { changeClasses } from "./utils.js";

type Message = {
  type: string;
  id: string;
  html: string;
};

class Chat {
  currentRoomId: string | undefined = undefined;
  private socket: WebSocket;

  constructor() {
    // Initialize WebSocket connection
    const wsUrl = window.location.origin.replace(/^http/, "ws");
    this.socket = new WebSocket(`${wsUrl}/chat/ws`);
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "message") {
          this.handleNewMessage(data);
        } else if (data.type === "room") {
          this.handleRoomUpdate(data);
        }
      } catch (error) {
        console.error("Error processing socket message:", error);
      }
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  private handleNewMessage(data: Message): void {
    if (data.id !== this.currentRoomId) return;

    const chatMessages = document.getElementById("chat-messages");
    if (chatMessages) {
      chatMessages.innerHTML += data.html;
    }
  }

  private handleRoomUpdate(data: Message): void {
    const existingRoom = document.querySelector(`[data-room-id="${data.id}"]`);
    const chatRooms = document.getElementById("chat-rooms");

    if (!chatRooms) return;

    if (existingRoom) {
      existingRoom.outerHTML = data.html;
    } else {
      chatRooms.innerHTML += data.html;
    }
  }

  backToChats = (): void => {
    // Get UI elements
    const elements = {
      roomsView: document.getElementById("chat-rooms-view"),
      messagesView: document.getElementById("chat-messages-view"),
      backButton: document.getElementById("back-to-chats"),
      title: document.getElementById("chat-title"),
      input: document.getElementById("chat-input"),
    };

    if (
      !elements.roomsView ||
      !elements.messagesView ||
      !elements.backButton ||
      !elements.title
    ) {
      return;
    }

    // Add animation classes
    elements.messagesView.classList.add("slide-out-right");
    elements.input?.classList.add("slide-out-down");

    // Wait for animation to complete
    setTimeout(() => {
      // Update UI visibility
      elements.roomsView?.classList.remove("hidden");
      elements.roomsView?.classList.add("slide-in-left");
      elements.messagesView?.classList.add("hidden");
      elements.messagesView?.classList.remove("flex", "slide-out-right");
      elements.input?.classList.add("hidden");
      elements.input?.classList.remove("flex", "slide-out-down");
      elements.backButton?.classList.add("hidden");
      if (elements.title) elements.title.textContent = "All Chats";

      // Reset animation class after another short delay
      setTimeout(() => {
        elements.roomsView?.classList.remove("slide-in-left");
      }, 300);

      // Reset current room
      this.currentRoomId = undefined;
    }, 300);

    // Clear current room assignment on server
    fetch("/chat/-1", {}).then((r) => {
      if (!r.ok) {
        console.error("Error clearing current room:", r.status);
      }
    });
  };

  sendMessage = (event: Event): void => {
    event.preventDefault();

    // Validate form and input
    if (!(event.target instanceof HTMLFormElement) || !this.currentRoomId) {
      return;
    }

    const form = event.target;
    const inputElement = form.elements.namedItem("message") as HTMLInputElement;
    const message = inputElement?.value?.trim();

    if (!message) return;

    // Send message to server
    fetch(`/chat/${this.currentRoomId}`, {
      method: "POST",
      body: message,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        return response.json();
      })
      .then(() => {
        form.reset();
      })
      .catch((error) => console.error("Error sending message:", error));
  };

  selectRoom = (event: Event): void => {
    const clickedRoom = event.currentTarget as Element;
    if (!clickedRoom) return;

    const roomId = clickedRoom.getAttribute("data-room-id");
    const roomName =
      clickedRoom.querySelector(".chat-room-name p")?.textContent || "";

    if (!roomId) {
      console.error("No room ID found");
      return;
    }

    // Load room content
    this.loadRoomContent(roomId, roomName);
  };

  private loadRoomContent(roomId: string, roomName: string): void {
    fetch(`/chat/${roomId}`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        return response.text();
      })
      .then((html) => {
        const elements = {
          container: document.getElementById("chat-messages-container"),
          roomsView: document.getElementById("chat-rooms-view"),
          messagesView: document.getElementById("chat-messages-view"),
          input: document.getElementById("chat-input"),
          backButton: document.getElementById("back-to-chats"),
          title: document.getElementById("chat-title"),
        };

        if (!elements.container) return;

        // Update content
        elements.container.innerHTML = html;

        // Add exit animation to rooms view
        elements.roomsView?.classList.add("slide-out-left");

        // Wait for exit animation to complete
        setTimeout(() => {
          changeClasses(elements.roomsView, ["slide-out-left"], ["hidden"]);

          // Show messages view with animation
          changeClasses(
            elements.messagesView,
            ["hidden"],
            ["flex", "slide-in-right"],
          );

          // Show form with animation
          changeClasses(elements.input, ["hidden"], ["flex", "slide-in-up"]);

          elements.backButton?.classList.remove("hidden");

          // Update title and current room
          if (elements.title) elements.title.textContent = roomName;
          this.currentRoomId = roomId;

          // Remove animation classes after they complete
          setTimeout(() => {
            elements.messagesView?.classList.remove("slide-in-right");
            elements.input?.classList.remove("slide-in-up");
          }, 300);
        }, 300);
      })
      .catch((error) => console.error("Error fetching room:", error));
  }
}

// Create and export chat instance
const chat = new Chat();

// Make the chat object available globally
declare global {
  interface Window {
    chat: Chat;
  }
}

window.chat = chat;
