CREATE TABLE IF NOT EXISTS matches (
	id TEXT PRIMARY KEY,
	game TEXT NOT NULL,
	gameMode TEXT NOT NULL,
	modifires TEXT,
	result TEXT NOT NULL,
	turnamentId TEXT NOT NULL,
	FOREIGN KEY (turnamentId) REFERENCES turnaments(id)
);