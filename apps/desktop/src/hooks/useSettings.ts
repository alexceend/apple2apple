import { useCallback, useEffect, useState } from "react";

export type SettingsStatus = "loading" | "loaded" | "error";

type UseSettingsOptions = {
  addMessage: (message: unknown) => void;
};

export function useSettings({ addMessage }: UseSettingsOptions) {
  const [serverUrl, setServerUrl] = useState("");
  const [serverToken, setServerToken] = useState("");
  const [settingsStatus, setSettingsStatus] =
    useState<SettingsStatus>("loading");

  useEffect(() => {
    async function loadSettings() {
      try {
        addMessage("Cargando settings...");

        const settings = await window.apple2apple.loadSettings();

        setServerUrl(settings.serverUrl);
        setServerToken(settings.serverToken);
        setSettingsStatus("loaded");

        addMessage({
          type: "settings.loaded",
          serverUrl: settings.serverUrl || null,
          hasToken: Boolean(settings.serverToken)
        });
      } catch (error) {
        setSettingsStatus("error");

        addMessage({
          type: "settings.error",
          error: String(error)
        });
      }
    }

    loadSettings();
  }, [addMessage]);

  const saveConfig = useCallback(async () => {
    try {
      const saved = await window.apple2apple.saveSettings({
        serverUrl,
        serverToken
      });

      setServerUrl(saved.serverUrl);
      setServerToken(saved.serverToken);

      addMessage({
        type: "settings.saved",
        serverUrl: saved.serverUrl,
        hasToken: Boolean(saved.serverToken)
      });
    } catch (error) {
      addMessage({
        type: "settings.save_error",
        error: String(error)
      });
    }
  }, [serverUrl, serverToken, addMessage]);

  return {
    serverUrl,
    setServerUrl,
    serverToken,
    setServerToken,
    settingsStatus,
    saveConfig
  };
}