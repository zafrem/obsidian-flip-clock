import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, ItemView, MarkdownPostProcessorContext } from 'obsidian';
import { AudioManager } from './audio-manager';

export const VIEW_TYPE_FLIP_CLOCK = 'flip-clock-view';

export interface FlipClockSettings {
	mode: 'clock' | 'timer';
	use24Hour: boolean;
	showSeconds: boolean;
	animationEnabled: boolean;
	soundEnabled: boolean;
	tickSoundEnabled: boolean;
	alarmSoundEnabled: boolean;
	volume: number;
	timerPresets: number[]; // in seconds
	persistTimerState: boolean;
	timerDuration: number; // in seconds
	timerRemaining: number; // in seconds
	timerLoop: boolean;
	blinkingColon: boolean;
	reduceMotion: boolean;
	highContrast: boolean;
}

export const DEFAULT_SETTINGS: FlipClockSettings = {
	mode: 'clock',
	use24Hour: true,
	showSeconds: true,
	animationEnabled: true,
	soundEnabled: false,
	tickSoundEnabled: false,
	alarmSoundEnabled: true,
	volume: 0.5,
	timerPresets: [300, 600, 1500, 3000], // 5, 10, 25, 50 minutes
	persistTimerState: false,
	timerDuration: 1500,
	timerRemaining: 1500,
	timerLoop: false,
	blinkingColon: false,
	reduceMotion: false,
	highContrast: false,
};

export default class FlipClockPlugin extends Plugin {
	settings: FlipClockSettings;
	audioManager: AudioManager;

	async onload() {
		await this.loadSettings();

		// Initialize audio manager
		this.audioManager = new AudioManager(this.settings.volume);

		// Register the flip clock view
		this.registerView(
			VIEW_TYPE_FLIP_CLOCK,
			(leaf) => new FlipClockView(leaf, this)
		);

		// Add ribbon icon to open flip clock
		this.addRibbonIcon('clock', 'Open Flip Clock', () => {
			this.activateView();
		});

		// Add command to open flip clock
		this.addCommand({
			id: 'open-flip-clock',
			name: 'Open Flip Clock',
			callback: () => {
				this.activateView();
			}
		});

		// Add settings tab
		this.addSettingTab(new FlipClockSettingTab(this.app, this));

		// Register markdown code block processor
		this.registerMarkdownCodeBlockProcessor('flipclock', this.processFlipClockCodeBlock.bind(this));

		console.log('Flip Clock plugin loaded');
	}

	onunload() {
		// Clean up audio resources
		if (this.audioManager) {
			this.audioManager.dispose();
		}
		console.log('Flip Clock plugin unloaded');
	}

	processFlipClockCodeBlock(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		// Parse options from source
		const options = this.parseCodeBlockOptions(source);

		// Create embedded flip clock
		const container = el.createDiv('flip-clock-embed');
		const embedView = new FlipClockEmbedView(container, this, options);
		embedView.render();
	}

	parseCodeBlockOptions(source: string): Partial<FlipClockSettings> {
		const options: Partial<FlipClockSettings> = {};
		const lines = source.split('\n');

		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;

			const [key, value] = trimmed.split(':').map(s => s.trim());
			if (!key || !value) continue;

			switch (key.toLowerCase()) {
				case 'mode':
					if (value === 'clock' || value === 'timer') {
						options.mode = value;
					}
					break;
				case 'format':
					options.use24Hour = value === '24h';
					break;
				case 'seconds':
					options.showSeconds = value.toLowerCase() === 'true';
					break;
				case 'animation':
					options.animationEnabled = value.toLowerCase() === 'true';
					break;
				case 'timer':
					// Parse timer duration like "25m" or "1h30m" or "90s"
					const duration = this.parseDuration(value);
					if (duration > 0) {
						options.timerDuration = duration;
						options.timerRemaining = duration;
					}
					break;
			}
		}

