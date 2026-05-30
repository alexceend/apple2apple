import { app } from "electron";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type AppSettings = {
  serverUrl: string;
  serverToken: string;
};

const defaultSettings: AppSettings = {
  serverUrl: "",
  serverToken: ""
};

function getSettingsPath() {
  return join(app.getPath("userData"), "settings.json");
}

export function loadSettings(): AppSettings {
  const settingsPath = getSettingsPath();

  if (!existsSync(settingsPath)) {
    return defaultSettings;
  }

  try {
    const raw = readFileSync(settingsPath, "utf-8");
    const parsed = JSON.parse(raw);

    return {
      serverUrl: typeof parsed.serverUrl === "string" ? parsed.serverUrl : "",
      serverToken: typeof parsed.serverToken === "string" ? parsed.serverToken : ""
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings) {
  const settingsPath = getSettingsPath();

  mkdirSync(dirname(settingsPath), {
    recursive: true
  });

  writeFileSync(
    settingsPath,
    JSON.stringify(settings, null, 2),
    "utf-8"
  );

  return settings;
}