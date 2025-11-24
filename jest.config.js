module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  collectCoverageFrom: [
    '*.ts',
    '!main.js',
    '!*.config.js',
    '!*.config.mjs',
    '!version-bump.mjs',
    '!coverage/**',
    '!node_modules/**',
    '!**/*.test.ts',
  ],
  moduleFileExtensions: ['ts', 'js'],
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/__mocks__/obsidian.ts',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
};
