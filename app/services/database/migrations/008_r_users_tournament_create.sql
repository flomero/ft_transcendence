CREATE TABLE IF NOT EXISTS r_users_turnament (
	userId TEXT NOT NULL,
	turnament TEXT NOT NULL,
	position INTEGER,
	PRIMARY KEY (userId, turnament),
	FOREIGN KEY (userId) REFERENCES users(id),
	FOREIGN KEY (turnament) REFERENCES turnaments(id)
);