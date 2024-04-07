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