import FlipClockPlugin, { DEFAULT_SETTINGS } from './main';

describe('FlipClockPlugin', () => {
  let plugin: FlipClockPlugin;

  beforeEach(() => {
    plugin = new FlipClockPlugin({} as any, {} as any);
  });

  describe('DEFAULT_SETTINGS', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_SETTINGS).toEqual({
        mode: 'clock',
        use24Hour: true,
        showSeconds: false,
        animationEnabled: true,
        soundEnabled: false,
        tickSoundEnabled: false,
        alarmSoundEnabled: true,
        volume: 0.5,
        timerPresets: [300, 600, 1500, 3000],
        persistTimerState: false,
        timerDuration: 1500,
        timerRemaining: 1500,
        timerLoop: false,
        blinkingColon: false,
        reduceMotion: false,
        highContrast: false,
        showInStatusBar: false,
        showFloatingClock: false,
        floatingClockPosition: null,
      });
    });
  });

  describe('parseDuration', () => {
    it('should parse hours correctly', () => {
      expect(plugin.parseDuration('2h')).toBe(7200);
      expect(plugin.parseDuration('1h')).toBe(3600);
    });

    it('should parse minutes correctly', () => {
      expect(plugin.parseDuration('25m')).toBe(1500);
      expect(plugin.parseDuration('10m')).toBe(600);
      expect(plugin.parseDuration('1m')).toBe(60);
    });

    it('should parse seconds correctly', () => {
      expect(plugin.parseDuration('30s')).toBe(30);
      expect(plugin.parseDuration('90s')).toBe(90);
    });

    it('should parse combined durations', () => {
      expect(plugin.parseDuration('1h30m')).toBe(5400);
      expect(plugin.parseDuration('2h15m30s')).toBe(8130);
      expect(plugin.parseDuration('45m30s')).toBe(2730);
    });

    it('should handle invalid input gracefully', () => {
      expect(plugin.parseDuration('')).toBe(0);
      expect(plugin.parseDuration('invalid')).toBe(0);
      expect(plugin.parseDuration('abc')).toBe(0);
    });

    it('should handle partial matches', () => {
      expect(plugin.parseDuration('1h invalid 30m')).toBe(5400);
      expect(plugin.parseDuration('text 5m text')).toBe(300);
    });

    it('should handle edge cases', () => {
      expect(plugin.parseDuration('0h')).toBe(0);
      expect(plugin.parseDuration('0m')).toBe(0);
      expect(plugin.parseDuration('0s')).toBe(0);
      expect(plugin.parseDuration('0h0m0s')).toBe(0);
    });

    it('should handle large numbers', () => {
      expect(plugin.parseDuration('100h')).toBe(360000);
      expect(plugin.parseDuration('999m')).toBe(59940);
    });
  });

  describe('parseCodeBlockOptions', () => {
    it('should parse mode option', () => {
      const options = plugin.parseCodeBlockOptions('mode: clock');
      expect(options.mode).toBe('clock');
    });

    it('should parse timer mode', () => {
      const options = plugin.parseCodeBlockOptions('mode: timer');
      expect(options.mode).toBe('timer');
    });

    it('should parse format option', () => {
      const options24 = plugin.parseCodeBlockOptions('format: 24h');
      expect(options24.use24Hour).toBe(true);

      const options12 = plugin.parseCodeBlockOptions('format: 12h');
      expect(options12.use24Hour).toBe(false);
    });

    it('should parse seconds option', () => {
      const optionsTrue = plugin.parseCodeBlockOptions('seconds: true');
      expect(optionsTrue.showSeconds).toBe(true);

      const optionsFalse = plugin.parseCodeBlockOptions('seconds: false');
      expect(optionsFalse.showSeconds).toBe(false);
    });

    it('should parse animation option', () => {
      const optionsTrue = plugin.parseCodeBlockOptions('animation: true');
      expect(optionsTrue.animationEnabled).toBe(true);

      const optionsFalse = plugin.parseCodeBlockOptions('animation: false');
      expect(optionsFalse.animationEnabled).toBe(false);
    });

    it('should parse timer duration', () => {
      const options = plugin.parseCodeBlockOptions('timer: 25m');
      expect(options.timerDuration).toBe(1500);
      expect(options.timerRemaining).toBe(1500);
    });

    it('should handle multiple options', () => {
      const input = `mode: timer
format: 24h
seconds: true
timer: 1h30m`;
      const options = plugin.parseCodeBlockOptions(input);
      expect(options.mode).toBe('timer');
      expect(options.use24Hour).toBe(true);
      expect(options.showSeconds).toBe(true);
      expect(options.timerDuration).toBe(5400);
    });

    it('should ignore comments', () => {
      const input = `# This is a comment
mode: clock
# Another comment
seconds: true`;
      const options = plugin.parseCodeBlockOptions(input);
      expect(options.mode).toBe('clock');
      expect(options.showSeconds).toBe(true);
    });

    it('should ignore empty lines', () => {
      const input = `mode: clock

seconds: true

`;
      const options = plugin.parseCodeBlockOptions(input);
      expect(options.mode).toBe('clock');
      expect(options.showSeconds).toBe(true);
    });

    it('should ignore invalid format', () => {
      const options = plugin.parseCodeBlockOptions('invalid line without colon');
      expect(Object.keys(options).length).toBe(0);
    });

    it('should handle case insensitivity', () => {
      const options = plugin.parseCodeBlockOptions('MODE: clock\nSECONDS: TRUE');
      expect(options.mode).toBe('clock');
      expect(options.showSeconds).toBe(true);
    });
  });

  describe('loadSettings', () => {
    it('should load default settings when no data exists', async () => {
      plugin.loadData = jest.fn().mockResolvedValue(undefined);
      await plugin.loadSettings();
      expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should merge saved settings with defaults', async () => {
      const savedData = { volume: 0.8, showSeconds: true };
      plugin.loadData = jest.fn().mockResolvedValue(savedData);
      await plugin.loadSettings();
      expect(plugin.settings.volume).toBe(0.8);
      expect(plugin.settings.showSeconds).toBe(true);
      expect(plugin.settings.mode).toBe('clock'); // From defaults
    });

    it('should preserve all default settings for missing keys', async () => {
      plugin.loadData = jest.fn().mockResolvedValue({ volume: 0.3 });
      await plugin.loadSettings();
      expect(plugin.settings.animationEnabled).toBe(true);
      expect(plugin.settings.blinkingColon).toBe(false);
      expect(plugin.settings.timerPresets).toEqual([300, 600, 1500, 3000]);
    });
  });

  describe('saveSettings', () => {
    it('should save current settings', async () => {
      const mockSaveData = jest.fn().mockResolvedValue(undefined);
      plugin.saveData = mockSaveData;
      plugin.settings = { ...DEFAULT_SETTINGS, volume: 0.9 };

      await plugin.saveSettings();

      expect(mockSaveData).toHaveBeenCalledWith(plugin.settings);
    });
  });
});

