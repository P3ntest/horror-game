import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";
import { defineConfig } from "vite";
import childProcess from "child_process";

const commitHash = childProcess
  .execSync("git log -1 --pretty=%B | cat")
  .toString();

console.log("commit hash", commitHash);

export default defineConfig({
  plugins: [wasm(), topLevelAwait()],
  define: {
    COMMIT_NAME: JSON.stringify(commitHash),
  },
});
