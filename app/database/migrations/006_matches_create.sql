CREATE TABLE IF NOT EXISTS matches (
	id TEXT PRIMARY KEY,
	game TEXT NOT NULL,
	gameMode TEXT NOT NULL,
	modifiers TEXT,
	result TEXT,
	tournamentId TEXT,
	FOREIGN KEY (tournamentId) REFERENCES turnaments(id)
);