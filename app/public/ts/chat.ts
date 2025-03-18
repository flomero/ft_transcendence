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

    changeClasses(elements.messagesView, [], ["animate-slide-out-right"]);
    changeClasses(elements.input, [], ["animate-slide-out-down"]);

    setTimeout(() => {
      changeClasses(elements.roomsView, ["hidden"], ["animate-slide-in-left"]);
      changeClasses(
        elements.messagesView,
        ["flex", "animate-slide-out-right"],
        ["hidden"],
      );
      changeClasses(
        elements.input,
        ["flex", "animate-slide-out-down"],
        ["hidden"],
      );
      changeClasses(elements.backButton, ["has-[svg]:flex"], ["hidden"]);

      if (elements.title) elements.title.textContent = "All Chats";

      setTimeout(() => {
        changeClasses(elements.roomsView, ["animate-slide-in-left"], []);
      }, 300);

      this.currentRoomId = undefined;
    }, 300);

    fetch("/chat/-1", {}).then((r) => {
      if (!r.ok) {
        console.error("Error clearing current room:", r.status);
      }
    });
  };

  sendMessage = (event: Event): void => {
    event.preventDefault();

    if (!(event.target instanceof HTMLFormElement) || !this.currentRoomId) {
      return;
    }

    const form = event.target;
    const inputElement = form.elements.namedItem("message") as HTMLInputElement;
    const message = inputElement?.value?.trim();

    if (!message) return;

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

        elements.container.innerHTML = html;
        elements.roomsView?.classList.add("animate-slide-out-left");

        setTimeout(() => {
          changeClasses(
            elements.roomsView,
            ["animate-slide-out-left"],
            ["hidden"],
          );

          changeClasses(
            elements.messagesView,
            ["hidden"],
            ["flex", "animate-slide-in-right"],
          );

          // Show form with animation
          changeClasses(
            elements.input,
            ["hidden"],
            ["flex", "animate-slide-in-up"],
          );

          changeClasses(
            elements.backButton,
            ["hidden", "has-[svg]:hidden"],
            ["has-[svg]:flex"],
          );

          if (elements.title) elements.title.textContent = roomName;
          this.currentRoomId = roomId;

          setTimeout(() => {
            elements.messagesView?.classList.remove("animate-slide-in-right");
            elements.input?.classList.remove("animate-slide-in-up");
          }, 300);
        }, 300);
      })
      .catch((error) => console.error("Error fetching room:", error));
  }
}

const chat = new Chat();

declare global {
  interface Window {
    chat: Chat;
  }
}

window.chat = chat;
