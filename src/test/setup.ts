/**
 * Vitest global setup.
 * Loads .env.local so DB tests pick up DATABASE_URL.
 */
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