describe('Settings Validation', () => {
  it('should have valid timer presets', () => {
    DEFAULT_SETTINGS.timerPresets.forEach(preset => {
      expect(preset).toBeGreaterThan(0);
      expect(Number.isInteger(preset)).toBe(true);
    });
  });

  it('should have volume in valid range', () => {
    expect(DEFAULT_SETTINGS.volume).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_SETTINGS.volume).toBeLessThanOrEqual(1);
  });

  it('should have valid timer durations', () => {
    expect(DEFAULT_SETTINGS.timerDuration).toBeGreaterThan(0);
    expect(DEFAULT_SETTINGS.timerRemaining).toBeGreaterThan(0);
  });

  it('should have boolean flags as booleans', () => {
    expect(typeof DEFAULT_SETTINGS.animationEnabled).toBe('boolean');
    expect(typeof DEFAULT_SETTINGS.soundEnabled).toBe('boolean');
    expect(typeof DEFAULT_SETTINGS.use24Hour).toBe('boolean');
    expect(typeof DEFAULT_SETTINGS.showSeconds).toBe('boolean');
  });
});

describe('Time Formatting', () => {
  it('should correctly calculate hours from timer remaining', () => {
    const totalSeconds = 7265; // 2h 1m 5s
    const hours = Math.floor(totalSeconds / 3600);
    expect(hours).toBe(2);
  });

  it('should correctly calculate minutes from timer remaining', () => {
    const totalSeconds = 7265; // 2h 1m 5s
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    expect(minutes).toBe(1);
  });

  it('should correctly calculate seconds from timer remaining', () => {
    const totalSeconds = 7265; // 2h 1m 5s
    const seconds = totalSeconds % 60;
    expect(seconds).toBe(5);
  });
});
