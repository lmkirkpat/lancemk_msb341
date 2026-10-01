// Where the mentor keeps its state (session, learner record, call log), and where the forked
// bridge keeps its token. AE_MENTOR_HOME overrides the state folder for tests and evals.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIG_FILE } from "../bridge/paths.mjs";

export const MENTOR_ROOT = path.dirname(fileURLToPath(import.meta.url));
export const JSX_DIR = path.join(MENTOR_ROOT, "jsx");

export const MENTOR_HOME =
  process.env.AE_MENTOR_HOME || path.join(os.homedir(), "Library", "Application Support", "AEMentor");
fs.mkdirSync(MENTOR_HOME, { recursive: true });

export const SESSION_FILE = path.join(MENTOR_HOME, "session.json");
export const LEARNER_FILE = path.join(MENTOR_HOME, "learner.json");
export const CALLS_LOG = path.join(MENTOR_HOME, "calls.jsonl");

// One source of truth with the bridge's own scripts (bridge/paths.mjs).
export const BRIDGE_CONFIG = CONFIG_FILE;