		return options;
	}

	parseDuration(value: string): number {
		let totalSeconds = 0;
		const hourMatch = value.match(/(\d+)h/);
		const minMatch = value.match(/(\d+)m/);
		const secMatch = value.match(/(\d+)s/);

		if (hourMatch) totalSeconds += parseInt(hourMatch[1]) * 3600;
		if (minMatch) totalSeconds += parseInt(minMatch[1]) * 60;
		if (secMatch) totalSeconds += parseInt(secMatch[1]);

		return totalSeconds;
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_FLIP_CLOCK);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({ type: VIEW_TYPE_FLIP_CLOCK, active: true });
			}
		}

		// Reveal the leaf in case it is in a collapsed sidebar
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}
}

class FlipClockView extends ItemView {
	plugin: FlipClockPlugin;
	private clockEl: HTMLElement;
	private controlsEl: HTMLElement;
	private intervalId: number | null = null;
	private timerIntervalId: number | null = null;
	private timerRunning: boolean = false;
	private timerPaused: boolean = false;

	constructor(leaf: WorkspaceLeaf, plugin: FlipClockPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_FLIP_CLOCK;
	}

	getDisplayText(): string {
		return 'Flip Clock';
	}

	getIcon(): string {
		return 'clock';
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass('flip-clock-container');

		// Create main container
		this.containerEl = container.createDiv('flip-clock-main');

		// Create mode selector
		const modeSelector = this.containerEl.createDiv('flip-clock-mode-selector');
		const clockBtn = modeSelector.createEl('button', { text: 'Clock' });
		const timerBtn = modeSelector.createEl('button', { text: 'Timer' });

		clockBtn.addEventListener('click', async () => {
			this.plugin.settings.mode = 'clock';
			await this.plugin.saveSettings();
			this.updateDisplay();
		});

		timerBtn.addEventListener('click', async () => {
			this.plugin.settings.mode = 'timer';
			await this.plugin.saveSettings();
			this.updateDisplay();
		});

		// Create clock display
		this.clockEl = this.containerEl.createDiv('flip-clock-display');

		// Create controls (for timer mode)
		this.controlsEl = this.containerEl.createDiv('flip-clock-controls');

		this.updateDisplay();
	}

