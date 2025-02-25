CREATE TABLE IF NOT EXISTS r_users_matches (
	id TEXT PRIMARY KEY,
	userId TEXT NOT NULL,
	match TEXT NOT NULL,
	score INTEGER,
	FOREIGN KEY (userId) REFERENCES users(id),
	FOREIGN KEY (match) REFERENCES matches(id)
);