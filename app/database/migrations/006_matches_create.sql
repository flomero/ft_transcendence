CREATE TABLE IF NOT EXISTS matches (
	id TEXT PRIMARY KEY,
	game TEXT NOT NULL,
	gameMode TEXT NOT NULL,
	gameModifiers JSON,
	customizableSettings JSON NOT NULL,
	result TEXT NOT NULL,
	tournamentId TEXT NOT NULL,
	FOREIGN KEY (tournamentId) REFERENCES turnaments(id)
);