	async onClose() {
		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
		}
		if (this.timerIntervalId !== null) {
			window.clearInterval(this.timerIntervalId);
		}
	}

	private updateDisplay() {
		// Clear existing interval
		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
			this.intervalId = null;
		}
		if (this.timerIntervalId !== null) {
			window.clearInterval(this.timerIntervalId);
			this.timerIntervalId = null;
		}

		if (this.plugin.settings.mode === 'clock') {
			this.showClockMode();
		} else {
			this.showTimerMode();
		}
	}

	private showClockMode() {
		this.clockEl.empty();
		this.controlsEl.empty();
		this.controlsEl.hide();

		// Create flip digits for clock
		const hoursDiv = this.createFlipDigitPair('hours');
		const colonDiv1 = this.clockEl.createDiv('flip-colon');
		colonDiv1.setText(':');
		const minutesDiv = this.createFlipDigitPair('minutes');
		const colonDiv2 = this.clockEl.createDiv('flip-colon');
		colonDiv2.setText(':');
		const secondsDiv = this.createFlipDigitPair('seconds');

		if (!this.plugin.settings.showSeconds) {
			colonDiv2.hide();
			secondsDiv.hide();
		}

		this.updateClock();
		this.intervalId = window.setInterval(() => this.updateClock(), 1000);
	}

	private showTimerMode() {
		this.clockEl.empty();
		this.controlsEl.empty();
		this.controlsEl.show();

		// Create flip digits for timer
		const hoursDiv = this.createFlipDigitPair('hours');
		const colonDiv1 = this.clockEl.createDiv('flip-colon');
		colonDiv1.setText(':');
		const minutesDiv = this.createFlipDigitPair('minutes');
		const colonDiv2 = this.clockEl.createDiv('flip-colon');
		colonDiv2.setText(':');
		const secondsDiv = this.createFlipDigitPair('seconds');

		// Create timer controls
		const startBtn = this.controlsEl.createEl('button', { text: 'Start', cls: 'flip-clock-btn' });
		const pauseBtn = this.controlsEl.createEl('button', { text: 'Pause', cls: 'flip-clock-btn' });
		const resetBtn = this.controlsEl.createEl('button', { text: 'Reset', cls: 'flip-clock-btn' });

		pauseBtn.hide();

		startBtn.addEventListener('click', () => {
			this.startTimer();
			startBtn.hide();
			pauseBtn.show();
		});

		pauseBtn.addEventListener('click', () => {
			this.pauseTimer();
			pauseBtn.hide();
			startBtn.show();
			startBtn.setText('Resume');
		});

		resetBtn.addEventListener('click', () => {
			this.resetTimer();
			pauseBtn.hide();
			startBtn.show();
			startBtn.setText('Start');
		});

		// Add preset buttons
		const presetsDiv = this.controlsEl.createDiv('flip-clock-presets');
		for (const preset of this.plugin.settings.timerPresets) {
			const presetBtn = presetsDiv.createEl('button', {
				text: this.formatPresetTime(preset),
				cls: 'flip-clock-preset-btn'
			});
			presetBtn.addEventListener('click', () => {
				this.plugin.settings.timerDuration = preset;
				this.plugin.settings.timerRemaining = preset;
				this.resetTimer();
			});
		}

		this.updateTimerDisplay();
	}

	private createFlipDigitPair(id: string): HTMLElement {
		const container = this.clockEl.createDiv('flip-digit-pair');
		container.id = `flip-${id}`;

		// Digit 1
		const digit1 = container.createDiv('flip-digit');
		digit1.id = `${id}-1`;
		const card1 = digit1.createDiv('flip-card');

		const top1 = card1.createDiv('flip-card-top');
		const topSpan1 = top1.createEl('span');
		topSpan1.setText('0');

		const bottom1 = card1.createDiv('flip-card-bottom');
		const bottomSpan1 = bottom1.createEl('span');
		bottomSpan1.setText('0');

		const flipTop1 = card1.createDiv('flip-card-flip-top');
		flipTop1.createEl('span');

		const flipBottom1 = card1.createDiv('flip-card-flip-bottom');
		flipBottom1.createEl('span');

		// Digit 2
		const digit2 = container.createDiv('flip-digit');
		digit2.id = `${id}-2`;
		const card2 = digit2.createDiv('flip-card');

		const top2 = card2.createDiv('flip-card-top');
		const topSpan2 = top2.createEl('span');
		topSpan2.setText('0');

		const bottom2 = card2.createDiv('flip-card-bottom');
		const bottomSpan2 = bottom2.createEl('span');
		bottomSpan2.setText('0');

		const flipTop2 = card2.createDiv('flip-card-flip-top');
		flipTop2.createEl('span');

		const flipBottom2 = card2.createDiv('flip-card-flip-bottom');
		flipBottom2.createEl('span');

		return container;
	}

	private updateClock() {
		const now = new Date();
		let hours = now.getHours();

		if (!this.plugin.settings.use24Hour && hours > 12) {
			hours -= 12;
		} else if (!this.plugin.settings.use24Hour && hours === 0) {
			hours = 12;
		}

		const minutes = now.getMinutes();
		const seconds = now.getSeconds();

		this.updateDigitPair('hours', hours);
		this.updateDigitPair('minutes', minutes);
		if (this.plugin.settings.showSeconds) {
			this.updateDigitPair('seconds', seconds);
		}
	}

	private updateTimerDisplay() {
		const remaining = this.plugin.settings.timerRemaining;
		const hours = Math.floor(remaining / 3600);
		const minutes = Math.floor((remaining % 3600) / 60);
		const seconds = remaining % 60;

		this.updateDigitPair('hours', hours);
		this.updateDigitPair('minutes', minutes);
		this.updateDigitPair('seconds', seconds);
	}

	private updateDigitPair(id: string, value: number) {
		const digit1 = Math.floor(value / 10);
		const digit2 = value % 10;

		this.updateDigit(`${id}-1`, digit1);
		this.updateDigit(`${id}-2`, digit2);
	}

	private updateDigit(id: string, value: number) {
		const digitEl = this.containerEl.querySelector(`#${id}`);
		if (!digitEl) return;

		const top = digitEl.querySelector('.flip-card-top span');
		const bottom = digitEl.querySelector('.flip-card-bottom span');
		const flipTop = digitEl.querySelector('.flip-card-flip-top span');
		const flipBottom = digitEl.querySelector('.flip-card-flip-bottom span');

		if (top && bottom && flipTop && flipBottom) {
			const currentValue = top.textContent || '';
			const newValue = value.toString();

			// ALWAYS ensure both are showing the same number
			if (top.textContent !== bottom.textContent) {
				// Sync them to newValue
				top.textContent = newValue;
				bottom.textContent = newValue;
				return;
			}

			if (currentValue !== newValue) {
				// Play tick sound only if there was a previous value
				if (currentValue !== '' && currentValue !== null && currentValue !== '0') {
					this.playTickSound();
				}

				if (this.plugin.settings.animationEnabled && !this.plugin.settings.reduceMotion && currentValue !== '' && currentValue !== null && currentValue !== '0') {
					// Set flip cards
					flipTop.textContent = currentValue;
					flipBottom.textContent = newValue;

					const card = digitEl.querySelector('.flip-card');
					card?.classList.add('flipping');

					setTimeout(() => {
						// CRITICAL: Update both to same value
						top.textContent = newValue;
						bottom.textContent = newValue;
						card?.classList.remove('flipping');
					}, 600);
				} else {
					// No animation - immediate update
					// CRITICAL: Both must be updated together
					top.textContent = newValue;
					bottom.textContent = newValue;
				}
			} else {
				// Even if value is the same, ensure both are set correctly
				if (!top.textContent || !bottom.textContent) {
					top.textContent = newValue;
					bottom.textContent = newValue;
				}
			}
		}
	}

	private startTimer() {
		if (this.timerRunning && !this.timerPaused) return;

		this.timerRunning = true;
		this.timerPaused = false;

		this.timerIntervalId = window.setInterval(() => {
			if (this.plugin.settings.timerRemaining > 0) {
				this.plugin.settings.timerRemaining--;
				this.updateTimerDisplay();

				if (this.plugin.settings.persistTimerState) {
					this.plugin.saveSettings();
				}
			} else {
				// Timer finished
				this.onTimerComplete();
			}
		}, 1000);
	}

	private pauseTimer() {
		this.timerPaused = true;
		if (this.timerIntervalId !== null) {
			window.clearInterval(this.timerIntervalId);
			this.timerIntervalId = null;
		}
	}

	private resetTimer() {
		this.timerRunning = false;
		this.timerPaused = false;
		if (this.timerIntervalId !== null) {
			window.clearInterval(this.timerIntervalId);
			this.timerIntervalId = null;
		}
		this.plugin.settings.timerRemaining = this.plugin.settings.timerDuration;
		this.updateTimerDisplay();
		if (this.plugin.settings.persistTimerState) {
			this.plugin.saveSettings();
		}
	}

	private onTimerComplete() {
		// Play alarm sound if enabled
		if (this.plugin.settings.soundEnabled && this.plugin.settings.alarmSoundEnabled) {
			this.playAlarmSound();
		}

		// Visual highlight
		this.clockEl.addClass('timer-complete');
		setTimeout(() => {
			this.clockEl.removeClass('timer-complete');
		}, 2000);

		if (this.plugin.settings.timerLoop) {
			// Restart timer
			this.resetTimer();
			this.startTimer();
		} else {
			// Stop timer
			this.pauseTimer();
			this.timerRunning = false;
		}
	}

	private playAlarmSound() {
		if (this.plugin.audioManager) {
			this.plugin.audioManager.playAlarm();
		}
	}

	private playTickSound() {
		if (this.plugin.audioManager && this.plugin.settings.soundEnabled && this.plugin.settings.tickSoundEnabled) {
			this.plugin.audioManager.playTick();
		}
	}

	private formatPresetTime(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) {
			return `${minutes}m`;
		} else {
			const hours = Math.floor(minutes / 60);
			const remainingMinutes = minutes % 60;
			return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
		}
	}
}

