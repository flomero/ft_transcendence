CREATE TABLE IF NOT EXISTS users_friends (
    senderId TEXT NOT NULL,
    receiverId TEXT NOT NULL,
    accepted INTEGER DEFAULT 0,
    PRIMARY KEY (senderId, receiverId),
    FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE
);