interface VisualizerOptions {
    width?: number;
    height?: number;
    colors?: {
      red: number;
      green: number;
      blue: number;
    };
  }
  
  interface ColorConfig {
    red: number;
    green: number;
    blue: number;
  }
  
  export class SimpleVisualizer {
    private container: HTMLElement;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private animationId: number | null = null;
    private isPlaying: boolean = false;
    private colors: ColorConfig;
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private dataArray: Uint8Array | null = null;
    private bufferLength: number = 0;
  
    constructor(container: HTMLElement, options: VisualizerOptions = {}) {
      this.container = container;
      this.canvas = document.createElement('canvas');
      
      const context = this.canvas.getContext('2d');
      if (!context) {
        throw new Error('Failed to get 2D context from canvas');
      }
      this.ctx = context;
      
      this.colors = options.colors || { red: 1.0, green: 0.8, blue: 0.2 };
      
      // Set canvas dimensions
      this.canvas.width = options.width || container.clientWidth;
      this.canvas.height = options.height || 400;
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      
      // Append canvas to container
      container.appendChild(this.canvas);
    }
  
    connectMediaStream(stream: MediaStream): boolean {
      try {
        // Create audio context
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();
        
        // Create analyser
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        
        // Connect stream to analyser
        const source = this.audioContext.createMediaStreamSource(stream);
        source.connect(this.analyser);
        
        // Setup data array for frequency data
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength as number);
        
        console.log('✅ Media stream connected to visualizer');
        return true;
      } catch (error) {
        console.error('Failed to connect media stream:', error);
        return false;
      }
    }
  
    setColors(red: number, green: number, blue: number): void {
      this.colors = { red, green, blue };
    }
  
    start(): void {
      if (!this.isPlaying) {
        this.isPlaying = true;
        this.animate();
      }
    }
  
    stop(): void {
      this.isPlaying = false;
      if (this.animationId !== null) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    }
  
    private animate = (): void => {
      if (!this.isPlaying) return;
  
      this.animationId = requestAnimationFrame(this.animate);
  
      const width = this.canvas.width;
      const height = this.canvas.height;
      
      // Clear canvas with dark background
      this.ctx.fillStyle = 'rgb(17, 24, 39)';
      this.ctx.fillRect(0, 0, width, height);
  
      if (this.analyser && this.dataArray) {
        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray as Uint8Array<ArrayBuffer>);
        
        // Draw frequency bars
        const barWidth = (width / this.bufferLength) * 2.5;
        let x = 0;
        
        const r = Math.floor(this.colors.red * 255);
        const g = Math.floor(this.colors.green * 255);
        const b = Math.floor(this.colors.blue * 255);
  
        for (let i = 0; i < this.bufferLength; i++) {
          const barHeight = (this.dataArray[i] / 255) * height * 0.8;
  
          this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          this.ctx.fillRect(x, height - barHeight, barWidth, barHeight);
  
          x += barWidth + 1;
        }
      } else {
        // Draw idle animation (sine wave)
        this.drawIdleAnimation(width, height);
      }
    }
  
    private drawIdleAnimation(width: number, height: number): void {
      const time = Date.now() * 0.001;
      const centerY = height / 2;
      
      const r = Math.floor(this.colors.red * 255);
      const g = Math.floor(this.colors.green * 255);
      const b = Math.floor(this.colors.blue * 255);
      
      this.ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      
      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * 0.01 + time) * 30;
        if (x === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      this.ctx.stroke();
    }
  
    destroy(): void {
      this.stop();
      
      if (this.audioContext) {
        this.audioContext.close().catch(err => 
          console.error('Error closing audio context:', err)
        );
        this.audioContext = null;
      }
      
      if (this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
      }
    }
  
    // Method to check if visualizer is ready
    isReady(): boolean {
      return this.canvas !== null && this.ctx !== null;
    }
  
    // Get current visualizer state
    getState(): {
      isPlaying: boolean;
      hasAudioInput: boolean;
      colors: ColorConfig;
    } {
      return {
        isPlaying: this.isPlaying,
        hasAudioInput: this.analyser !== null,
        colors: { ...this.colors }
      };
    }
  }