export function showConsoleError (...msg) {
  console.log("\x1b[31m", ...msg);
}