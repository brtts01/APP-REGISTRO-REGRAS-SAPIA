const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Arquivo de configuracao local — guarda qual pasta de rede foi escolhida
const configPath = path.join(app.getPath('userData'), 'config.json');

function getConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {}
  return {};
}

function saveConfig(data) {
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
}

function getHistoricoPath(pastaRede) {
  return path.join(pastaRede, 'historico_regras.json');
}

function lerHistorico(pastaRede) {
  try {
    const filePath = getHistoricoPath(pastaRede);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {}
  return [];
}

function salvarHistorico(pastaRede, historico) {
  const filePath = getHistoricoPath(pastaRede);
  fs.writeFileSync(filePath, JSON.stringify(historico, null, 2), 'utf8');
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'Registro de Regras SAPIA',
    backgroundColor: '#f0f5f2',
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── IPC HANDLERS ───

// Retorna o nome de usuario do sistema operacional
ipcMain.handle('get-username', () => {
  return process.env.USERNAME || process.env.USER || process.env.LOGNAME || 'Usuario';
});

ipcMain.handle('get-config', () => getConfig());

// Abre dialogo para o usuario escolher a pasta de rede
ipcMain.handle('escolher-pasta', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Selecione a pasta compartilhada da rede',
    properties: ['openDirectory']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const pasta = result.filePaths[0];
    const config = getConfig();
    config.pastaRede = pasta;
    saveConfig(config);
    return { ok: true, pasta };
  }
  return { ok: false };
});

// Retorna historico da pasta de rede
ipcMain.handle('ler-historico', () => {
  const config = getConfig();
  if (!config.pastaRede) return { ok: false, erro: 'sem-pasta' };
  try {
    const historico = lerHistorico(config.pastaRede);
    return { ok: true, historico, pasta: config.pastaRede };
  } catch (e) {
    return { ok: false, erro: e.message };
  }
});

// Salva novo registro no historico compartilhado
ipcMain.handle('salvar-registro', (_, registro) => {
  const config = getConfig();
  if (!config.pastaRede) return { ok: false, erro: 'sem-pasta' };
  try {
    const historico = lerHistorico(config.pastaRede);
    historico.unshift(registro); 
    salvarHistorico(config.pastaRede, historico);
    return { ok: true, total: historico.length };
  } catch (e) {
    return { ok: false, erro: e.message };
  }
});

// Deleta um registro pelo id
ipcMain.handle('deletar-registro', (_, id) => {
  const config = getConfig();
  if (!config.pastaRede) return { ok: false };
  try {
    let historico = lerHistorico(config.pastaRede);
    historico = historico.filter(r => r.id !== id);
    salvarHistorico(config.pastaRede, historico);
    return { ok: true };
  } catch (e) {
    return { ok: false, erro: e.message };
  }
});
