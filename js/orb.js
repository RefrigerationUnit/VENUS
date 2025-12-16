/* /js/orb.js
 * Apple-Watch-style particle sphere for header, expandable to fullscreen.
 * Drop the <div id="orb-sphere" class="orb-container"></div> into your header,
 * include this file, and you're done.
 */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// ====== PARAMETERS you will probably tweak ======
const PARAMS = {
  PARTICLE_COUNT: 1600,       // number of dots
  RADIUS: 1.0,                // world units (we scale to fit container)
  DOT_SIZE: 9.5,              // pixel-ish size in header; scales in fullscreen
  ROTATION_Y: 0.18,           // radians/sec (overall spin)
  ROTATION_X: 0.06,

  // Subtle “breathing/jitter” along normals
  JITTER_AMPLITUDE: 0.045,    // in world units
  JITTER_SPEED: 0.9,          // multiplier

  // Colors (vec3). These are multiplied by dot alpha in shader.
  COLOR: new THREE.Color(0.78, 0.86, 1.00),  // soft blue-white
  GLOW:  new THREE.Color(0.25, 0.55, 1.00),  // contributes to falloff tint

  // When fullscreen we can make dots a little larger for drama:
  DOT_SIZE_FULLSCREEN: 13.5
};

// ====== Utilities ======

// Fibonacci sphere distribution for even-ish coverage
function fibonacciSphere(count, radius){
  const pts = [];
  const offset = 2 / count;
  const inc = Math.PI * (3 - Math.sqrt(5)); // golden angle
  for (let i = 0; i < count; i++){
    const y = i * offset - 1 + (offset / 2);
    const r = Math.sqrt(Math.max(0, 1 - y*y));
    const phi = i * inc;
    const x = Math.cos(phi) * r;
    const z = Math.sin(phi) * r;
    pts.push(new THREE.Vector3(x, y, z).multiplyScalar(radius));
  }
  return pts;
}

// ====== Shader (soft glowy round points) ======
const VERT = /* glsl */`
  attribute float seed;           // per-particle phase
  uniform float uTime;
  uniform float uRadius;
  uniform float uSize;            // base size in px
  uniform float uDeviceRatio;     // for crisp sizing on HiDPI

  varying float vAlpha;           // pass to fragment for glow mix

  void main(){
    vec3 pos = position;

    // subtle breathing along normal (pos normalized)
    float a = sin(uTime * ${PARAMS.JITTER_SPEED.toFixed(2)} + seed) * ${PARAMS.JITTER_AMPLITUDE.toFixed(3)};
    vec3 nrm = normalize(position);
    pos += nrm * a;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // size attenuation (bigger when closer)
    float dist = -mv.z;
    gl_PointSize = uSize * (uDeviceRatio) * (1.0 / max(0.6, dist));

    // alpha stronger for outward-facing points (a small trick)
    vAlpha = smoothstep(0.0, 1.0, dot(nrm, vec3(0.0, 0.0, 1.0)) * 0.5 + 0.5);
  }
`;

const FRAG = /* glsl */`
  precision highp float;
  uniform vec3 uColor;
  uniform vec3 uGlow;

  varying float vAlpha;

  void main(){
    // radial falloff inside the square sprite
    vec2 uv = gl_PointCoord * 2.0 - 1.0;     // -1..1
    float r2 = dot(uv, uv);                  // radius^2
    if (r2 > 1.0) discard;                   // keep it circular

    // soft disc with glow edge
    float core = smoothstep(1.0, 0.0, r2);               // 1 at center -> 0 at edge
    float glow = smoothstep(1.0, 0.0, r2*1.6) - core;    // ring outside core

    vec3 col = uColor * core + uGlow * glow;
    float alpha = (core * 0.95 + glow * 0.55) * vAlpha;

    gl_FragColor = vec4(col, alpha);
  }
`;

// ====== Main class ======
class Orb {
  constructor(container){
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'orb-canvas';
    container.appendChild(this.canvas);

    // scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 50);
    this.camera.position.set(0, 0, 4.2);

    // renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setClearColor(0x000000, 0); // transparent

    // points
    const pts = fibonacciSphere(PARAMS.PARTICLE_COUNT, PARAMS.RADIUS);
    const geom = new THREE.BufferGeometry();
    geom.setFromPoints(pts);

    // a per-particle “seed” to phase the jitter
    const seed = new Float32Array(PARAMS.PARTICLE_COUNT);
    for (let i = 0; i < seed.length; i++) seed[i] = Math.random() * Math.PI * 2.0;
    geom.setAttribute('seed', new THREE.BufferAttribute(seed, 1));

    // shader material (additive for glow)
    this.uniforms = {
      uTime:        new THREE.Uniform(0),
      uRadius:      new THREE.Uniform(PARAMS.RADIUS),
      uSize:        new THREE.Uniform(PARAMS.DOT_SIZE),
      uDeviceRatio: new THREE.Uniform(this.renderer.getPixelRatio()),
      uColor:       new THREE.Uniform(PARAMS.COLOR),
      uGlow:        new THREE.Uniform(PARAMS.GLOW),
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true
    });

    this.points = new THREE.Points(geom, mat);
    this.scene.add(this.points);

    // a subtle dim directional light “hint” (not required for points, kept for future)
    // this.scene.add(new THREE.AmbientLight(0xffffff, 0.0));

    // state
    this.start = performance.now();
    this.isFullscreen = false;

    // events
    this.container.addEventListener('click', () => this.toggleFullscreen());
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggleFullscreen(); }
      if (e.key === 'Escape' && this.isFullscreen) this.toggleFullscreen();
    });

    // Close badge
    this.closeBtn = document.createElement('div');
    this.closeBtn.className = 'orb-close';
    this.closeBtn.textContent = 'Close ✕';
    this.closeBtn.addEventListener('click', () => this.toggleFullscreen());
    this.container.appendChild(this.closeBtn);

    window.addEventListener('resize', () => this.onResize());
    this.onResize();
    this.animate();
  }

  onResize(){
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);

    // make points slightly bigger when fullscreen
    this.uniforms.uSize.value = this.isFullscreen
      ? PARAMS.DOT_SIZE_FULLSCREEN
      : PARAMS.DOT_SIZE;
    // update DPR in case it changed
    this.uniforms.uDeviceRatio.value = Math.min(2, window.devicePixelRatio || 1);
  }

  toggleFullscreen(){
    this.isFullscreen = !this.isFullscreen;
    this.container.classList.toggle('is-fullscreen', this.isFullscreen);
    this.onResize();
  }

  animate(){
    const t = (performance.now() - this.start) * 0.001;
    this.uniforms.uTime.value = t;

    // slow rotation
    this.points.rotation.y += PARAMS.ROTATION_Y * this.dt();
    this.points.rotation.x += PARAMS.ROTATION_X * this.dt();

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.animate());
  }

  // simple frame delta clamp
  dt(){
    const now = performance.now();
    this._lt = this._lt || now;
    const d = Math.min(0.033, (now - this._lt) / 1000);
    this._lt = now;
    return d;
  }
}

// ====== bootstrap when the header exists ======
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('orb-sphere');
  if (!container) return;
  // Ensure the header stays on top of your map etc.
  container.style.zIndex = getComputedStyle(document.documentElement)
    .getPropertyValue('--orb-z') || 200;

  new Orb(container);
});
