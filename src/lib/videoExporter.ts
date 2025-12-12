// Video export utility using Canvas and MediaRecorder API

export interface VideoExportOptions {
  width: number;
  height: number;
  fps: number;
  duration: number;
  audioFile: File;
}

export class VideoExporter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrame: number | null = null;
  private isRecording = false;

  constructor(width = 1920, height = 1080) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d')!;
  }

  async exportVideo(
    options: VideoExportOptions,
    drawFrame: (ctx: CanvasRenderingContext2D, audioData: Uint8Array, time: number) => void,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const { audioFile, duration, fps } = options;

    // Setup audio context and analyser
    this.audioContext = new AudioContext();
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    // Create media stream from canvas
    const stream = this.canvas.captureStream(fps);
    
    // Add audio track
    const audioDestination = this.audioContext.createMediaStreamDestination();
    source.connect(audioDestination);
    audioDestination.stream.getAudioTracks().forEach(track => {
      stream.addTrack(track);
    });

    // Setup MediaRecorder
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';
    
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8000000,
    });

    this.chunks = [];
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.analyser || !this.audioContext) {
        reject(new Error('Failed to initialize recorder'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'video/webm' });
        this.cleanup();
        resolve(blob);
      };

      this.mediaRecorder.onerror = (e) => {
        this.cleanup();
        reject(e);
      };

      // Start recording
      this.isRecording = true;
      this.mediaRecorder.start(100);
      source.start();

      const startTime = performance.now();
      const totalDuration = Math.min(duration, audioBuffer.duration) * 1000;
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const render = () => {
        if (!this.isRecording || !this.analyser) return;

        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);
        
        if (onProgress) {
          onProgress(progress);
        }

        this.analyser.getByteFrequencyData(dataArray);
        drawFrame(this.ctx, dataArray, elapsed / 1000);

        if (elapsed < totalDuration) {
          this.animationFrame = requestAnimationFrame(render);
        } else {
          this.isRecording = false;
          source.stop();
          this.mediaRecorder?.stop();
        }
      };

      render();
    });
  }

  private cleanup() {
    this.isRecording = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.mediaRecorder = null;
    this.analyser = null;
    this.audioContext = null;
  }

  cancel() {
    this.isRecording = false;
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }
}

// Draw functions for different visualizer styles
export interface TextOverlaySettings {
  text: string;
  font: string;
  fontSize: number;
  color: string;
  position: "top" | "center" | "bottom";
  alignment: "left" | "center" | "right";
  shadowColor: string;
  shadowBlur: number;
  visible: boolean;
}

