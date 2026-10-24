import "./style.css";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { gsap } from "gsap";
import { GIFT_CONFIG } from "./config.js";
import { createCssFallback } from "./fallback.js";

const $ = (selector) => document.querySelector(selector);
const configured = GIFT_CONFIG.apiKey && !GIFT_CONFIG.apiKey.startsWith("YOUR_");
let toastTimer;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2300);
}
async function copyText(text, message = "已复制，可以开始构建了。") {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  toast(message);
}
function setupGift() {
  $("#endpoint").value = GIFT_CONFIG.endpoint;
  GIFT_CONFIG.models.forEach((model) => {
    const option = document.createElement("option");
    option.value = model;
    option.textContent = model;
    $("#model").appendChild(option);
  });
  const keyInput = $("#api-key");
  keyInput.value = configured ? GIFT_CONFIG.apiKey : "待填入 API Key";
  keyInput.type = configured ? "password" : "text";
  $("#key-state").textContent = configured ? "已配置 · 私密礼物" : "预留变量 · 待填入";
  if (!configured) $("#reveal-key").textContent = "未配置";
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.copy;
      if (id === "api-key" && !configured) return toast("API Key 变量已留好，填入后就能复制。 ");
      copyText($(`#${id}`).value);
    });
  });
  $("#reveal-key").addEventListener("click", () => {
    if (!configured) return toast("请先在 config.js 中填入真实 API Key。");
    const showing = keyInput.type === "text";
    keyInput.type = showing ? "password" : "text";
    $("#reveal-key").textContent = showing ? "显示" : "隐藏";
  });
  $("#copy-all").addEventListener("click", () => {
    const content = [
      `BASE_URL=${GIFT_CONFIG.endpoint}`,
      `MODEL=${$("#model").value}`,
      `API_KEY=${configured ? GIFT_CONFIG.apiKey : "YOUR_ALIYUN_BAILIAN_API_KEY"}`
    ].join("\n");
    copyText(content, configured ? "完整配置已复制。" : "地址与模型已复制，Key 使用预留变量。 ");
  });
  $("#replay").addEventListener("click", () => window.location.reload());
}
setupGift();

class FilmAudio {
  constructor() { this.context = null; this.master = null; this.muted = false; }
  start() {
    if (this.context) { this.context.resume(); return; }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(this.context.destination);
    const length = this.context.sampleRate * 3;
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = last * 0.94 + white * 0.06;
      data[i] = last * 2.2;
    }
    const rain = this.context.createBufferSource();
    rain.buffer = buffer;
    rain.loop = true;
    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1800;
    const rainGain = this.context.createGain();
    rainGain.gain.value = 0.16;
    rain.connect(filter).connect(rainGain).connect(this.master);
    rain.start();
    this.rainGain = rainGain;
    [55, 82.41, 110].forEach((frequency, index) => {
      const oscillator = this.context.createOscillator();
      oscillator.type = index === 1 ? "triangle" : "sine";
      oscillator.frequency.value = frequency;
      const gain = this.context.createGain();
      gain.gain.value = 0.018 / (index + 1);
      oscillator.connect(gain).connect(this.master);
      oscillator.start();
    });
  }
  finish() {
    if (!this.context || !this.rainGain) return;
    this.rainGain.gain.linearRampToValueAtTime(0.025, this.context.currentTime + 2);
  }
  toggle() {
    if (!this.context) { this.start(); return false; }
    this.muted = !this.muted;
    this.master.gain.linearRampToValueAtTime(this.muted ? 0 : 0.7, this.context.currentTime + 0.2);
    return this.muted;
  }
}
const filmAudio = new FilmAudio();
$("#sound-toggle").addEventListener("click", () => {
  const muted = filmAudio.toggle();
  $("#sound-toggle").classList.toggle("muted", muted);
  $("#sound-toggle").setAttribute("aria-label", muted ? "开启声音" : "关闭声音");
  toast(muted ? "声音已关闭" : "声音已开启");
});

