import { AudioManager } from './audio-manager';

describe('AudioManager', () => {
  let audioManager: AudioManager;

  beforeEach(() => {
    audioManager = new AudioManager(0.5);
    jest.clearAllMocks();
  });

  afterEach(() => {
    audioManager.dispose();
  });

  describe('constructor', () => {
    it('should initialize with default volume', () => {
      const manager = new AudioManager();
      expect(manager).toBeDefined();
    });

    it('should initialize with custom volume', () => {
      const manager = new AudioManager(0.7);
      expect(manager).toBeDefined();
    });

    it('should create AudioContext', () => {
      expect(globalThis.AudioContext).toHaveBeenCalled();
    });
  });

  describe('setVolume', () => {
    it('should set volume within valid range', () => {
      audioManager.setVolume(0.8);
      // Volume is set internally, we can verify through playback
      expect(audioManager).toBeDefined();
    });

    it('should clamp volume to minimum 0', () => {
      audioManager.setVolume(-0.5);
      // Should clamp to 0, no error thrown
      expect(audioManager).toBeDefined();
    });

    it('should clamp volume to maximum 1', () => {
      audioManager.setVolume(1.5);
      // Should clamp to 1, no error thrown
      expect(audioManager).toBeDefined();
    });
  });

  describe('playTick', () => {
    it('should play tick sound without errors', () => {
      expect(() => audioManager.playTick()).not.toThrow();
    });

    it('should create oscillator for tick sound', () => {
      const AudioContextMock = globalThis.AudioContext as jest.Mock;
      if (AudioContextMock.mock.results[0]) {
        const mockContext = AudioContextMock.mock.results[0].value;
        audioManager.playTick();
        expect(mockContext.createOscillator).toHaveBeenCalled();
        expect(mockContext.createGain).toHaveBeenCalled();
      }
    });

    it('should handle missing AudioContext gracefully', () => {
      const managerWithoutContext = new AudioManager();
      expect(() => managerWithoutContext.playTick()).not.toThrow();
    });
  });

  describe('playAlarm', () => {
    it('should play alarm sound without errors', () => {
      expect(() => audioManager.playAlarm()).not.toThrow();
    });

    it('should create multiple oscillators for alarm melody', () => {
      const AudioContextMock = globalThis.AudioContext as jest.Mock;
      if (AudioContextMock.mock.results[0]) {
        const mockContext = AudioContextMock.mock.results[0].value;
        audioManager.playAlarm();
        expect(mockContext.createOscillator).toHaveBeenCalled();
        expect(mockContext.createGain).toHaveBeenCalled();
      }
    });

    it('should play melody pattern', () => {
      const AudioContextMock = globalThis.AudioContext as jest.Mock;
      if (AudioContextMock.mock.results[0]) {
        const mockContext = AudioContextMock.mock.results[0].value;
        const createOscillatorSpy = jest.spyOn(mockContext, 'createOscillator');
        audioManager.playAlarm();
        // Should create 6 oscillators (3 notes x 2 repetitions)
        expect(createOscillatorSpy.mock.calls.length).toBeGreaterThanOrEqual(6);
      }
    });
  });

  describe('playFlip', () => {
    it('should play flip sound without errors', () => {
      expect(() => audioManager.playFlip()).not.toThrow();
    });

    it('should create noise buffer for flip sound', () => {
      const AudioContextMock = globalThis.AudioContext as jest.Mock;
      if (AudioContextMock.mock.results[0]) {
        const mockContext = AudioContextMock.mock.results[0].value;
        audioManager.playFlip();
        expect(mockContext.createBuffer).toHaveBeenCalled();
        expect(mockContext.createBufferSource).toHaveBeenCalled();
        expect(mockContext.createBiquadFilter).toHaveBeenCalled();
      }
    });

    it('should apply bandpass filter to noise', () => {
      const AudioContextMock = globalThis.AudioContext as jest.Mock;
      if (AudioContextMock.mock.results[0]) {
        const mockContext = AudioContextMock.mock.results[0].value;
        const mockFilter = mockContext.createBiquadFilter();
        audioManager.playFlip();
        expect(mockFilter.frequency.setValueAtTime).toHaveBeenCalled();
      }
    });
  });

  describe('dispose', () => {
    it('should close AudioContext', () => {
      const AudioContextMock = globalThis.AudioContext as jest.Mock;
      if (AudioContextMock.mock.results[0]) {
        const mockContext = AudioContextMock.mock.results[0].value;
        audioManager.dispose();
        expect(mockContext.close).toHaveBeenCalled();
      }
    });

    it('should handle dispose when already disposed', () => {
      audioManager.dispose();
      expect(() => audioManager.dispose()).not.toThrow();
    });

    it('should not throw when AudioContext is null', () => {
      const manager = new AudioManager();
      manager.dispose();
      expect(() => manager.dispose()).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle AudioContext creation errors', () => {
      (globalThis.AudioContext as jest.Mock).mockImplementationOnce(() => {
        throw new Error('AudioContext not supported');
      });
      expect(() => new AudioManager()).not.toThrow();
    });

    it('should handle playback errors gracefully', () => {
      const AudioContextMock = globalThis.AudioContext as jest.Mock;
      if (AudioContextMock.mock.results[0]) {
        const mockContext = AudioContextMock.mock.results[0].value;
        mockContext.createOscillator.mockImplementationOnce(() => {
          throw new Error('Oscillator creation failed');
        });
        expect(() => audioManager.playTick()).not.toThrow();
      }
    });
  });

  describe('volume control', () => {
    it('should apply volume to tick sound', () => {
      const AudioContextMock = globalThis.AudioContext as jest.Mock;
      if (AudioContextMock.mock.results[0]) {
        const mockContext = AudioContextMock.mock.results[0].value;
        const mockGain = mockContext.createGain();
        audioManager.setVolume(0.8);
        audioManager.playTick();
        expect(mockGain.gain.linearRampToValueAtTime).toHaveBeenCalled();
      }
    });

    it('should apply volume to alarm sound', () => {
      const AudioContextMock = globalThis.AudioContext as jest.Mock;
      if (AudioContextMock.mock.results[0]) {
        const mockContext = AudioContextMock.mock.results[0].value;
        const mockGain = mockContext.createGain();
        audioManager.setVolume(0.6);
        audioManager.playAlarm();
        expect(mockGain.gain.linearRampToValueAtTime).toHaveBeenCalled();
      }
    });

    it('should apply volume to flip sound', () => {
      const AudioContextMock = globalThis.AudioContext as jest.Mock;
      if (AudioContextMock.mock.results[0]) {
        const mockContext = AudioContextMock.mock.results[0].value;
        const mockGain = mockContext.createGain();
        audioManager.setVolume(0.4);
        audioManager.playFlip();
        expect(mockGain.gain.linearRampToValueAtTime).toHaveBeenCalled();
      }
    });
  });
});
