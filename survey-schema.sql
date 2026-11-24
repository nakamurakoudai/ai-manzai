CREATE TABLE IF NOT EXISTS survey_counts (question TEXT NOT NULL, answer TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(question, answer));
