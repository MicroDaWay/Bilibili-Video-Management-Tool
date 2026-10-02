import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, data) => {
    ipcRenderer.send(channel, data)
  },
  invoke: (channel, data) => {
    return ipcRenderer.invoke(channel, data)
  },
  on: (channel, data) => {
    ipcRenderer.on(channel, data)
  },
  removeListener: (channel, data) => {
    ipcRenderer.removeListener(channel, data)
  }
})
