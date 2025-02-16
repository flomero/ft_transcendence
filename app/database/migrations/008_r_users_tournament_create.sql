CREATE TABLE IF NOT EXISTS r_users_tournament (
	userId TEXT NOT NULL,
	tournament TEXT NOT NULL,
	position INTEGER,
	PRIMARY KEY (userId, tournament),
	FOREIGN KEY (userId) REFERENCES users(id),
	FOREIGN KEY (tournament) REFERENCES turnaments(id)
);