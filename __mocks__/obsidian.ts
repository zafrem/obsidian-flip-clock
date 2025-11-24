export class Plugin {
  app: any;
  manifest: any;

  loadData = jest.fn().mockResolvedValue({});
  saveData = jest.fn().mockResolvedValue(undefined);
  addRibbonIcon = jest.fn();
  addCommand = jest.fn();
  addSettingTab = jest.fn();
  registerView = jest.fn();
  registerMarkdownCodeBlockProcessor = jest.fn();
  addStatusBarItem = jest.fn(() => ({
    addClass: jest.fn(),
    setText: jest.fn(),
    remove: jest.fn(),
    createDiv: jest.fn(() => document.createElement('div')),
    createEl: jest.fn(() => document.createElement('div')),
  }));
}

export class ItemView {
  containerEl: any = {
    children: [null, document.createElement('div')],
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(),
  };
  leaf: any;
  app: any;
}

export class PluginSettingTab {
  app: any;
  plugin: any;
  containerEl: any = {
    empty: jest.fn(),
    createEl: jest.fn(() => document.createElement('div')),
  };

  constructor(app: any, plugin: any) {
    this.app = app;
    this.plugin = plugin;
  }
}

export class Setting {
  constructor(containerEl: any) {}
  setName = jest.fn().mockReturnThis();
  setDesc = jest.fn().mockReturnThis();
  addToggle = jest.fn().mockReturnThis();
  addSlider = jest.fn().mockReturnThis();
  addText = jest.fn().mockReturnThis();
  addDropdown = jest.fn().mockReturnThis();
}

export interface WorkspaceLeaf {
  view: any;
}
