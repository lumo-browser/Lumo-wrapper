import { useEffect, useRef } from 'react';

export function JapanCherryBlossomTheme() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let animationFrameId: number;

    const settings = {
      bgColor: "transparent", 
      minWind: 1,
      maxWind: 10,
      minSize: 14,
      maxSize: 38,
      emitterY: 0.15,
      emitterSpread: 0.85,
      gravity: 0.6,
      turbulence: 0.8,
      rotationSpeed: 0,
      tumbleStrength: 0.4,
      staticTilt: 0,
      particleCount: 150,
      direction: -1
    };

    const cache = {
      minSize: 0, maxSize: 0, minWind: 0, maxWind: 0, tiltRad: 0
    };

    function updateCache() {
      cache.minSize = Math.min(settings.minSize, settings.maxSize);
      cache.maxSize = Math.max(settings.minSize, settings.maxSize);
      cache.minWind = Math.min(settings.minWind, settings.maxWind);
      cache.maxWind = Math.max(settings.minWind, settings.maxWind);
      cache.tiltRad = (settings.staticTilt * Math.PI) / 180;
    }

    function createDefaultImage() {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = 128;
      tempCanvas.height = 128;
      const tCtx = tempCanvas.getContext("2d");
      if (!tCtx) return new Image();

      tCtx.scale(2, 2);
      tCtx.beginPath();
      tCtx.moveTo(32, 5);
      tCtx.quadraticCurveTo(5, 32, 32, 59);
      tCtx.quadraticCurveTo(59, 32, 32, 5);

      tCtx.fillStyle = "#d66161";
      tCtx.fill();

      tCtx.strokeStyle = "#F20404";
      tCtx.lineWidth = 2;
      tCtx.stroke();

      tCtx.beginPath();
      tCtx.moveTo(32, 5);
      tCtx.lineTo(32, 59);
      tCtx.stroke();

      const img = new Image();
      img.src = tempCanvas.toDataURL();
      return img;
    }

    const particleImage = createDefaultImage();

    function rotateVector(x: number, y: number, z: number, ax: number, ay: number, az: number) {
      let cos = Math.cos(az);
      let sin = Math.sin(az);
      const x1 = x * cos - y * sin;
      const y1 = x * sin + y * cos;
      const z1 = z;

      cos = Math.cos(ay);
      sin = Math.sin(ay);
      const x2 = x1 * cos + z1 * sin;
      const y2 = y1;
      const z2 = -x1 * sin + z1 * cos;

      cos = Math.cos(ax);
      sin = Math.sin(ax);
      return {
        x: x2,
        y: y2 * cos - z2 * sin,
        z: y2 * sin + z2 * cos
      };
    }

    class Particle {
      image: HTMLImageElement;
      width: number;
      height: number;
      x: number;
      y: number;
      windFactor: number;
      vx: number;
      vy: number;
      waveOffset: number;
      angleZ: number;
      spinZ: number;
      angleX: number;
      angleY: number;
      spinX: number;
      spinY: number;

      constructor(initOnScreen = false) {
        this.image = particleImage;
        this.width = 0;
        this.height = 0;
        this.x = 0;
        this.y = 0;
        this.windFactor = 0;
        this.vx = 0;
        this.vy = 0;
        this.waveOffset = 0;
        this.angleZ = 0;
        this.spinZ = 0;
        this.angleX = 0;
        this.angleY = 0;
        this.spinX = 0;
        this.spinY = 0;
        this.reset(initOnScreen);
      }

      reset(initOnScreen = false) {
        this.image = particleImage;
        this.width = cache.minSize + Math.random() * (cache.maxSize - cache.minSize);
        this.height = this.width;

        const centerY = height * settings.emitterY;
        const spreadHeight = height * settings.emitterSpread;
        const minY = centerY - spreadHeight / 2;
        const maxY = centerY + spreadHeight / 2;

        this.y = minY + Math.random() * (maxY - minY);

        if (initOnScreen) {
          this.x = Math.random() * width;
        } else {
          this.x = settings.direction === -1
              ? width + this.width + Math.random() * width
              : -this.width - Math.random() * width;
        }

        const sizeFactor = (this.width - cache.minSize) / (cache.maxSize - cache.minSize || 1);
        this.windFactor = 1 - (sizeFactor * 0.5 + Math.random() * 0.5);
        this.windFactor = Math.max(0.1, Math.min(1, this.windFactor));

        this.vx = 0;
        this.vy = 0;
        this.waveOffset = Math.random() * Math.PI * 2;
        this.angleZ = Math.random() * Math.PI * 2;
        this.spinZ = (Math.random() - 0.5) * settings.rotationSpeed;
        this.angleX = 0;
        this.angleY = 0;
        this.spinX = (Math.random() - 0.5) * 0.1;
        this.spinY = (Math.random() - 0.5) * 0.1;
      }

      update() {
        const targetSpeed = cache.minWind + (cache.maxWind - cache.minWind) * this.windFactor;
        this.vx += (targetSpeed - this.vx) * 0.1;
        this.x += this.vx * settings.direction;

        const gravityMod = 1.5 - this.windFactor;
        this.vy += settings.gravity * 0.05 * gravityMod;

        const wave = Math.sin(this.x * 0.01 * settings.direction + this.waveOffset);
        this.vy += wave * settings.turbulence * 0.05;
        this.vy *= 0.98;
        this.y += this.vy;
        this.angleZ += this.spinZ + this.vx * 0.002;

        if (settings.tumbleStrength > 0) {
          this.angleX += this.spinX * settings.tumbleStrength;
          this.angleY += this.spinY * settings.tumbleStrength;
        }

        const buffer = 200;
        const outByX = settings.direction === -1 ? this.x < -buffer : this.x > width + buffer;

        if (outByX || this.y > height + buffer || this.y < -buffer) {
          this.reset(false);
        }
      }

      draw() {
        const vecU = rotateVector(1, 0, 0, this.angleX, this.angleY + cache.tiltRad, this.angleZ);
        const vecV = rotateVector(0, 1, 0, this.angleX, this.angleY + cache.tiltRad, this.angleZ);

        ctx!.save();
        ctx!.translate(this.x, this.y);
        ctx!.transform(vecU.x, vecU.y, vecV.x, vecV.y, 0, 0);
        ctx!.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx!.restore();
      }
    }

    function resize() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      ctx!.imageSmoothingEnabled = true;
      (ctx as any).imageSmoothingQuality = "high";
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < settings.particleCount; i++) {
        const particle = new Particle(true); // init on screen
        particles.push(particle);
      }
    }

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      for (const particle of particles) {
        particle.update();
        particle.draw();
      }
      animationFrameId = requestAnimationFrame(animate);
    }

    updateCache();
    resize();
    initParticles();
    animate();

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" style={{ backgroundColor: '#ffffff' }}>
      <div className="lumo-theme-haiku" lang="jp">
        花は散り<br/>
        名を覚えている<br/>
        風ばかり
      </div>

      <img className="lumo-theme-person" src="https://raw.githubusercontent.com/BlackStar1991/Pictures-for-sharing-/master/Japan/person.png" alt="man" />

      <div className="lumo-theme-block">
        <img className="lumo-theme-girl" src="https://raw.githubusercontent.com/BlackStar1991/Pictures-for-sharing-/master/Japan/girl.png" alt="girl" />
        <img src="https://raw.githubusercontent.com/BlackStar1991/Pictures-for-sharing-/master/Japan/bg.png" alt="roof" className="lumo-theme-roof" />
      </div>

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}></canvas>

      <style>{`
        .lumo-theme-person {
          position: absolute;
          right: 45%;
          bottom: 0;
          height: 50vh;
          object-fit: contain;
          z-index: 2;
          user-select: none;
        }

        .lumo-theme-block {
          height: 100%;
          position: absolute;
          width: 50%;
          right: 0;
          z-index: 2;
          display: flex;
          flex-direction: row;
          justify-content: flex-end;
          align-items: flex-end;
        }

        .lumo-theme-roof {
          display: block;
          align-self: flex-start;
          height: 60vh;
          width: auto;
          object-fit: contain;
          user-select: none;
        }

        .lumo-theme-girl {
          position: absolute;
          left: 30%;
          display: block;
          height: 70vh;
          width: auto;
          object-fit: contain;
          margin-right: 20px;
          user-select: none;
        }

        .lumo-theme-haiku {
          position: absolute;
          top: 5dvh;
          left: 80px;
          writing-mode: vertical-rl;
          text-orientation: mixed;
          font-family: "Yu Mincho", "Hiragino Mincho ProN", "MS Mincho", serif;
          font-size: 32px;
          line-height: 2.2;
          color: #111;
          letter-spacing: 0.08em;
          filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.15));
          font-weight: 500;
          user-select: none;
          z-index: 3;
        }
      `}</style>
    </div>
  );
}
