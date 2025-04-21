CREATE TABLE IF NOT EXISTS users
(
    id       TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    image_id TEXT,
    FOREIGN KEY (image_id) REFERENCES images (id)
);