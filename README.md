# Obsidian Flip Clock

A Mac-inspired flip clock plugin for Obsidian with timer functionality. Features beautiful retro flip animations, customizable countdown timers, and optional sound effects.

## Features

### Clock Mode
- Real-time clock display with flip animations
- Support for 12-hour and 24-hour formats
- Optional seconds display
- Smooth flip transitions at 60fps
- Optional blinking colon

### Timer Mode
- Configurable countdown timer
- Start, pause, resume, and reset controls
- Quick preset buttons (5m, 10m, 25m, 50m)
- Visual and audio alerts on completion
- Optional auto-loop functionality
- Persistent timer state (optional)

### Customization
- Toggle animations on/off
- Reduce motion option for accessibility
- High contrast mode
- Optional tick sounds
- Customizable alarm sounds
- Volume control
- Theme-aware (automatically adapts to light/dark mode)

### Display Controls
- **Zoom Controls**: 50% - 300% with buttons
- **Mouse Wheel Zoom**: Ctrl/Cmd + Wheel to zoom
- **Trackpad Pinch**: Pinch to zoom support

### Unobtrusive Display Options
- **Status Bar Display**: Show time in the bottom status bar (minimal and unobtrusive)
- **Floating Clock Overlay**: Minimal clock overlay with three position options (top, middle, bottom)

### Embedding
- Dockable panel view
- Markdown code block support for embedding in notes

## Installation

### From Obsidian Community Plugins
1. Open Settings → Community Plugins
2. Browse and search for "Flip Clock"
3. Click Install, then Enable

### Manual Installation
1. Download the latest release from GitHub
2. Extract the files to your vault's `.obsidian/plugins/obsidian-flip-clock/` folder
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

## Usage

### Opening the Flip Clock

**Method 1: Ribbon Icon**
- Click the clock icon in the left ribbon

**Method 2: Command Palette**
- Open command palette (Cmd/Ctrl + P)
- Search for "Open Flip Clock"
- Press Enter

### Display Controls

The flip clock includes powerful display controls for customization:

**Zoom Controls:**
- **+ / − buttons**: Increase or decrease size by 10%
- **Reset button**: Return to 100% zoom
- **Ctrl/Cmd + Mouse Wheel**: Fine-tune zoom level
- **Trackpad Pinch**: Natural pinch-to-zoom gesture
- **Range**: 50% to 300%

**Quick Toggles:**
- **Show seconds checkbox**: Toggle seconds display on/off directly from the toolbar

### Clock Mode

The clock displays the current time and updates every second with a flip animation.

**Controls:**
- Click "Clock" button to switch to clock mode
- The clock will automatically show the current time
- Configure 12h/24h format in settings

### Timer Mode

Use the timer for Pomodoro sessions, time blocking, or any countdown needs.

**Controls:**
- Click "Timer" button to switch to timer mode
- Click preset buttons (5m, 10m, 25m, 50m) to set duration
- Click "Start" to begin countdown
- Click "Pause" to pause the timer
- Click "Resume" to continue from paused state
- Click "Reset" to reset to initial duration

**On Timer Completion:**
- Visual flash animation
- Optional alarm sound
- Optional auto-restart (if loop is enabled)

### Embedding in Notes

You can embed flip clocks directly in your markdown notes using code blocks:

#### Basic Clock
\`\`\`flipclock
mode: clock
format: 24h
seconds: true
\`\`\`

#### Timer with Custom Duration
\`\`\`flipclock
mode: timer
timer: 25m
animation: true
\`\`\`

#### Multiple Timer Formats
\`\`\`flipclock
mode: timer
timer: 1h30m
\`\`\`

\`\`\`flipclock
mode: timer
timer: 90s
\`\`\`

#### Available Options
- `mode`: `clock` or `timer`
- `format`: `12h` or `24h`
- `seconds`: `true` or `false`
- `animation`: `true` or `false`
- `timer`: Duration string (e.g., `25m`, `1h30m`, `90s`)

## Settings

Access settings via Settings → Community Plugins → Flip Clock

### Clock Display
- **24-hour format**: Toggle between 12h and 24h time formats
- **Blinking colon**: Make the colon separator blink every second

### Animation
- **Enable animations**: Show flip animation when digits change
- **Reduce motion**: Disable animations for accessibility

### Sound
- **Enable sound**: Master toggle for all audio
- **Tick sound**: Play subtle tick on each second change
- **Alarm sound**: Play melody when timer completes
- **Volume**: Adjust sound volume (0-100%)

### Timer
- **Loop timer**: Automatically restart when timer reaches zero
- **Persist timer state**: Remember timer state after Obsidian restart

### Accessibility
- **High contrast**: Enhanced visibility with high contrast colors

### Display Size
- **Default zoom level**: Set your preferred zoom level (50% - 300%)

### Unobtrusive Display
- **Show in status bar**: Display time in the status bar at the bottom (minimal and unobtrusive)
- **Show floating clock**: Display a minimal floating clock overlay in your workspace

## Keyboard Shortcuts

You can assign custom keyboard shortcuts via Settings → Hotkeys:
- Search for "Flip Clock: Open Flip Clock"
- Click the + icon to add your preferred shortcut

## Performance

The plugin is optimized for minimal resource usage:
- Target CPU usage: <2% during idle clock mode
- Smooth 60fps animations on modern hardware
- No memory leaks during extended sessions
- Works offline (no network calls)

## Browser Compatibility

- **Desktop**: Full support on macOS, Windows, Linux
- **Mobile**: Basic display support on iOS and Android (reduced animation quality)

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/obsidian-flip-clock.git
cd obsidian-flip-clock

# Install dependencies
npm install

# Development build with auto-reload
npm run dev

# Production build
npm run build
```

### Project Structure
```
obsidian-flip-clock/
├── main.ts              # Main plugin code
├── audio-manager.ts     # Audio playback system
├── styles.css          # Flip clock styles
├── manifest.json       # Plugin manifest
├── package.json        # Dependencies
└── tsconfig.json       # TypeScript config
```

## Privacy

This plugin:
- Does NOT collect any user data
- Does NOT make network requests
- Runs entirely locally in your vault
- Stores only user preferences in Obsidian's plugin data folder

## Troubleshooting

### Clock not updating
- Try closing and reopening the flip clock panel
- Reload Obsidian (Cmd/Ctrl + R)

### Animations stuttering
- Enable "Reduce motion" in settings
- Check if other plugins are causing performance issues
- Reduce the number of open panes

### No sound
- Check "Enable sound" is toggled on in settings
- Verify volume slider is not at 0
- Check browser/system audio permissions

### Embedded clock not showing
- Verify code block syntax: \`\`\`flipclock
- Check for typos in option names
- Ensure plugin is enabled

## Support

- Report issues: [GitHub Issues](https://github.com/yourusername/obsidian-flip-clock/issues)
- Feature requests: [GitHub Discussions](https://github.com/yourusername/obsidian-flip-clock/discussions)

## License

MIT License - see LICENSE file for details

## Credits

Inspired by classic mechanical flip clocks and Mac OS design aesthetics.

## Changelog

### 0.0.1 (Initial Release)
- Clock mode with real-time display
- Timer mode with countdown functionality
- Flip animations
- Sound effects (tick and alarm)
- Markdown code block embedding
- Customizable settings
- Accessibility options
- Theme-aware styling
- Status bar display