class FlipClockEmbedView {
	private container: HTMLElement;
	private plugin: FlipClockPlugin;
	private settings: FlipClockSettings;
	private intervalId: number | null = null;
	private clockEl: HTMLElement | null = null;
	private controlsEl: HTMLElement | null = null;
	private timerIntervalId: number | null = null;
	private timerRunning: boolean = false;
	private timerPaused: boolean = false;

	constructor(container: HTMLElement, plugin: FlipClockPlugin, options: Partial<FlipClockSettings>) {
		this.container = container;
		this.plugin = plugin;
		// Merge options with plugin settings
		this.settings = Object.assign({}, plugin.settings, options);
	}

	render() {
		this.container.empty();

		// Create clock display
		this.clockEl = this.container.createDiv('flip-clock-display');

		if (this.settings.mode === 'clock') {
			this.renderClock();
		} else {
			this.renderTimer();
		}
	}

	private renderClock() {
		if (!this.clockEl) return;

		this.clockEl.empty();

		// Create flip digits
		const hoursDiv = this.createFlipDigitPair('embed-hours');
		const colonDiv1 = this.clockEl.createDiv('flip-colon');
		colonDiv1.setText(':');
		const minutesDiv = this.createFlipDigitPair('embed-minutes');

		if (this.settings.showSeconds) {
			const colonDiv2 = this.clockEl.createDiv('flip-colon');
			colonDiv2.setText(':');
			const secondsDiv = this.createFlipDigitPair('embed-seconds');
		}

		this.updateClock();
		this.intervalId = window.setInterval(() => this.updateClock(), 1000);
	}

