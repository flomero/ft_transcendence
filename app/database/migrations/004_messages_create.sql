CREATE TABLE IF NOT EXISTS messages
(
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id   INTEGER   NOT NULL,
    sender_id TEXT      NOT NULL,
    message   TEXT      NOT NULL,
    type      TEXT      NOT NULL DEFAULT 'TEXT',
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES chat_rooms (id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
);
