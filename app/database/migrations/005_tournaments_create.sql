CREATE TABLE IF NOT EXISTS tournaments
(
    id     TEXT PRIMARY KEY UNIQUE,
    status TEXT NOT NULL,
    mode   TEXT NOT NULL
);