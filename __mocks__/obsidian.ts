interface MockApp {
  workspace: {
    getLeavesOfType: (type: string) => WorkspaceLeaf[];
    getRightLeaf: (split: boolean) => WorkspaceLeaf | null;
    revealLeaf: (leaf: WorkspaceLeaf) => void;
  };
}

interface MockManifest {
  id: string;
  name: string;
  version: string;
}

export class Plugin {
  app: MockApp;
  manifest: MockManifest;

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

interface MockContainerEl {
  children: (HTMLElement | null)[];
  querySelector: jest.MockedFunction<(selector: string) => Element | null>;
  querySelectorAll: jest.MockedFunction<(selector: string) => NodeListOf<Element>>;
}

export class ItemView {
  containerEl: MockContainerEl = {
    children: [null, document.createElement('div')],
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(),
  };
  leaf: WorkspaceLeaf;
  app: MockApp;
}

interface MockSettingContainerEl {
  empty: jest.MockedFunction<() => void>;
  createEl: jest.MockedFunction<(tag: string) => HTMLElement>;
}

interface MockPlugin {
  settings: Record<string, unknown>;
  saveSettings: () => Promise<void>;
}

export class PluginSettingTab {
  app: MockApp;
  plugin: MockPlugin;
  containerEl: MockSettingContainerEl = {
    empty: jest.fn(),
    createEl: jest.fn(() => document.createElement('div')),
  };

  constructor(app: MockApp, plugin: MockPlugin) {
    this.app = app;
    this.plugin = plugin;
  }
}

export class Setting {
  setName = jest.fn().mockReturnThis();
  setDesc = jest.fn().mockReturnThis();
  addToggle = jest.fn().mockReturnThis();
  addSlider = jest.fn().mockReturnThis();
  addText = jest.fn().mockReturnThis();
  addDropdown = jest.fn().mockReturnThis();
}

export interface WorkspaceLeaf {
  view: {
    getViewType: () => string;
  };
  setViewState: (state: { type: string; active: boolean }) => Promise<void>;
}
