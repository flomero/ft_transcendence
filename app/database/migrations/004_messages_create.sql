CREATE TABLE IF NOT EXISTS messages (
	sender TEXT NOT NULL,
	receiver TEXT NOT NULL,
	message TEXT NOT NULL,
	timestamp TIMESTAMP NOT NULL,
	Primary Key (sender, receiver, timestamp),
	FOREIGN KEY (sender) REFERENCES users(id),
	FOREIGN KEY (receiver) REFERENCES users(id)
);