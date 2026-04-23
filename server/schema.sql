-- Run as your postgres superuser:
--   psql -U postgres -f schema.sql
-- Or if your user already exists:
--   psql -U your_user -f schema.sql

CREATE DATABASE wafflewalks;

\c wafflewalks

CREATE TABLE walks (
  id         SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  who        VARCHAR(100) NOT NULL,
  when_time  VARCHAR(50)  NOT NULL,
  pipi       BOOLEAN      NOT NULL DEFAULT FALSE,
  kaki       BOOLEAN      NOT NULL DEFAULT FALSE,
  nothing    BOOLEAN      NOT NULL DEFAULT FALSE,
  duration   VARCHAR(100)
);

CREATE TABLE app_config (
  key   VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL
);
