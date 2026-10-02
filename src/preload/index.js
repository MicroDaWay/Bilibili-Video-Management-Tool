import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, data) => {
    ipcRenderer.send(channel, data)
  },
  invoke: (channel, data) => {
    return ipcRenderer.invoke(channel, data)
  },
  on: (channel, listener) => {
    const subscription = (event, data) => listener(event, data)
    ipcRenderer.on(channel, subscription)
    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
  removeListener: (channel, listener) => {
    ipcRenderer.removeListener(channel, listener)
  }
})
