CREATE TABLE IF NOT EXISTS users_blocked
(
    blocker TEXT NOT NULL,
    blocked TEXT NOT NULL,
    PRIMARY KEY (blocker, blocked),
    FOREIGN KEY (blocker) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (blocked) REFERENCES users (id) ON DELETE CASCADE
);