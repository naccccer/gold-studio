import { existsSync } from "node:fs";
import { Config } from "@remotion/cli/config";

const localBrowserCandidates = [
  process.env.REMOTION_BROWSER_EXECUTABLE,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter((path): path is string => Boolean(path));

const localBrowser = localBrowserCandidates.find((path) => existsSync(path));

if (localBrowser) {
  Config.setBrowserExecutable(localBrowser);
}

Config.setEntryPoint("src/remotion/index.tsx");
