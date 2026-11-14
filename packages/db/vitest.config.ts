import { defineConfig } from "vitest/config";

// The database tests share one Postgres and the migrations test resets it, so run files one at a time.
export default defineConfig({ test: { fileParallelism: false } });
