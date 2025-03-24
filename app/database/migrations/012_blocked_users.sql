CREATE TABLE IF NOT EXISTS blocked_users (
    userId TEXT NOT NULL,
    blockedUserId TEXT NOT NULL,
    PRIMARY KEY (userId, blockedUserId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blockedUserId) REFERENCES users(id) ON DELETE CASCADE
);