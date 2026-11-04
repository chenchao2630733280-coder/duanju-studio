'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('duanju', {
  info: () => ipcRenderer.invoke('app:info'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (s) => ipcRenderer.invoke('settings:save', s),

  listProjects: () => ipcRenderer.invoke('project:list'),
  createProject: (payload) => ipcRenderer.invoke('project:create', payload),
  loadProject: (id) => ipcRenderer.invoke('project:load', id),
  saveProject: (project) => ipcRenderer.invoke('project:save', project),
  deleteProject: (id) => ipcRenderer.invoke('project:delete', id),
  exportProject: (payload) => ipcRenderer.invoke('project:export', payload),
  openProjectFolder: (id) => ipcRenderer.invoke('project:folder', id),
  openWorkspace: () => ipcRenderer.invoke('workspace:open'),
  listProjectFiles: (id) => ipcRenderer.invoke('project:files', id),
  readProjectFile: (id, rel) => ipcRenderer.invoke('project:readFile', { id, rel }),

  pickAssets: (type) => ipcRenderer.invoke('asset:pick', { type }),
  importAssets: (payload) => ipcRenderer.invoke('asset:import', payload),
  deleteAsset: (payload) => ipcRenderer.invoke('asset:delete', payload),
  revealAsset: (payload) => ipcRenderer.invoke('asset:reveal', payload),

  testProvider: (provider) => ipcRenderer.invoke('ai:test', provider),
  chat: (payload) => ipcRenderer.invoke('ai:chat', payload),
  generateImage: (payload) => ipcRenderer.invoke('ai:image', payload),
  generateSpeech: (payload) => ipcRenderer.invoke('ai:tts', payload),

  windowMinimize: () => ipcRenderer.invoke('window:minimize'),
  windowMaximize: () => ipcRenderer.invoke('window:maximize'),
  windowClose: () => ipcRenderer.invoke('window:close'),
  onFlush: (cb) => ipcRenderer.on('app:flush', () => cb()),
  forceClose: () => ipcRenderer.invoke('window:force-close')
});
