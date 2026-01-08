#!/usr/bin/env tsx
import { spawn } from "child_process";

// Simple script that just starts Next.js
// Used when migrations are handled separately
const nextProcess = spawn("next", ["start"], {
  stdio: "inherit",
  shell: true,
});

nextProcess.on("exit", (code: number) => {
  process.exit(code || 0);
});
