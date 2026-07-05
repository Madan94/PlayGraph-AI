-- NextPlayAI operational schema (intelligence lives in Cognee)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('athlete', 'coach', 'scout', 'admin');
CREATE TYPE session_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE asset_type AS ENUM ('video', 'audio', 'image', 'json', 'note');
CREATE TYPE memory_operation AS ENUM ('remember', 'recall', 'improve', 'forget');
CREATE TYPE otp_purpose AS ENUM ('signup', 'login');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role user_role NOT NULL DEFAULT 'athlete',
    full_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE athletes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    sport VARCHAR(64) NOT NULL DEFAULT 'cricket',
    dob DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE coach_athlete (
    coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    PRIMARY KEY (coach_id, athlete_id)
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL DEFAULT 'training',
    sport VARCHAR(64) NOT NULL DEFAULT 'cricket',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status session_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE session_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    asset_type asset_type NOT NULL,
    minio_key VARCHAR(512) NOT NULL,
    mime_type VARCHAR(128),
    size_bytes BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES session_assets(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'queued',
    kafka_topic VARCHAR(128),
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE memory_operations_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
    operation memory_operation NOT NULL,
    cognee_ref VARCHAR(255),
    payload_hash VARCHAR(64),
    latency_ms INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    pdf_minio_key VARCHAR(512),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE otp_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    purpose otp_purpose NOT NULL,
    role user_role NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    jti VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE coach_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(16) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ,
    max_uses INTEGER NOT NULL DEFAULT 10,
    uses INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add users and athletes via your own migration or admin tooling (no seed data).

CREATE INDEX idx_sessions_athlete ON sessions(athlete_id);
CREATE INDEX idx_memory_ops_athlete ON memory_operations_log(athlete_id);
CREATE INDEX idx_memory_ops_created ON memory_operations_log(created_at DESC);
CREATE INDEX idx_otp_requests_email ON otp_requests(email, purpose, created_at DESC);
CREATE INDEX idx_auth_sessions_jti ON auth_sessions(jti);
CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX idx_coach_invites_code ON coach_invites(code);
CREATE INDEX idx_athletes_user ON athletes(user_id);