class RainGlass {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.intensity = 0.75;
    this.running = true;
    this.drops = [];
    this.streaks = [];
    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.tick = this.tick.bind(this);
    requestAnimationFrame(this.tick);
  }
  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.drops = Array.from({ length: Math.floor(this.width / 12) }, () => ({
      x: Math.random() * this.width, y: Math.random() * this.height,
      r: Math.random() * 1.7 + 0.35, speed: Math.random() * 0.16 + 0.025,
      drift: (Math.random() - 0.5) * 0.08, alpha: Math.random() * 0.32 + 0.08
    }));
    this.streaks = Array.from({ length: Math.floor(this.width / 22) }, () => ({
      x: Math.random() * this.width, y: Math.random() * this.height,
      length: Math.random() * 65 + 20, speed: Math.random() * 5 + 3,
      alpha: Math.random() * 0.08 + 0.02
    }));
  }
  tick() {
    if (!this.running) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.lineWidth = 0.65;
    this.streaks.forEach((drop) => {
      this.ctx.strokeStyle = `rgba(176,197,216,${drop.alpha * this.intensity})`;
      this.ctx.beginPath();
      this.ctx.moveTo(drop.x, drop.y);
      this.ctx.lineTo(drop.x - 4, drop.y + drop.length);
      this.ctx.stroke();
      drop.y += drop.speed;
      drop.x -= 0.25;
      if (drop.y > this.height + 80) { drop.y = -drop.length; drop.x = Math.random() * this.width; }
    });
    this.drops.forEach((drop) => {
      const gradient = this.ctx.createRadialGradient(drop.x - drop.r * 0.3, drop.y - drop.r * 0.4, 0, drop.x, drop.y, drop.r * 2.4);
      gradient.addColorStop(0, `rgba(220,232,240,${drop.alpha * this.intensity})`);
      gradient.addColorStop(0.4, `rgba(99,118,134,${drop.alpha * 0.4 * this.intensity})`);
      gradient.addColorStop(1, "rgba(30,40,50,0)");
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(drop.x, drop.y, drop.r * 2.4, 0, Math.PI * 2);
      this.ctx.fill();
      drop.y += drop.speed;
      drop.x += drop.drift;
      if (drop.y > this.height + 10) drop.y = -10;
    });
    requestAnimationFrame(this.tick);
  }
  stop() { this.running = false; }
}

