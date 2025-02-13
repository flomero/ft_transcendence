CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	username TEXT NOT NULL,
	password TEXT,
	totptoken TEXT,
	oauthtoken TEXT
);