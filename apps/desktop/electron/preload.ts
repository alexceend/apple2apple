import { contextBridge, ipcRenderer } from 'electron'

type AppSettings = {
  serverUrl: string
  serverToken: string
}

contextBridge.exposeInMainWorld('apple2apple', {
  loadSettings: (): Promise<AppSettings> => {
    return ipcRenderer.invoke('settings:load')
  },

  saveSettings: (settings: AppSettings): Promise<AppSettings> => {
    return ipcRenderer.invoke('settings:save', settings)
  }
})