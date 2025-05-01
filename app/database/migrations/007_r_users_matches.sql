CREATE TABLE IF NOT EXISTS r_users_matches
(
    userId  TEXT    NOT NULL,
    matchId TEXT    NOT NULL,
    score   INTEGER NOT NULL,
    result TEXT,
    PRIMARY KEY (userId, matchId),
    FOREIGN KEY (userId) REFERENCES users (id),
    FOREIGN KEY (matchId) REFERENCES matches (id)
);