	private renderTimer() {
		if (!this.clockEl) return;

		this.clockEl.empty();

		// Create flip digits
		const hoursDiv = this.createFlipDigitPair('embed-hours');
		const colonDiv1 = this.clockEl.createDiv('flip-colon');
		colonDiv1.setText(':');
		const minutesDiv = this.createFlipDigitPair('embed-minutes');
		const colonDiv2 = this.clockEl.createDiv('flip-colon');
		colonDiv2.setText(':');
		const secondsDiv = this.createFlipDigitPair('embed-seconds');

		// Create controls
		this.controlsEl = this.container.createDiv('flip-clock-controls');
		const startBtn = this.controlsEl.createEl('button', { text: 'Start', cls: 'flip-clock-btn' });
		const pauseBtn = this.controlsEl.createEl('button', { text: 'Pause', cls: 'flip-clock-btn' });
		const resetBtn = this.controlsEl.createEl('button', { text: 'Reset', cls: 'flip-clock-btn' });

		pauseBtn.hide();

		startBtn.addEventListener('click', () => {
			this.startTimer();
			startBtn.hide();
			pauseBtn.show();
		});

		pauseBtn.addEventListener('click', () => {
			this.pauseTimer();
			pauseBtn.hide();
			startBtn.show();
			startBtn.setText('Resume');
		});

		resetBtn.addEventListener('click', () => {
			this.resetTimer();
			pauseBtn.hide();
			startBtn.show();
			startBtn.setText('Start');
		});

		this.updateTimerDisplay();
	}

	private createFlipDigitPair(id: string): HTMLElement {
		if (!this.clockEl) return this.container.createDiv();

		const container = this.clockEl.createDiv('flip-digit-pair');
		container.id = `flip-${id}`;

		// Digit 1
		const digit1 = container.createDiv('flip-digit');
		digit1.id = `${id}-1`;
		const card1 = digit1.createDiv('flip-card');

		const top1 = card1.createDiv('flip-card-top');
		const topSpan1 = top1.createEl('span');
		topSpan1.setText('0');

		const bottom1 = card1.createDiv('flip-card-bottom');
		const bottomSpan1 = bottom1.createEl('span');
		bottomSpan1.setText('0');

		const flipTop1 = card1.createDiv('flip-card-flip-top');
		flipTop1.createEl('span');

		const flipBottom1 = card1.createDiv('flip-card-flip-bottom');
		flipBottom1.createEl('span');

		// Digit 2
		const digit2 = container.createDiv('flip-digit');
		digit2.id = `${id}-2`;
		const card2 = digit2.createDiv('flip-card');

		const top2 = card2.createDiv('flip-card-top');
		const topSpan2 = top2.createEl('span');
		topSpan2.setText('0');

		const bottom2 = card2.createDiv('flip-card-bottom');
		const bottomSpan2 = bottom2.createEl('span');
		bottomSpan2.setText('0');

		const flipTop2 = card2.createDiv('flip-card-flip-top');
		flipTop2.createEl('span');

		const flipBottom2 = card2.createDiv('flip-card-flip-bottom');
		flipBottom2.createEl('span');

		return container;
	}

