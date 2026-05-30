"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("apple2apple", {
  loadSettings: () => {
    return electron.ipcRenderer.invoke("settings:load");
  },
  saveSettings: (settings) => {
    return electron.ipcRenderer.invoke("settings:save", settings);
  }
});