export const drawVisualizerFrame = (
  ctx: CanvasRenderingContext2D,
  audioData: Uint8Array,
  time: number,
  settings: {
    background: string | HTMLImageElement | null;
    barStyle: string;
    colorScheme: string[];
    showParticles: boolean;
    showRings: boolean;
    mirrorBars: boolean;
    rotatingDisc: boolean;
    title: string;
    artist: string;
    particleIntensity: number;
    glowIntensity: number;
    titleOverlay?: TextOverlaySettings;
    artistOverlay?: TextOverlaySettings;
    comicCenterImage?: HTMLImageElement | null;
    comicImageAnimation?: "spin" | "scroll";
  },
  particles: { x: number; y: number; vx: number; vy: number; size: number; color: string; life: number }[]
) => {
  const { width, height } = ctx.canvas;
  const centerX = width / 2;
  const centerY = height / 2;

  // Clear and draw background
  ctx.clearRect(0, 0, width, height);
  
  if (settings.background instanceof HTMLImageElement) {
    ctx.drawImage(settings.background, 0, 0, width, height);
  } else if (typeof settings.background === 'string') {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(0.5, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
  }

  // Calculate audio levels
  const bass = Array.from(audioData.slice(0, 8)).reduce((a, b) => a + b, 0) / (8 * 255);
  const mid = Array.from(audioData.slice(8, 20)).reduce((a, b) => a + b, 0) / (12 * 255);
  const high = Array.from(audioData.slice(20)).reduce((a, b) => a + b, 0) / (audioData.length - 20) / 255;

  // Draw grid
  ctx.strokeStyle = `rgba(0, 255, 255, 0.05)`;
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Update and draw particles
  if (settings.showParticles) {
    // Spawn new particles on bass hits
    if (bass > 0.5 && particles.length < 100) {
      for (let i = 0; i < Math.floor(bass * settings.particleIntensity / 10); i++) {
        particles.push({
          x: Math.random() * width,
          y: height * 0.8 + Math.random() * height * 0.2,
          vx: (Math.random() - 0.5) * 4,
          vy: -2 - Math.random() * 6 * bass,
          size: 2 + Math.random() * 6,
          color: settings.colorScheme[Math.floor(Math.random() * settings.colorScheme.length)],
          life: 1,
        });
      }
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.015;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace(')', `, ${p.life})`).replace('hsl', 'hsla');
      ctx.fill();
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.size * 2;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // Draw rings
  if (settings.showRings) {
    for (let i = 0; i < 3; i++) {
      const radius = 120 + i * 30 + bass * 20;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 - i * 0.1})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = 'cyan';
      ctx.shadowBlur = settings.glowIntensity / 5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  // Draw center disc (skip for comic style which has its own center)
  if (settings.rotatingDisc && settings.barStyle !== 'comic') {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(time * 0.5);
    
    const gradient = ctx.createConicGradient(0, 0, 0);
    gradient.addColorStop(0, settings.colorScheme[0]);
    gradient.addColorStop(0.33, settings.colorScheme[1] || settings.colorScheme[0]);
    gradient.addColorStop(0.66, settings.colorScheme[2] || settings.colorScheme[0]);
    gradient.addColorStop(1, settings.colorScheme[0]);
    
    ctx.beginPath();
    ctx.arc(0, 0, 90 + bass * 10, 0, Math.PI * 2);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(0, 0, 85 + bass * 10, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    
    ctx.restore();
  }

  // Draw bars based on style
  if (settings.barStyle === 'comic') {
    // Comic style - no bars, draw rotating image/comic book center with smooth beat-reactive motion
    const baseRotation = time * 0.3; // Smooth base rotation
    const bassRotationBoost = bass * 1.5; // Extra rotation on bass
    const rotation = baseRotation + (bassRotationBoost * Math.sin(time * 2)); // Smooth interpolation
    const circleRadius = 120 + bass * 25;
    
    // Draw glow rings around center - pulse on bass
    for (let i = 0; i < 3; i++) {
      const radius = circleRadius + 20 + i * 40 + bass * 15;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = settings.colorScheme[i % settings.colorScheme.length].replace(')', `, ${0.4 - i * 0.1 + bass * 0.3})`).replace('hsl', 'hsla');
      ctx.lineWidth = 3;
      ctx.shadowColor = settings.colorScheme[i % settings.colorScheme.length];
      ctx.shadowBlur = 20 + bass * 30;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    // Draw comic circle with rotating/scrolling content
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
    ctx.clip();
    
    // Custom image with animation based on setting
    if (settings.comicCenterImage) {
      const imgHeight = settings.comicCenterImage.height;
      const imgWidth = settings.comicCenterImage.width;
      const drawScale = Math.max((circleRadius * 3) / imgWidth, (circleRadius * 3) / imgHeight);
      const scaledWidth = imgWidth * drawScale;
      const scaledHeight = imgHeight * drawScale;
      
      if (settings.comicImageAnimation === "spin") {
        // Spin animation (original behavior)
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        const scale = 1 + bass * 0.1;
        ctx.scale(scale, scale);
        
        ctx.drawImage(
          settings.comicCenterImage,
          -scaledWidth / 2,
          -scaledHeight / 2,
          scaledWidth,
          scaledHeight
        );
      } else {
        // Scroll animation (new behavior)
        const baseSpeed = 80;
        const bassBoost = bass * 300;
        const scrollOffset = (time * (baseSpeed + bassBoost)) % scaledHeight;
        const scale = 1 + bass * 0.05;
        
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        
        // Draw tiled for seamless scrolling
        const startY = -scrollOffset;
        for (let y = startY - scaledHeight; y < circleRadius * 2; y += scaledHeight) {
          ctx.drawImage(
            settings.comicCenterImage,
            -scaledWidth / 2,
            y - circleRadius,
            scaledWidth,
            scaledHeight
          );
        }
      }
    } else {
      // Default comic panels with scroll animation
      const baseSpeed = 60;
      const bassBoost = bass * 200;
      const comicOffset = (time * (baseSpeed + bassBoost)) % 2000;
      
      // White background for comic panels
      ctx.fillStyle = '#fff';
      ctx.fillRect(centerX - circleRadius, centerY - circleRadius, circleRadius * 2, circleRadius * 2);
    
      // Draw scrolling comic panels - 8 different styles
    for (let i = 0; i < 30; i++) {
      const panelY = centerY - circleRadius + ((i * 70 - comicOffset) % 2100) - 500;
      const panelType = i % 8;
      
      // Panel background color varies by type
      if (panelType === 5) {
        ctx.fillStyle = '#FFE135'; // Pop art yellow
      } else if (panelType === 6) {
        ctx.fillStyle = '#FF6B6B'; // Superhero red
      } else {
        ctx.fillStyle = '#fff';
      }
      ctx.fillRect(centerX - circleRadius + 10, panelY, circleRadius * 2 - 20, 60);
      
      // Panel border
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeRect(centerX - circleRadius + 10, panelY, circleRadius * 2 - 20, 60);
      
      // Panel content based on type
      ctx.fillStyle = '#000';
      ctx.strokeStyle = '#000';
      
      if (panelType === 0) {
        // Speed lines radiating from center
        ctx.lineWidth = 2;
        for (let j = 0; j < 14; j++) {
          ctx.beginPath();
          ctx.moveTo(centerX - circleRadius + 20 + j * 16, panelY + 5);
          ctx.lineTo(centerX, panelY + 30);
          ctx.stroke();
        }
      } else if (panelType === 1) {
        // Burst/explosion pattern
        ctx.lineWidth = 3;
        for (let j = 0; j < 12; j++) {
          const angle = (j / 12) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(centerX, panelY + 30);
          ctx.lineTo(centerX + Math.cos(angle) * 100, panelY + 30 + Math.sin(angle) * 25);
          ctx.stroke();
        }
      } else if (panelType === 2) {
        // Halftone dot pattern
        for (let row = 0; row < 6; row++) {
          for (let col = 0; col < 12; col++) {
            ctx.beginPath();
            ctx.arc(
              centerX - circleRadius + 30 + col * 18,
              panelY + 10 + row * 9,
              2 + (row % 2) + ((col + row) % 2),
              0, Math.PI * 2
            );
            ctx.fill();
          }
        }
      } else if (panelType === 3) {
        // Dramatic diagonal lines
        ctx.lineWidth = 2;
        for (let j = 0; j < 14; j++) {
          ctx.beginPath();
          ctx.moveTo(centerX - circleRadius + 10 + j * 18, panelY + 5);
          ctx.lineTo(centerX - circleRadius + 45 + j * 18, panelY + 55);
          ctx.stroke();
        }
      } else if (panelType === 4) {
        // Manga screentone
        ctx.lineWidth = 1;
        for (let row = 0; row < 10; row++) {
          for (let col = 0; col < 24; col++) {
            ctx.beginPath();
            ctx.moveTo(centerX - circleRadius + 15 + col * 9, panelY + 6 + row * 5);
            ctx.lineTo(centerX - circleRadius + 19 + col * 9, panelY + 6 + row * 5);
            ctx.stroke();
          }
        }
      } else if (panelType === 5) {
        // Pop art style (yellow bg with pink dots)
        ctx.fillStyle = '#FF1493';
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 9; col++) {
            ctx.beginPath();
            ctx.arc(
              centerX - circleRadius + 30 + col * 25,
              panelY + 12 + row * 11,
              5,
              0, Math.PI * 2
            );
            ctx.fill();
          }
        }
      } else if (panelType === 6) {
        // Superhero action (red bg with white burst)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        for (let j = 0; j < 16; j++) {
          const angle = (j / 16) * Math.PI * 2;
          const length = 70 + (j % 2) * 40;
          ctx.beginPath();
          ctx.moveTo(centerX, panelY + 30);
          ctx.lineTo(centerX + Math.cos(angle) * length, panelY + 30 + Math.sin(angle) * (length * 0.3));
          ctx.stroke();
        }
      } else {
        // Cross-hatch pattern
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000';
        for (let j = 0; j < 12; j++) {
          ctx.beginPath();
          ctx.moveTo(centerX - circleRadius + 10 + j * 20, panelY + 5);
          ctx.lineTo(centerX - circleRadius + 40 + j * 20, panelY + 55);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(centerX - circleRadius + 40 + j * 20, panelY + 5);
          ctx.lineTo(centerX - circleRadius + 10 + j * 20, panelY + 55);
          ctx.stroke();
        }
      }
    }
    }
    
    ctx.restore();
    
    // Draw circle border with bass-reactive glow
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
    ctx.strokeStyle = settings.colorScheme[0];
    ctx.lineWidth = 5;
    ctx.shadowColor = settings.colorScheme[0];
    ctx.shadowBlur = 30 + bass * 40;
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else {
    // Regular bar styles
    const barCount = 64;
    const barWidth = settings.barStyle === 'dots' ? 8 : (width * 0.6) / barCount;
    const maxBarHeight = height * 0.3;
    const startX = (width - barCount * barWidth) / 2;

    ctx.shadowColor = settings.colorScheme[0];
    ctx.shadowBlur = settings.glowIntensity / 3;

    switch (settings.barStyle) {
      case 'circular':
        // Circular waveform
        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
          const value = audioData[Math.floor(i * audioData.length / barCount)] / 255;
          const innerRadius = 100 + bass * 20;
          const outerRadius = innerRadius + value * 100;
          
          const x1 = centerX + Math.cos(angle) * innerRadius;
          const y1 = centerY + Math.sin(angle) * innerRadius;
          const x2 = centerX + Math.cos(angle) * outerRadius;
          const y2 = centerY + Math.sin(angle) * outerRadius;
          
          const colorIndex = Math.floor((i / barCount) * settings.colorScheme.length);
          ctx.strokeStyle = settings.colorScheme[colorIndex % settings.colorScheme.length];
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        break;

      case 'radial':
        // Radial bars from center
        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2;
          const value = audioData[Math.floor(i * audioData.length / barCount)] / 255;
          const length = value * 150;
          
          const x1 = centerX;
          const y1 = centerY;
          const x2 = centerX + Math.cos(angle) * (50 + length);
          const y2 = centerY + Math.sin(angle) * (50 + length);
          
          const colorIndex = Math.floor((i / barCount) * settings.colorScheme.length);
          ctx.strokeStyle = settings.colorScheme[colorIndex % settings.colorScheme.length];
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        break;

      case 'wave':
        // Wave pattern
        ctx.beginPath();
        ctx.moveTo(startX, height * 0.7);
        for (let i = 0; i < barCount; i++) {
          const x = startX + i * barWidth * 1.5;
          const value = audioData[Math.floor(i * audioData.length / barCount)] / 255;
          const y = height * 0.7 - value * maxBarHeight;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        const gradient = ctx.createLinearGradient(0, height * 0.4, 0, height * 0.7);
        gradient.addColorStop(0, settings.colorScheme[0]);
        gradient.addColorStop(0.5, settings.colorScheme[1] || settings.colorScheme[0]);
        gradient.addColorStop(1, settings.colorScheme[2] || settings.colorScheme[0]);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Fill below wave
        ctx.lineTo(startX + (barCount - 1) * barWidth * 1.5, height * 0.7);
        ctx.lineTo(startX, height * 0.7);
        ctx.closePath();
        const fillGradient = ctx.createLinearGradient(0, height * 0.4, 0, height * 0.7);
        fillGradient.addColorStop(0, settings.colorScheme[0].replace(')', ', 0.3)').replace('hsl', 'hsla'));
        fillGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = fillGradient;
        ctx.fill();
        break;

      case 'dots':
        // Dot pattern
        for (let i = 0; i < barCount; i++) {
          const x = startX + i * (barWidth + 4);
          const value = audioData[Math.floor(i * audioData.length / barCount)] / 255;
          const dotCount = Math.floor(value * 10) + 1;
          
          for (let j = 0; j < dotCount; j++) {
            const y = height * 0.8 - j * 12;
            const colorIndex = Math.floor((i / barCount) * settings.colorScheme.length);
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = settings.colorScheme[colorIndex % settings.colorScheme.length];
            ctx.fill();
          }
        }
        break;

      case 'blocks':
        // Block style
        for (let i = 0; i < barCount; i++) {
          const value = audioData[Math.floor(i * audioData.length / barCount)] / 255;
          const barHeight = value * maxBarHeight;
          const x = startX + i * barWidth;
          const y = height * 0.8 - barHeight;
          
          const colorIndex = Math.floor((i / barCount) * settings.colorScheme.length);
          ctx.fillStyle = settings.colorScheme[colorIndex % settings.colorScheme.length];
          ctx.fillRect(x, y, barWidth - 2, barHeight);
        }
        
        if (settings.mirrorBars) {
          ctx.globalAlpha = 0.4;
          for (let i = 0; i < barCount; i++) {
            const value = audioData[Math.floor(i * audioData.length / barCount)] / 255;
            const barHeight = value * maxBarHeight * 0.4;
            const x = startX + i * barWidth;
            
            const colorIndex = Math.floor((i / barCount) * settings.colorScheme.length);
            ctx.fillStyle = settings.colorScheme[colorIndex % settings.colorScheme.length];
            ctx.fillRect(x, height * 0.1, barWidth - 2, barHeight);
          }
          ctx.globalAlpha = 1;
        }
        break;

      case 'rounded':
      case 'classic':
      default:
        // Classic/rounded bars
        for (let i = 0; i < barCount; i++) {
          const value = audioData[Math.floor(i * audioData.length / barCount)] / 255;
          const barHeight = value * maxBarHeight;
          const x = startX + i * barWidth;
          const y = height * 0.8 - barHeight;
          
          const colorIndex = Math.floor((i / barCount) * settings.colorScheme.length);
          ctx.fillStyle = settings.colorScheme[colorIndex % settings.colorScheme.length];
          
          if (settings.barStyle === 'rounded') {
            const radius = barWidth / 2 - 1;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth - 2, barHeight, [radius, radius, 0, 0]);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, barWidth - 2, barHeight);
          }
        }
        
        if (settings.mirrorBars) {
          ctx.globalAlpha = 0.4;
          for (let i = 0; i < barCount; i++) {
            const value = audioData[Math.floor(i * audioData.length / barCount)] / 255;
            const barHeight = value * maxBarHeight * 0.4;
            const x = startX + i * barWidth;
            
            const colorIndex = Math.floor((i / barCount) * settings.colorScheme.length);
            ctx.fillStyle = settings.colorScheme[colorIndex % settings.colorScheme.length];
            
            if (settings.barStyle === 'rounded') {
              const radius = barWidth / 2 - 1;
              ctx.beginPath();
              ctx.roundRect(x, height * 0.1, barWidth - 2, barHeight, [0, 0, radius, radius]);
              ctx.fill();
            } else {
              ctx.fillRect(x, height * 0.1, barWidth - 2, barHeight);
            }
          }
          ctx.globalAlpha = 1;
        }
        break;
    }

    ctx.shadowBlur = 0;
  }

  // Draw title with custom overlay settings
  const titleSettings = settings.titleOverlay;
  const artistSettings = settings.artistOverlay;
  
  if (!titleSettings || titleSettings.visible !== false) {
    const titleFont = titleSettings?.font || 'Orbitron';
    const titleSize = titleSettings?.fontSize || 48;
    const titleColor = titleSettings?.color || '#fff';
    const titleShadowColor = titleSettings?.shadowColor || settings.colorScheme[0];
    const titleShadowBlur = titleSettings?.shadowBlur ?? settings.glowIntensity / 2;
    const titleAlignment = titleSettings?.alignment || 'center';
    const titlePosition = titleSettings?.position || 'bottom';
    
    ctx.font = `bold ${titleSize}px ${titleFont}, sans-serif`;
    ctx.fillStyle = titleColor;
    ctx.textAlign = titleAlignment;
    ctx.shadowColor = titleShadowColor;
    ctx.shadowBlur = titleShadowBlur;
    
    let titleX = centerX;
    let titleY = height * 0.88;
    
    if (titleAlignment === 'left') titleX = width * 0.05;
    else if (titleAlignment === 'right') titleX = width * 0.95;
    
    if (titlePosition === 'top') titleY = height * 0.1;
    else if (titlePosition === 'center') titleY = height * 0.5;
    
    ctx.fillText(settings.title, titleX, titleY);
    ctx.shadowBlur = 0;
  }

  if (!artistSettings || artistSettings.visible !== false) {
    const artistFont = artistSettings?.font || 'Inter';
    const artistSize = artistSettings?.fontSize || 24;
    const artistColor = artistSettings?.color || 'rgba(255, 255, 255, 0.6)';
    const artistAlignment = artistSettings?.alignment || 'center';
    const artistPosition = artistSettings?.position || 'bottom';
    
    ctx.font = `${artistSize}px ${artistFont}, sans-serif`;
    ctx.fillStyle = artistColor;
    ctx.textAlign = artistAlignment;
    
    let artistX = centerX;
    let artistY = height * 0.92;
    
    if (artistAlignment === 'left') artistX = width * 0.05;
    else if (artistAlignment === 'right') artistX = width * 0.95;
    
    if (artistPosition === 'top') artistY = height * 0.14;
    else if (artistPosition === 'center') artistY = height * 0.55;
    
    ctx.fillText(settings.artist, artistX, artistY);
  }

  // Corner decorations
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.moveTo(20, 50);
  ctx.lineTo(20, 20);
  ctx.lineTo(50, 20);
  ctx.stroke();
  
  ctx.strokeStyle = 'rgba(160, 100, 255, 0.5)';
  ctx.beginPath();
  ctx.moveTo(width - 20, 50);
  ctx.lineTo(width - 20, 20);
  ctx.lineTo(width - 50, 20);
  ctx.stroke();
};