	private updateClock() {
		const now = new Date();
		let hours = now.getHours();

		if (!this.settings.use24Hour && hours > 12) {
			hours -= 12;
		} else if (!this.settings.use24Hour && hours === 0) {
			hours = 12;
		}

		const minutes = now.getMinutes();
		const seconds = now.getSeconds();

		this.updateDigitPair('embed-hours', hours);
		this.updateDigitPair('embed-minutes', minutes);
		if (this.settings.showSeconds) {
			this.updateDigitPair('embed-seconds', seconds);
		}
	}

	private updateTimerDisplay() {
		const remaining = this.settings.timerRemaining;
		const hours = Math.floor(remaining / 3600);
		const minutes = Math.floor((remaining % 3600) / 60);
		const seconds = remaining % 60;

		this.updateDigitPair('embed-hours', hours);
		this.updateDigitPair('embed-minutes', minutes);
		this.updateDigitPair('embed-seconds', seconds);
	}

	private updateDigitPair(id: string, value: number) {
		const digit1 = Math.floor(value / 10);
		const digit2 = value % 10;

		this.updateDigit(`${id}-1`, digit1);
		this.updateDigit(`${id}-2`, digit2);
	}

	private updateDigit(id: string, value: number) {
		const digitEl = this.container.querySelector(`#${id}`);
		if (!digitEl) return;

		const top = digitEl.querySelector('.flip-card-top span');
		const bottom = digitEl.querySelector('.flip-card-bottom span');
		const flipTop = digitEl.querySelector('.flip-card-flip-top span');
		const flipBottom = digitEl.querySelector('.flip-card-flip-bottom span');

		if (top && bottom && flipTop && flipBottom) {
			const currentValue = top.textContent || '';
			const newValue = value.toString();

			// ALWAYS ensure both are showing the same number
			if (top.textContent !== bottom.textContent) {
				// Sync them to newValue
				top.textContent = newValue;
				bottom.textContent = newValue;
				return;
			}

			if (currentValue !== newValue) {
				if (this.settings.animationEnabled && !this.settings.reduceMotion && currentValue !== '' && currentValue !== null && currentValue !== '0') {
					// Set flip cards
					flipTop.textContent = currentValue;
					flipBottom.textContent = newValue;

					const card = digitEl.querySelector('.flip-card');
					card?.classList.add('flipping');

					setTimeout(() => {
						// CRITICAL: Update both to same value
						top.textContent = newValue;
						bottom.textContent = newValue;
						card?.classList.remove('flipping');
					}, 600);
				} else {
					// No animation - immediate update
					// CRITICAL: Both must be updated together
					top.textContent = newValue;
					bottom.textContent = newValue;
				}
			} else {
				// Even if value is the same, ensure both are set correctly
				if (!top.textContent || !bottom.textContent) {
					top.textContent = newValue;
					bottom.textContent = newValue;
				}
			}
		}
	}

	private startTimer() {
		if (this.timerRunning && !this.timerPaused) return;

		this.timerRunning = true;
		this.timerPaused = false;

		this.timerIntervalId = window.setInterval(() => {
			if (this.settings.timerRemaining > 0) {
				this.settings.timerRemaining--;
				this.updateTimerDisplay();
			} else {
				this.onTimerComplete();
			}
		}, 1000);
	}

	private pauseTimer() {
		this.timerPaused = true;
		if (this.timerIntervalId !== null) {
			window.clearInterval(this.timerIntervalId);
			this.timerIntervalId = null;
		}
	}

