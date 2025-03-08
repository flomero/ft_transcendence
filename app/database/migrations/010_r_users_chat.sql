CREATE TABLE IF NOT EXISTS r_users_chat (
    user_id TEXT NOT NULL,
    room_id INTEGER NOT NULL,
    read INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, room_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id)
);