// Setup global mocks for browser APIs
globalThis.AudioContext = jest.fn().mockImplementation(() => ({
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: {
      setValueAtTime: jest.fn(),
    },
    type: 'sine',
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: {
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    },
  })),
  createBuffer: jest.fn(() => ({
    getChannelData: jest.fn(() => new Float32Array(100)),
  })),
  createBufferSource: jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    buffer: null,
  })),
  createBiquadFilter: jest.fn(() => ({
    connect: jest.fn(),
    type: 'bandpass',
    frequency: {
      setValueAtTime: jest.fn(),
    },
    Q: {
      setValueAtTime: jest.fn(),
    },
  })),
  destination: {},
  currentTime: 0,
  sampleRate: 44100,
  close: jest.fn(),
}));

// Mock ResizeObserver
globalThis.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock setInterval and clearInterval
globalThis.setInterval = jest.fn((callback, delay) => {
  return 123; // Return a mock timer ID
});

globalThis.clearInterval = jest.fn();
