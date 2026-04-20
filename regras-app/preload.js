const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getUsername:     ()           => ipcRenderer.invoke('get-username'),
  getConfig:       ()           => ipcRenderer.invoke('get-config'),
  escolherPasta:   ()           => ipcRenderer.invoke('escolher-pasta'),
  lerHistorico:    ()           => ipcRenderer.invoke('ler-historico'),
  salvarRegistro:  (registro)   => ipcRenderer.invoke('salvar-registro', registro),
  deletarRegistro: (id)         => ipcRenderer.invoke('deletar-registro', id),
});
