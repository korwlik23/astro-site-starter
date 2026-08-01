/* global AbortController, fetch */

import process from "node:process";
import { clearTimeout, setTimeout } from "node:timers";

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 2500);

try {
  const response = await fetch("http://127.0.0.1:4321/", {
    redirect: "manual",
    signal: controller.signal,
  });
  process.exit(response.status >= 200 && response.status < 400 ? 0 : 1);
} catch {
  process.exit(1);
} finally {
  clearTimeout(timeout);
}
