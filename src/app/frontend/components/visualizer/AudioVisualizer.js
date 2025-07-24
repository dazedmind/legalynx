import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';

export class AudioVisualizer {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      width: options.width || container.clientWidth || window.innerWidth,
      height: options.height || container.clientHeight || window.innerHeight,
      enableGUI: options.enableGUI || false,
      colors: options.colors || { red: 1.0, green: 1.0, blue: 1.0 },
      bloom: { threshold: 0.1, strength: 0.4, radius: 0.1 },
      wireframe: options.wireframe !== undefined ? options.wireframe : true,
      mouseInteraction: options.mouseInteraction !== undefined ? options.mouseInteraction : true,
      ...options
    };
    
    this.isPlaying = false;
    this.animationId = null;
    this.mouseX = 0;
    this.mouseY = 0;
    
    this.init();
  }

  init() {
    this.createRenderer();
    this.createScene();
    this.createCamera();
    this.createPostProcessing();
    this.createMaterial();
    this.createGeometry();
    this.setupAudio();
    this.setupEventListeners();
    
    if (this.options.enableGUI) {
      this.createSimpleGUI();
    }
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.options.width, this.options.height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);
  }

  createScene() {
    this.scene = new THREE.Scene();
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.options.width / this.options.height,
      0.1,
      1000
    );
    this.camera.position.set(0, -2, 14);
    this.camera.lookAt(0, 0, 0);
  }

  createPostProcessing() {
    const renderScene = new RenderPass(this.scene, this.camera);
    
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.options.width, this.options.height)
    );
    this.bloomPass.threshold = this.options.bloom.threshold;
    this.bloomPass.strength = this.options.bloom.strength;
    this.bloomPass.radius = this.options.bloom.radius;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());
  }

  createMaterial() {
    this.uniforms = {
      u_time: { type: 'f', value: 0.0 },
      u_frequency: { type: 'f', value: 0.0 },
      u_red: { type: 'f', value: this.options.colors.red },
      u_green: { type: 'f', value: this.options.colors.green },
      u_blue: { type: 'f', value: this.options.colors.blue }
    };

    const vertexShader = `
      uniform float u_time;
      
      vec3 mod289(vec3 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
      
      vec4 mod289(vec4 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
      
      vec4 permute(vec4 x) {
        return mod289(((x*34.0)+10.0)*x);
      }
      
      vec4 taylorInvSqrt(vec4 x) {
        return 1.79284291400159 - 0.85373472095314 * x;
      }
      
      vec3 fade(vec3 t) {
        return t*t*t*(t*(t*6.0-15.0)+10.0);
      }

      float pnoise(vec3 P, vec3 rep) {
        vec3 Pi0 = mod(floor(P), rep);
        vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
        Pi0 = mod289(Pi0);
        Pi1 = mod289(Pi1);
        vec3 Pf0 = fract(P);
        vec3 Pf1 = Pf0 - vec3(1.0);
        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
        vec4 iy = vec4(Pi0.yy, Pi1.yy);
        vec4 iz0 = Pi0.zzzz;
        vec4 iz1 = Pi1.zzzz;

        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);

        vec4 gx0 = ixy0 * (1.0 / 7.0);
        vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);

        vec4 gx1 = ixy1 * (1.0 / 7.0);
        vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);

        vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
        vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
        vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
        vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
        vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
        vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
        vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
        vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

        vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
        g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
        vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
        g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;

        float n000 = dot(g000, Pf0);
        float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
        float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
        float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
        float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
        float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
        float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
        float n111 = dot(g111, Pf1);

        vec3 fade_xyz = fade(Pf0);
        vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
        vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
        float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
        return 2.2 * n_xyz;
      }

      uniform float u_frequency;

      void main() {
        float noise = 3.0 * pnoise(position + u_time, vec3(10.0));
        float displacement = (u_frequency / 30.0) * (noise / 10.0);
        vec3 newPosition = position + normal * displacement;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_red;
      uniform float u_blue;
      uniform float u_green;
      void main() {
        gl_FragColor = vec4(vec3(u_red, u_green, u_blue), 1.0);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      wireframe: this.options.wireframe
    });
  }

  createGeometry() {
    this.geometry = new THREE.IcosahedronGeometry(4, 30);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  setupAudio() {
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);
    this.sound = new THREE.Audio(this.listener);
    this.analyser = new THREE.AudioAnalyser(this.sound, 32);
    this.clock = new THREE.Clock();
  }

  setupEventListeners() {
    if (this.options.mouseInteraction) {
      this.mouseMoveHandler = (e) => {
        const rect = this.container.getBoundingClientRect();
        const windowHalfX = this.options.width / 2;
        const windowHalfY = this.options.height / 2;
        this.mouseX = ((e.clientX - rect.left) - windowHalfX) / 100;
        this.mouseY = ((e.clientY - rect.top) - windowHalfY) / 100;
      };
      this.container.addEventListener('mousemove', this.mouseMoveHandler);
    }

    this.resizeHandler = () => this.handleResize();
    window.addEventListener('resize', this.resizeHandler);
  }

  // Connect to audio stream (for chatbot voice)
  connectAudioSource(audioSource) {
    if (this.sound && audioSource) {
      this.sound.setNodeSource(audioSource);
      return true;
    }
    return false;
  }

  // Connect to media stream (for microphone)
  connectMediaStream(stream) {
    if (this.sound && stream) {
      const audioContext = this.listener.context;
      const source = audioContext.createMediaStreamSource(stream);
      this.sound.setNodeSource(source);
      return true;
    }
    return false;
  }

  // Load audio file
  loadAudio(audioPath) {
    return new Promise((resolve, reject) => {
      const audioLoader = new THREE.AudioLoader();
      audioLoader.load(audioPath, 
        (buffer) => {
          this.sound.setBuffer(buffer);
          resolve(buffer);
        },
        undefined,
        reject
      );
    });
  }

  start() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.animate();
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  animate() {
    if (!this.isPlaying) return;

    if (this.options.mouseInteraction) {
      this.camera.position.x += (this.mouseX - this.camera.position.x) * 0.05;
      this.camera.position.y += (-this.mouseY - this.camera.position.y) * 0.05;
      this.camera.lookAt(this.scene.position);
    }

    this.uniforms.u_time.value = this.clock.getElapsedTime();
    this.uniforms.u_frequency.value = this.analyser.getAverageFrequency();
    
    this.composer.render();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  setColors(red, green, blue) {
    this.uniforms.u_red.value = red;
    this.uniforms.u_green.value = green;
    this.uniforms.u_blue.value = blue;
  }

  setBloom(threshold, strength, radius) {
    this.bloomPass.threshold = threshold;
    this.bloomPass.strength = strength;
    this.bloomPass.radius = radius;
  }

  handleResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  // Simple HTML-based GUI as replacement for dat.gui
  createSimpleGUI() {
    const guiContainer = document.createElement('div');
    guiContainer.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      padding: 15px;
      border-radius: 5px;
      color: white;
      font-family: monospace;
      font-size: 12px;
      min-width: 200px;
      z-index: 1000;
    `;

    // Colors section
    const colorsSection = document.createElement('div');
    colorsSection.innerHTML = '<h4 style="margin: 0 0 10px 0;">Colors</h4>';
    
    ['red', 'green', 'blue'].forEach(color => {
      const label = document.createElement('label');
      label.style.cssText = 'display: block; margin-bottom: 8px;';
      label.innerHTML = `${color.charAt(0).toUpperCase() + color.slice(1)}: `;
      
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '1';
      slider.step = '0.01';
      slider.value = this.options.colors[color];
      slider.style.cssText = 'width: 100px; margin-left: 5px;';
      
      slider.addEventListener('input', (e) => {
        this.options.colors[color] = parseFloat(e.target.value);
        this.uniforms[`u_${color}`].value = parseFloat(e.target.value);
      });
      
      label.appendChild(slider);
      colorsSection.appendChild(label);
    });

    guiContainer.appendChild(colorsSection);
    
    // Make sure the container is positioned relative for absolute positioning
    if (getComputedStyle(this.container).position === 'static') {
      this.container.style.position = 'relative';
    }
    
    this.container.appendChild(guiContainer);
    this.guiContainer = guiContainer;
  }

  destroy() {
    this.stop();
    
    // Clean up event listeners
    if (this.mouseMoveHandler) {
      this.container.removeEventListener('mousemove', this.mouseMoveHandler);
    }
    window.removeEventListener('resize', this.resizeHandler);
    
    // Clean up Three.js objects
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.geometry.dispose();
      this.material.dispose();
    }
    
    if (this.renderer) {
      this.renderer.dispose();
      if (this.container.contains(this.renderer.domElement)) {
        this.container.removeChild(this.renderer.domElement);
      }
    }
    
    // Clean up simple GUI
    if (this.guiContainer && this.container.contains(this.guiContainer)) {
      this.container.removeChild(this.guiContainer);
    }
  }
}