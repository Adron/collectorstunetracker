DROP DATABASE collections;

CREATE DATABASE collections
    with owner collections_admin;

CREATE SCHEMA the_musical_world;
CREATE SCHEMA the_system;

-- This adds the UUID user extension which isn't loaded by default in the database'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE the_system."tenants" (
  "tenant_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(120) NOT NULL,
  "organization" VARCHAR(120),
  "website" VARCHAR(120),
  "founding_date" DATE,
  "created" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "updated" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "notes" TEXT,
  "message" TEXT
);

CREATE TABLE the_system."users" (
  "user_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "tenant_id" UUID,
  "username" VARCHAR(120) NOT NULL,
  "password" VARCHAR(120) NOT NULL,
  "created" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "updated" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "notes" TEXT,
  "message" TEXT
);

CREATE TABLE the_system."roles" (
  "role_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "tenant_id" UUID,
  "name" VARCHAR(120) NOT NULL,
  "can_add" BOOLEAN DEFAULT FALSE,
  "can_edit" BOOLEAN DEFAULT FALSE,
  "can_delete" BOOLEAN DEFAULT FALSE,
  "created" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "updated" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "notes" TEXT,
  "message" TEXT
);

CREATE TABLE the_system."user_roles" (
  "user_id" UUID,
  "role_id" UUID,
  PRIMARY KEY ("user_id", "role_id")
);

CREATE TABLE the_musical_world."musicians" (
  "musician_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "tenant_id" UUID,
  "name" VARCHAR(120) NOT NULL,
  "date_of_birth" DATE,
  "biography" TEXT,
  "created" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "updated" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "notes" TEXT,
  "message" TEXT
);

CREATE TABLE the_musical_world."bands" (
  "band_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "tenant_id" UUID,
  "name" VARCHAR(120) NOT NULL,
  "formation_date" DATE,
  "country_of_origin" VARCHAR(120),
  "city_of_origin" VARCHAR(120),
  "active_status" BOOLEAN DEFAULT TRUE,
  "biography" TEXT,
  "website" VARCHAR(120),
  "social_media_links" TEXT,
  "label" VARCHAR(120),
  "discography" TEXT,
  "manager_name" VARCHAR(120),
  "contact_email" VARCHAR(120),
  "created" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "updated" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "notes" TEXT,
  "message" TEXT
);

CREATE TABLE the_musical_world."genres" (
  "genre_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "parent_genre" UUID,
  "genre" VARCHAR(120),
  "created" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "updated" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "notes" TEXT,
  "message" TEXT
);

CREATE TABLE the_musical_world."band_members" (
  "band_member_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "band_id" UUID,
  "musician_id" UUID,
  "start_date" DATE,
  "end_date" DATE,
  "contribution" TEXT,
  "created" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "updated" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "notes" TEXT,
  "message" TEXT
);

CREATE TABLE the_musical_world."albums" (
  "album_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "band_id" UUID,
  "title" VARCHAR(120) NOT NULL,
  "release_date" DATE,
  "created" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "updated" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "notes" TEXT,
  "message" TEXT
);

CREATE TABLE the_musical_world."songs" (
  "song_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "album_id" UUID,
  "title" VARCHAR(120) NOT NULL,
  "duration" INT,
  "created" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "updated" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "notes" TEXT,
  "message" TEXT
);

-- New table for many-to-many relationship between bands and genres
CREATE TABLE the_musical_world."band_genre_association" (
  "band_id" UUID REFERENCES the_musical_world."bands" ("band_id"),
  "genre_id" UUID REFERENCES the_musical_world."genres" ("genre_id"),
  PRIMARY KEY ("band_id", "genre_id")
);

-- New table for many-to-many relationship between songs and band_members (songwriters)
CREATE TABLE the_musical_world."songwriters_association" (
  "song_id" UUID REFERENCES the_musical_world."songs" ("song_id"),
  "band_member_id" UUID REFERENCES the_musical_world."band_members" ("band_member_id"),
  PRIMARY KEY ("song_id", "band_member_id")
);

ALTER TABLE the_system."users" ADD FOREIGN KEY ("tenant_id") REFERENCES the_system."tenants" ("tenant_id");

ALTER TABLE the_system."roles" ADD FOREIGN KEY ("tenant_id") REFERENCES the_system."tenants" ("tenant_id");

ALTER TABLE the_system."user_roles" ADD FOREIGN KEY ("user_id") REFERENCES the_system."users" ("user_id");

ALTER TABLE the_system."user_roles" ADD FOREIGN KEY ("role_id") REFERENCES the_system."roles" ("role_id");

ALTER TABLE the_musical_world."musicians" ADD FOREIGN KEY ("tenant_id") REFERENCES the_system."tenants" ("tenant_id");

ALTER TABLE the_musical_world."bands" ADD FOREIGN KEY ("tenant_id") REFERENCES the_system."tenants" ("tenant_id");

ALTER TABLE the_musical_world."band_members" ADD FOREIGN KEY ("band_id") REFERENCES the_musical_world."bands" ("band_id");

ALTER TABLE the_musical_world."band_members" ADD FOREIGN KEY ("musician_id") REFERENCES the_musical_world."musicians" ("musician_id");

ALTER TABLE the_musical_world."albums" ADD FOREIGN KEY ("band_id") REFERENCES the_musical_world."bands" ("band_id");

ALTER TABLE the_musical_world."songs" ADD FOREIGN KEY ("album_id") REFERENCES the_musical_world."albums" ("album_id");
