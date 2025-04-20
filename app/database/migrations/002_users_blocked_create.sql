CREATE TABLE IF NOT EXISTS users_blocked
(
    blocker TEXT NOT NULL,
    blocked TEXT NOT NULL,
    Primary Key (blocker, blocked),
    FOREIGN KEY (blocker) REFERENCES users (id),
    FOREIGN KEY (blocked) REFERENCES users (id)
);