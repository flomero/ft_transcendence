CREATE TABLE IF NOT EXISTS matches
(
    id             TEXT PRIMARY KEY,
    gameName       TEXT     NOT NULL,
    gameModeName   TEXT     NOT NULL,
    modifierNames  JSON     NOT NULL,
    playerCount    INTEGER  NOT NULL,
    gameModeConfig JSON,
    powerUpNames   JSON,
    result         TEXT,
    tournamentId   TEXT,
    matchDate      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournamentId) REFERENCES tournaments (id)
);
