import { gsap } from "gsap";

// 无 WebGL 环境下的 CSS 3D 降级场景，沿用同一条电影时间线。
export function createCssFallback() {
  const root = document.createElement("div");
  root.className = "fallback-scene";
  root.innerHTML = `
    <div class="fallback-card">
      <div class="fallback-base">
        <div class="fallback-inner-copy">
          <small>MODEL ACCESS / ALIYUN BAILIAN</small>
          <span class="fallback-blue">A GIFT THAT ACTUALLY RUNS</span>
          <h2>致高杏，1024 快乐。</h2>
          <p>愿你想做的事，都能跑起来。</p>
          <hr />
          <strong>deepseek-v4.1-flash</strong>
          <footer>DESIGNED & DIRECTED BY 在下雨 <span>GIFT 001 / 1024</span></footer>
        </div>
      </div>
      <div class="fallback-chip"></div>
      <div class="fallback-cover">
        <div class="fallback-front">
          <small>1024 / PROGRAMMER'S DAY <span>BUPT · 2026</span></small>
          <b>1024</b>
          <div class="fallback-orbits"><i></i><i></i><i></i><em></em></div>
          <h2>GAO XING</h2>
          <p>A GIFT FOR A BUPT BUILDER</p>
        </div>
        <div class="fallback-back"><h2>拿去创造点什么吧。</h2><p>FOR GAO XING · FROM 在下雨</p></div>
      </div>
    </div>`;
  document.querySelector("#film").prepend(root);
  const cardEl = root.querySelector(".fallback-card");
  const coverEl = root.querySelector(".fallback-cover");
  const chipEl = root.querySelector(".fallback-chip");
  const card = { position: { x: 0, y: 0.2 }, rotation: { x: -0.12, y: 0.25, z: -0.025 } };
  const cover = { rotation: { y: 0 } };
  const chip = { scale: { x: 0.001, y: 0.001, z: 0.001 } };
  const camera = { position: { x: 0, y: 0.2, z: 11.5 } };
  const rim = { intensity: 28 };
  const innerMaterial = { emissiveIntensity: 0.08 };
  let phase = "intro";
  let start = performance.now();
  function sync(now) {
    const elapsed = (now - start) / 1000;
    const scale = 11.5 / camera.position.z;
    const idleY = phase === "intro" ? Math.sin(elapsed * 0.7) * 5 : 0;
    const x = card.position.x * 66 * scale;
    const y = -card.position.y * 55 * scale + idleY;
    cardEl.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale}) rotateX(${card.rotation.x}rad) rotateY(${card.rotation.y}rad) rotateZ(${card.rotation.z}rad)`;
    coverEl.style.transform = `rotateY(${cover.rotation.y}rad)`;
    chipEl.style.transform = `translate(-50%, -50%) scale(${chip.scale.x})`;
    chipEl.style.opacity = Math.min(1, chip.scale.x);
    root.style.filter = `brightness(${0.8 + rim.intensity / 160})`;
  }
  gsap.ticker.add(sync);
  return {
    card, cover, chip, camera, rim, innerMaterial,
    setPhase(value) { phase = value; },
    stop() { gsap.ticker.remove(sync); root.remove(); }
  };
}
