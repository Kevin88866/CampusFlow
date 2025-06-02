# Clone from github

git clone https://github.com/Kevin88866/CampusFlow.git

cd CampusFlow

# Database

psql -U postgres

CREATE DATABASE campusflow_poc;

\c campusflow_poc

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  coins INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  coins INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

# Backend

Node Server.js

# Frontend

npm start --reset-cache

npx react-native run-android
