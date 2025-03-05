CREATE TABLE IF NOT EXISTS r_users_matches (
	id TEXT PRIMARY KEY,
	userId TEXT NOT NULL,
	matchId TEXT NOT NULL,
	score INTEGER,
	FOREIGN KEY (userId) REFERENCES users(id),
	FOREIGN KEY (matchId) REFERENCES matches(id)
);