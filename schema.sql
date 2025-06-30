-- 1. Users
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)    UNIQUE NOT NULL,
  password_hash TEXT,                             -- null after Google-only signup
  phone         VARCHAR(20),                       -- optional phone number
  google_id     TEXT,                              -- for Google OAuth accounts
  coins         INTEGER       NOT NULL DEFAULT 0,  -- your “coins” balance
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 2. Messages
CREATE TABLE messages (
  id           SERIAL PRIMARY KEY,
  sender_id    INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id  INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT          NOT NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 3. Surveys
CREATE TABLE surveys (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude     NUMERIC(9,6)  NOT NULL,
  longitude    NUMERIC(9,6)  NOT NULL,
  level        SMALLINT      NOT NULL,             -- e.g. 0=sparse,33=moderate,66=crowded,100=very crowded
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 4. User Habits
CREATE TABLE user_habits (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_name   TEXT          NOT NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 5. Pomodoro Logs
CREATE TABLE pomodoro_logs (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);