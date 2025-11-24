# Unit Tests

This project includes comprehensive unit tests using Jest and TypeScript.

## Test Coverage

- **54 passing tests** across 2 test suites
- AudioManager: **89.28%** statement coverage, **100%** function coverage
- Main plugin utilities: Fully tested

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

### audio-manager.test.ts
Tests for the AudioManager class that handles all audio functionality:

- **Constructor Tests**
  - Initialization with default and custom volumes
  - AudioContext creation

- **Volume Control**
  - Setting volume within valid range (0-1)
  - Clamping invalid values
  - Volume application to all sound types

- **Sound Playback**
  - Tick sound (short click sound)
  - Alarm sound (melodic pattern with 3 notes × 2 repetitions)
  - Flip sound (mechanical noise with bandpass filter)

- **Error Handling**
  - Graceful handling of missing AudioContext
  - Recovery from playback errors
  - Safe disposal of resources

- **Resource Management**
  - Proper cleanup on dispose
  - Multiple dispose calls handled safely

### main.test.ts
Tests for the main plugin functionality:

- **Settings Management**
  - Default settings validation
  - Loading settings with merging
  - Saving settings
  - Settings type validation

- **Duration Parsing**
  - Hours parsing (e.g., "2h" → 7200 seconds)
  - Minutes parsing (e.g., "25m" → 1500 seconds)
  - Seconds parsing (e.g., "30s" → 30 seconds)
  - Combined formats (e.g., "1h30m" → 5400 seconds)
  - Edge cases and invalid input handling

- **Code Block Options Parsing**
  - Mode selection (clock/timer)
  - Time format (12h/24h)
  - Display options (seconds, animations)
  - Timer duration parsing
  - Multiple options and comments handling

- **Time Calculations**
  - Hours, minutes, seconds extraction from total seconds
  - Correct formatting for display

## Test Configuration

- **Framework**: Jest 30.x
- **Environment**: jsdom (browser-like environment)
- **TypeScript**: ts-jest for TypeScript compilation
- **Mocking**: Obsidian API mocked via `__mocks__/obsidian.ts`
- **Browser APIs**: AudioContext, ResizeObserver mocked via `jest.setup.js`

## Mocks

### Obsidian API Mock
Located in `__mocks__/obsidian.ts`, provides mock implementations for:
- Plugin base class
- ItemView for custom views
- PluginSettingTab for settings UI
- Setting class for settings configuration

### Browser API Mocks
Located in `jest.setup.js`:
- **AudioContext**: Full mock with oscillator, gain, buffer, and filter support
- **ResizeObserver**: Mock for responsive size detection
- **setInterval/clearInterval**: Jest mock implementations

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on others
2. **Cleanup**: `afterEach` hooks ensure proper cleanup between tests
3. **Error Handling**: Tests verify graceful handling of errors
4. **Edge Cases**: Tests cover boundary conditions and invalid inputs
5. **Mocking**: External dependencies properly mocked for reliable tests

## Adding New Tests

When adding new functionality:

1. Create or update the relevant test file
2. Follow the existing describe/it structure
3. Mock external dependencies
4. Test both success and failure paths
5. Run `npm run test:coverage` to check coverage

## Continuous Integration

Tests are designed to run in CI environments:
- No external dependencies required
- Deterministic results (no timing issues)
- All mocks included
- Fast execution (~10-15 seconds)

## Coverage Goals

- **Target**: Maintain >80% coverage for new code
- **Focus**: Critical paths and error handling
- **Skip**: UI rendering (tested manually), Obsidian lifecycle methods
