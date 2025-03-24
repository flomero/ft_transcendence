CREATE TABLE IF NOT EXISTS matches (
	id TEXT PRIMARY KEY,
	gameName TEXT NOT NULL,
	gameModeName TEXT NOT NULL,
	gameModeConfig JSON NOT NULL,
	modifierNames JSON,
	result TEXT,
	tournamentId TEXT,
	FOREIGN KEY (tournamentId) REFERENCES turnaments(id)
);