	private resetTimer() {
		this.timerRunning = false;
		this.timerPaused = false;
		if (this.timerIntervalId !== null) {
			window.clearInterval(this.timerIntervalId);
			this.timerIntervalId = null;
		}
		this.settings.timerRemaining = this.settings.timerDuration;
		this.updateTimerDisplay();
	}

	private onTimerComplete() {
		if (this.plugin.settings.soundEnabled && this.plugin.settings.alarmSoundEnabled) {
			this.plugin.audioManager.playAlarm();
		}

		if (this.clockEl) {
			this.clockEl.addClass('timer-complete');
			setTimeout(() => {
				this.clockEl?.removeClass('timer-complete');
			}, 2000);
		}

		if (this.settings.timerLoop) {
			this.resetTimer();
			this.startTimer();
		} else {
			this.pauseTimer();
			this.timerRunning = false;
		}
	}

	destroy() {
		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
		}
		if (this.timerIntervalId !== null) {
			window.clearInterval(this.timerIntervalId);
		}
	}
}

class FlipClockSettingTab extends PluginSettingTab {
	plugin: FlipClockPlugin;

	constructor(app: App, plugin: FlipClockPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Flip Clock Settings' });

		// Clock settings
		containerEl.createEl('h3', { text: 'Clock Display' });

		new Setting(containerEl)
			.setName('24-hour format')
			.setDesc('Use 24-hour time format instead of 12-hour')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.use24Hour)
				.onChange(async (value) => {
					this.plugin.settings.use24Hour = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show seconds')
			.setDesc('Display seconds in the clock')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showSeconds)
				.onChange(async (value) => {
					this.plugin.settings.showSeconds = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Blinking colon')
			.setDesc('Make the colon blink every second')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.blinkingColon)
				.onChange(async (value) => {
					this.plugin.settings.blinkingColon = value;
					await this.plugin.saveSettings();
				}));

		// Animation settings
		containerEl.createEl('h3', { text: 'Animation' });

		new Setting(containerEl)
			.setName('Enable animations')
			.setDesc('Show flip animation when digits change')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.animationEnabled)
				.onChange(async (value) => {
					this.plugin.settings.animationEnabled = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Reduce motion')
			.setDesc('Disable animations for accessibility')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.reduceMotion)
				.onChange(async (value) => {
					this.plugin.settings.reduceMotion = value;
					await this.plugin.saveSettings();
				}));

		// Sound settings
		containerEl.createEl('h3', { text: 'Sound' });

		new Setting(containerEl)
			.setName('Enable sound')
			.setDesc('Enable audio feedback')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.soundEnabled)
				.onChange(async (value) => {
					this.plugin.settings.soundEnabled = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Tick sound')
			.setDesc('Play a tick sound on each second')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.tickSoundEnabled)
				.onChange(async (value) => {
					this.plugin.settings.tickSoundEnabled = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Alarm sound')
			.setDesc('Play alarm when timer completes')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.alarmSoundEnabled)
				.onChange(async (value) => {
					this.plugin.settings.alarmSoundEnabled = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Volume')
			.setDesc('Adjust sound volume')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.1)
				.setValue(this.plugin.settings.volume)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.volume = value;
					await this.plugin.saveSettings();
				}));

		// Timer settings
		containerEl.createEl('h3', { text: 'Timer' });

		new Setting(containerEl)
			.setName('Loop timer')
			.setDesc('Automatically restart timer when it completes')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.timerLoop)
				.onChange(async (value) => {
					this.plugin.settings.timerLoop = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Persist timer state')
			.setDesc('Remember timer state after reloading Obsidian')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.persistTimerState)
				.onChange(async (value) => {
					this.plugin.settings.persistTimerState = value;
					await this.plugin.saveSettings();
				}));

		// Accessibility
		containerEl.createEl('h3', { text: 'Accessibility' });

		new Setting(containerEl)
			.setName('High contrast')
			.setDesc('Use high contrast colors for better visibility')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.highContrast)
				.onChange(async (value) => {
					this.plugin.settings.highContrast = value;
					await this.plugin.saveSettings();
				}));
	}
}