function makeCardTexture(type) {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 950;
  const ctx = canvas.getContext("2d");
  const dark = type !== "front";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, canvas.width, canvas.height, 44);
  ctx.clip();
  if (dark) {
    const gradient = ctx.createLinearGradient(0, 0, 1600, 950);
    gradient.addColorStop(0, "#151a20");
    gradient.addColorStop(0.55, "#090c10");
    gradient.addColorStop(1, "#121820");
    ctx.fillStyle = gradient;
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 1600, 950);
    gradient.addColorStop(0, "#f2f1eb");
    gradient.addColorStop(0.45, "#d8d9d4");
    gradient.addColorStop(0.7, "#eeeeE8");
    gradient.addColorStop(1, "#c6cbc8");
    ctx.fillStyle = gradient;
  }
  ctx.fillRect(0, 0, 1600, 950);
  ctx.strokeStyle = dark ? "rgba(150,180,205,.07)" : "rgba(40,50,45,.055)";
  ctx.lineWidth = 1;
  for (let x = 0; x < 1600; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 950); ctx.stroke(); }
  for (let y = 0; y < 950; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1600, y); ctx.stroke(); }
  const ink = dark ? "#e2e8ea" : "#202624";
  const muted = dark ? "#667680" : "#747b76";
  ctx.fillStyle = muted;
  ctx.font = "24px 'DM Mono', monospace";
  ctx.letterSpacing = "4px";
  ctx.fillText(type === "inside" ? "MODEL ACCESS / ALIYUN BAILIAN" : "1024 / PROGRAMMER'S DAY", 92, 105);
  ctx.textAlign = "right";
  ctx.fillText("BUPT · 2026", 1508, 105);
  ctx.textAlign = "left";
  if (type === "front") {
    ctx.fillStyle = ink;
    ctx.font = "300 218px 'DM Mono', monospace";
    ctx.letterSpacing = "-16px";
    ctx.fillText("1024", 76, 535);
    ctx.font = "500 46px Inter, sans-serif";
    ctx.letterSpacing = "8px";
    ctx.fillText("GAO XING", 92, 785);
    ctx.fillStyle = muted;
    ctx.font = "22px 'DM Mono', monospace";
    ctx.letterSpacing = "3px";
    ctx.fillText("A GIFT FOR A BUPT BUILDER", 92, 838);
    const cx = 1260, cy = 490;
    [210, 155, 102].forEach((r, index) => {
      ctx.strokeStyle = `rgba(35,55,58,${0.17 + index * 0.09})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#353e3c"; ctx.fillRect(-54, -54, 108, 108);
    ctx.fillStyle = "#cdd1cc"; ctx.fillRect(-35, -35, 70, 70); ctx.restore();
    ctx.fillStyle = muted; ctx.font = "20px 'DM Mono', monospace"; ctx.textAlign = "center";
    ctx.fillText("COMPUTE", cx, 788); ctx.fillText("& CREATE", cx, 824);
  } else if (type === "inside") {
    ctx.fillStyle = "#86a6c8";
    ctx.font = "22px 'DM Mono', monospace";
    ctx.fillText("A GIFT THAT ACTUALLY RUNS", 92, 270);
    ctx.fillStyle = ink;
    ctx.font = "400 76px Inter, sans-serif";
    ctx.letterSpacing = "-3px";
    ctx.fillText("致高杏，1024 快乐。", 88, 390);
    ctx.fillStyle = "#9aaab4";
    ctx.font = "26px Inter, sans-serif";
    ctx.letterSpacing = "1px";
    ctx.fillText("愿你想做的事，都能跑起来。", 92, 455);
    ctx.strokeStyle = "#34414b"; ctx.beginPath(); ctx.moveTo(92, 575); ctx.lineTo(1508, 575); ctx.stroke();
    ctx.fillStyle = "#c5d2dc"; ctx.font = "34px 'DM Mono', monospace";
    ctx.fillText("deepseek-v4.1-flash", 92, 700);
    ctx.fillStyle = muted; ctx.font = "21px 'DM Mono', monospace";
    ctx.fillText("DESIGNED & DIRECTED BY 在下雨", 92, 810);
    ctx.textAlign = "right"; ctx.fillText("GIFT 001 / 1024", 1508, 810);
  } else {
    ctx.fillStyle = ink; ctx.font = "400 58px Inter, sans-serif";
    ctx.fillText("拿去创造点什么吧。", 92, 440);
    ctx.fillStyle = muted; ctx.font = "24px 'DM Mono', monospace";
    ctx.fillText("FOR GAO XING · FROM 在下雨", 92, 520);
  }
  ctx.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createFilm() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: $("#scene"), antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (error) {
    console.warn("WebGL 不可用，已切换到 CSS 3D 电影模式。", error);
    return createCssFallback();
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x08090b, 0.047);
  const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.2, 11.5);
  scene.add(new THREE.AmbientLight(0xb8c5d2, 0.55));
  const key = new THREE.SpotLight(0xf1f3ee, 65, 35, Math.PI / 5, 0.7, 1.4);
  key.position.set(-4, 6, 8); key.castShadow = true; scene.add(key);
  const rim = new THREE.PointLight(0x407bd2, 28, 18, 1.5); rim.position.set(5, 1, 1); scene.add(rim);
  const low = new THREE.PointLight(0x8ea5b7, 9, 15); low.position.set(-3, -4, 4); scene.add(low);

  const card = new THREE.Group();
  card.position.set(0, 0.2, 0);
  card.rotation.set(-0.12, 0.25, -0.025);
  scene.add(card);
  const edgeMaterial = new THREE.MeshPhysicalMaterial({ color: 0xa4aaa8, metalness: 0.85, roughness: 0.25, clearcoat: 0.8 });
  const base = new THREE.Mesh(new RoundedBoxGeometry(4.8, 2.85, 0.13, 6, 0.12), edgeMaterial);
  base.castShadow = true; base.receiveShadow = true; card.add(base);
  const innerMaterial = new THREE.MeshStandardMaterial({ map: makeCardTexture("inside"), roughness: 0.4, metalness: 0.25, emissive: 0x14253c, emissiveIntensity: 0.08 });
  const inner = new THREE.Mesh(new THREE.PlaneGeometry(4.68, 2.73), innerMaterial);
  inner.position.z = 0.071; card.add(inner);
  const cover = new THREE.Group();
  cover.position.set(-2.4, 0, 0.13); card.add(cover);
  const coverBody = new THREE.Mesh(new RoundedBoxGeometry(4.8, 2.85, 0.09, 6, 0.12), edgeMaterial);
  coverBody.position.x = 2.4; coverBody.castShadow = true; cover.add(coverBody);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 2.75), new THREE.MeshPhysicalMaterial({ map: makeCardTexture("front"), roughness: 0.34, metalness: 0.28, clearcoat: 0.75, clearcoatRoughness: 0.22 }));
  front.position.set(2.4, 0, 0.051); cover.add(front);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(4.68, 2.73), new THREE.MeshStandardMaterial({ map: makeCardTexture("back"), roughness: 0.45, metalness: 0.3 }));
  back.position.set(2.4, 0, -0.051); back.rotation.y = Math.PI; cover.add(back);
  const chip = new THREE.Mesh(new RoundedBoxGeometry(0.45, 0.45, 0.09, 3, 0.04), new THREE.MeshStandardMaterial({ color: 0x7194b8, metalness: 0.8, roughness: 0.24, emissive: 0x315b8a, emissiveIntensity: 0.4 }));
  chip.position.set(1.72, 0.75, 0.16); chip.scale.setScalar(0.001); card.add(chip);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.22 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -2.2; floor.receiveShadow = true; scene.add(floor);
  const dustGeometry = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(360 * 3);
  for (let i = 0; i < 360; i++) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 20;
    dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
  }
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0x8b9ba8, size: 0.016, transparent: true, opacity: 0.35 }));
  scene.add(dust);
  const pointer = { x: 0, y: 0 };
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX / window.innerWidth - 0.5;
    pointer.y = event.clientY / window.innerHeight - 0.5;
  });
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  let phase = "intro";
  let running = true;
  const clock = new THREE.Clock();
  function render() {
    if (!running) return;
    const time = clock.getElapsedTime();
    if (phase === "intro") {
      card.position.y = 0.2 + Math.sin(time * 0.7) * 0.07;
      card.rotation.y += (0.25 + pointer.x * 0.1 - card.rotation.y) * 0.025;
      card.rotation.x += (-0.12 - pointer.y * 0.06 - card.rotation.x) * 0.025;
    }
    dust.rotation.y = time * 0.008;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  render();
  return {
    card, cover, chip, camera, rim, innerMaterial,
    setPhase(value) { phase = value; },
    stop() { running = false; }
  };
}

if (window.__isDesktop) {
  const rain = new RainGlass($("#rain"));
  const film = createFilm();
  let filmTimeline;
  let finished = false;
  const invitation = $("#invitation");
  const intro = gsap.timeline();
  intro
    .to("#opening-credit", { opacity: 1, duration: 0.8, ease: "power2.out" }, 0.35)
    .to("#opening-credit", { opacity: 0, duration: 0.65 }, 1.75)
    .to("#dedication", { opacity: 1, duration: 0.8 }, 2.15)
    .to("#dedication", { opacity: 0, duration: 0.6 }, 3.55)
    .to(film.card.position, { x: 2.35, duration: 1.6, ease: "power2.inOut" }, 3.1)
    .to(invitation, { opacity: 1, duration: 1, ease: "power2.out" }, 4.05)
    .call(() => invitation.classList.add("visible"), null, 4.1);

  function updateChapter(number, title) {
    gsap.to("#chapter-caption", { opacity: 0, y: 6, duration: 0.2, onComplete: () => {
      $("#chapter-number").textContent = number;
      $("#chapter-title").textContent = title;
      gsap.to("#chapter-caption", { opacity: 1, y: 0, duration: 0.45 });
    }});
  }
  function finishFilm() {
    if (finished) return;
    finished = true;
    film.setPhase("gift");
    filmAudio.finish();
    const gift = $("#gift");
    gift.style.visibility = "visible";
    gift.style.zIndex = "3";
    gsap.to(gift, { opacity: 1, duration: 0.65, ease: "power2.out" });
    gsap.fromTo(".gift-story > *", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.07, ease: "power3.out", delay: 0.15 });
    gsap.fromTo(".gift-access-wrap", { opacity: 0, y: 24, scale: 0.985 }, { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power3.out", delay: 0.25 });
    setTimeout(() => { $("#film").style.display = "none"; film.stop(); rain.stop(); }, 700);
  }
  function startFilm() {
    filmAudio.start();
    film.setPhase("playing");
    invitation.classList.remove("visible");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return finishFilm();
    filmTimeline = gsap.timeline({ defaults: { ease: "power2.inOut" } });
    filmTimeline
      .to(invitation, { opacity: 0, y: 18, duration: 0.55 }, 0)
      .to(".film-counter", { opacity: 0, duration: 0.5 }, 0)
      .to("#skip-film", { opacity: 1, duration: 0.5 }, 0.4)
      .to("#chapter-caption", { opacity: 1, duration: 0.7 }, 0.45)
      .to(film.card.position, { x: 0, y: 0, duration: 1.8 }, 0.35)
      .to(film.card.rotation, { x: 0, y: 0, z: 0, duration: 1.8 }, 0.35)
      .to(film.camera.position, { z: 8.4, y: 0.1, duration: 2.2 }, 0.35)
      .call(() => updateChapter("02 / 04", "把目光，交给一份特别的礼物。"), null, 2.1)
      .to(film.card.rotation, { y: -0.1, x: -0.06, duration: 1.2 }, 2.1)
      .to(film.rim, { intensity: 48, duration: 1.4 }, 2.2)
      .call(() => updateChapter("03 / 04", "为高杏，开启新的可能。"), null, 3.7)
      .to(film.cover.rotation, { y: -2.72, duration: 2.35, ease: "power3.inOut" }, 3.55)
      .to(film.chip.scale, { x: 1, y: 1, z: 1, duration: 1.1, ease: "back.out(1.4)" }, 4.2)
      .to(film.innerMaterial, { emissiveIntensity: 0.32, duration: 1.4 }, 4.1)
      .to(film.card.position, { x: 1.65, duration: 2, ease: "power2.inOut" }, 4.1)
      .to(film.camera.position, { z: 10.2, duration: 2, ease: "power2.out" }, 4.1)
      .to(rain, { intensity: 0.22, duration: 2.2 }, 4.4)
      .call(() => updateChapter("04 / 04", "礼物，已经准备好。"), null, 6.2)
      .to("#skip-film, .film-header, #chapter-caption", { opacity: 0, duration: 0.6 }, 7.1)
      .to("#whiteout", { opacity: 1, duration: 1.25, ease: "power2.inOut" }, 7.45)
      .call(finishFilm, null, 8.45);
  }
  $("#start-film").addEventListener("click", startFilm);
  $("#skip-film").addEventListener("click", () => { filmTimeline?.kill(); finishFilm(); });
  window.addEventListener("resize", () => {
    if (window.innerWidth < 1024 && !finished) window.location.reload();
  });
}
