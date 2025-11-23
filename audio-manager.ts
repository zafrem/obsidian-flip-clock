// Audio Manager for Flip Clock Plugin

export class AudioManager {
	private audioContext: AudioContext | null = null;
	private volume: number = 0.5;

	constructor(volume: number = 0.5) {
		this.volume = volume;
		this.initializeAudioContext();
	}

	private initializeAudioContext() {
		try {
			// Create AudioContext on user interaction to avoid browser restrictions
			if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
				this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
			}
		} catch (e) {
			console.error('Failed to initialize AudioContext:', e);
		}
	}

	setVolume(volume: number) {
		this.volume = Math.max(0, Math.min(1, volume));
	}

	/**
	 * Play a subtle tick sound
	 */
	playTick() {
		if (!this.audioContext) {
			this.initializeAudioContext();
		}

		if (!this.audioContext) return;

		try {
			const oscillator = this.audioContext.createOscillator();
			const gainNode = this.audioContext.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(this.audioContext.destination);

			// Create a subtle tick sound
			oscillator.type = 'sine';
			oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);

			// Very short envelope for a tick
			gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
			gainNode.gain.linearRampToValueAtTime(this.volume * 0.1, this.audioContext.currentTime + 0.01);
			gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

			oscillator.start(this.audioContext.currentTime);
			oscillator.stop(this.audioContext.currentTime + 0.05);
		} catch (e) {
			console.error('Failed to play tick sound:', e);
		}
	}

	/**
	 * Play an alarm sound
	 */
	playAlarm() {
		if (!this.audioContext) {
			this.initializeAudioContext();
		}

		if (!this.audioContext) return;

		try {
			// Create a pleasant alarm sound using multiple oscillators
			const playTone = (frequency: number, startTime: number, duration: number) => {
				const oscillator = this.audioContext!.createOscillator();
				const gainNode = this.audioContext!.createGain();

				oscillator.connect(gainNode);
				gainNode.connect(this.audioContext!.destination);

				oscillator.type = 'sine';
				oscillator.frequency.setValueAtTime(frequency, startTime);

				// Envelope
				gainNode.gain.setValueAtTime(0, startTime);
				gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, startTime + 0.05);
				gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, startTime + duration - 0.1);
				gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

				oscillator.start(startTime);
				oscillator.stop(startTime + duration);
			};

			const currentTime = this.audioContext.currentTime;
			const noteDuration = 0.3;
			const gapDuration = 0.1;

			// Play a pleasant melody (C-E-G pattern)
			const melody = [
				{ freq: 523.25, time: 0 },                          // C5
				{ freq: 659.25, time: noteDuration + gapDuration }, // E5
				{ freq: 783.99, time: (noteDuration + gapDuration) * 2 }, // G5
			];

			melody.forEach(note => {
				playTone(note.freq, currentTime + note.time, noteDuration);
			});

			// Repeat the pattern
			melody.forEach(note => {
				playTone(note.freq, currentTime + note.time + (noteDuration + gapDuration) * 3, noteDuration);
			});

		} catch (e) {
			console.error('Failed to play alarm sound:', e);
		}
	}

	/**
	 * Play a flip mechanical sound
	 */
	playFlip() {
		if (!this.audioContext) {
			this.initializeAudioContext();
		}

		if (!this.audioContext) return;

		try {
			// Create a mechanical flip sound using white noise
			const bufferSize = this.audioContext.sampleRate * 0.05; // 50ms
			const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
			const output = buffer.getChannelData(0);

			// Generate white noise
			for (let i = 0; i < bufferSize; i++) {
				output[i] = Math.random() * 2 - 1;
			}

			const noise = this.audioContext.createBufferSource();
			noise.buffer = buffer;

			const filter = this.audioContext.createBiquadFilter();
			filter.type = 'bandpass';
			filter.frequency.setValueAtTime(400, this.audioContext.currentTime);
			filter.Q.setValueAtTime(1, this.audioContext.currentTime);

			const gainNode = this.audioContext.createGain();

			noise.connect(filter);
			filter.connect(gainNode);
			gainNode.connect(this.audioContext.destination);

			// Very quick envelope
			gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
			gainNode.gain.linearRampToValueAtTime(this.volume * 0.05, this.audioContext.currentTime + 0.01);
			gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

			noise.start(this.audioContext.currentTime);
			noise.stop(this.audioContext.currentTime + 0.05);
		} catch (e) {
			console.error('Failed to play flip sound:', e);
		}
	}

	/**
	 * Clean up resources
	 */
	dispose() {
		if (this.audioContext) {
			this.audioContext.close();
			this.audioContext = null;
		}
	}
}
