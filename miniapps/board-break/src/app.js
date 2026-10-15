import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import {
  STORAGE_KEY,
  freshState,
  decodeState,
  createRound,
  recordDraw,
} from "./state";

const $ = (id) => document.getElementById(id),
  config = window.__BREAKING__ || {};
const asset = (path) => config.assets?.[path] || path;
document.documentElement.style.setProperty(
  "--dojo",
  `url("${asset("assets/dojo.jpg")}")`,
);
document
  .querySelectorAll(".app-logo")
  .forEach((img) => (img.src = asset("assets/logo.png")));
if (config.standalone) $("exit").hidden = true;
let state = freshState(),
  corrupt = false,
  warning = "",
  ready = false,
  disposed = false;
let paused = document.hidden,
  phase = "loading",
  selected = -1,
  round = [],
  outcome = null;
let elapsed = 0,
  lastTime = 0,
  frame = 0,
  hitDone = false,
  audio;
let renderer,
  scene,
  camera,
  environment,
  observer,
  hero,
  heroRig,
  mixer,
  kickAction,
  clapAction,
  selectionRing;
let sign,
  medal,
  signText,
  boardObjects = [],
  hitMeshes = [],
  fragments = [],
  particles = [];
let heroStart = -2.2,
  heroTarget = -2.2;
const loaded = {},
  abort = new AbortController();
const boardX = [-2.35, 0, 2.35],
  floorY = 0.22,
  boardZ = 0.95;
const modelNames = [
  "character",
  "character-kick",
  "character-clap",
  "board",
  "fragment-left",
  "fragment-right",
  "chips",
  "stand",
  "medal",
  "sign-win",
  "sign-miss",
  "stage",
];
try {
  state = decodeState(
    config.native
      ? config.storage == null
        ? null
        : JSON.stringify(config.storage)
      : localStorage.getItem(STORAGE_KEY),
  );
} catch {
  corrupt = true;
  warning = "저장된 기록을 읽지 못했어요. 기록 초기화 후 다시 시작해 주세요.";
}
function send(type, data = {}) {
  const m = JSON.stringify({ version: 1, type, ...data });
  if (config.native) window.ReactNativeWebView?.postMessage(m);
  else if (window.parent !== window)
    window.parent.postMessage(m, location.origin);
}
function persist() {
  if (corrupt) return;
  try {
    if (config.native) send("breaking-save", { state });
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    warning = "기기에 저장하지 못했어요. 현재 화면에서만 기록이 유지돼요.";
  }
}
function status(message) {
  $("status").textContent = warning || message;
}
function refresh() {
  $("prize-label").textContent = state.settings.prize;
  $("odds-label").textContent = `3장 중 ${state.settings.winningBoards}장 당첨`;
  $("total-count").textContent = state.history.length;
  $("win-count").textContent = state.history.filter((d) => d.won).length;
  $("sound").setAttribute("aria-pressed", String(state.settings.sound));
  $("sound").setAttribute(
    "aria-label",
    state.settings.sound ? "소리 끄기" : "소리 켜기",
  );
  $("sound").textContent = state.settings.sound ? "♪" : "♩";
  $("empty-history").hidden = state.history.length > 0;
  $("history").replaceChildren(
    ...state.history.map((d) => {
      const li = document.createElement("li"),
        badge = document.createElement("span"),
        body = document.createElement("div"),
        title = document.createElement("strong"),
        time = document.createElement("small");
      badge.className = d.won ? "won" : "";
      badge.textContent = d.won ? "당첨" : "꽝";
      title.textContent = d.prize;
      time.textContent = `${d.board + 1}번 송판 · ${new Date(d.at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;
      body.append(title, time);
      li.append(badge, body);
      return li;
    }),
  );
}
function controls() {
  document.querySelector(".board-choices").hidden = phase === "result";
  const busy = phase === "kicking",
    disabled = !ready || busy || corrupt;
  document.querySelectorAll("[data-board]").forEach((b) => {
    b.disabled = disabled || phase === "result";
    b.setAttribute(
      "aria-pressed",
      String(Number(b.dataset.board) === selected),
    );
  });
  $("kick").disabled = disabled || (selected < 0 && phase !== "result");
  $("kick-label").textContent =
    phase === "result"
      ? "한 번 더!"
      : busy
        ? "힘차게 격파하는 중…"
        : selected < 0
          ? "송판을 골라 주세요"
          : "기합 넣고 격파!";
  $("settings-open").disabled = busy;
  $("history-clear").disabled = busy;
  $("scene-state").textContent = busy
    ? "힘차게 격파!"
    : phase === "result"
      ? "격파 완료"
      : selected < 0
        ? "송판을 골라 주세요"
        : `${selected + 1}번 송판 준비!`;
  $("ready-indicator").textContent = busy ? "BREAK!" : "READY";
  $("viewport").dataset.phase = phase;
}
function tone(freq = 500, duration = 0.08, volume = 0.04, delay = 0) {
  if (!state.settings.sound || disposed) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    void audio.resume();
    const osc = audio.createOscillator(),
      gain = audio.createGain(),
      at = audio.currentTime + delay;
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(at);
    osc.stop(at + duration);
  } catch {
    /* Sound is optional. */
  }
}
function crack() {
  for (const [f, d] of [
    [110, 0],
    [190, 0.025],
    [85, 0.055],
  ])
    tone(f, 0.12, 0.07, d);
}
function fit(id, size, position = [0, 0, 0]) {
  const content = loaded[id].scene.clone(true);
  content.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(content),
    extent = bounds.getSize(new THREE.Vector3()),
    center = bounds.getCenter(new THREE.Vector3());
  content.position.add(new THREE.Vector3(-center.x, -bounds.min.y, -center.z));
  const group = new THREE.Group();
  group.add(content);
  group.scale.set(size[0] / extent.x, size[1] / extent.y, size[2] / extent.z);
  group.position.set(...position);
  scene.add(group);
  return group;
}
function textSprite(text, color = "#69431f") {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 160;
  const ctx = c.getContext("2d");
  ctx.font = "900 110px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, 256, 84);
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map, depthWrite: false }),
  );
  sprite.scale.set(1.25, 0.39, 1);
  scene.add(sprite);
  return sprite;
}
function disposeObject(object) {
  scene.remove(object);
  object.traverse((n) => {
    if (n.material?.map?.isCanvasTexture) {
      n.material.map.dispose();
      n.material.dispose();
    }
  });
}
function setIdle() {
  mixer.stopAllAction();
  clapAction.reset().play();
  clapAction.paused = true;
  clapAction.time = 0;
  mixer.update(0);
}
function newRound() {
  if (!ready || phase === "kicking") return;
  round = createRound(state.settings.winningBoards);
  selected = -1;
  outcome = null;
  elapsed = 0;
  hitDone = false;
  phase = "ready";
  boardObjects.forEach((b) => (b.visible = true));
  fragments.forEach((f) => (f.visible = false));
  particles.forEach((p) => (p.mesh.visible = false));
  if (sign) disposeObject(sign);
  if (signText) disposeObject(signText);
  sign = signText = null;
  medal.visible = false;
  selectionRing.visible = false;
  $("result").hidden = true;
  $("impact").hidden = true;
  hero.position.set(-1.15, floorY, 0.45);
  hero.rotation.set(0, 0, 0);
  setIdle();
  controls();
  status("마음이 가는 송판을 하나 골라 보세요.");
}
function selectBoard(index) {
  if (!ready || phase !== "ready" || corrupt) return;
  selected = index;
  selectionRing.visible = true;
  selectionRing.position.x = boardX[index];
  controls();
  tone(620, 0.035, 0.018);
  status(`${index + 1}번 송판을 골랐어요. 기합 넣고 격파해 보세요!`);
}
function startKick() {
  if (phase === "result") {
    newRound();
    return;
  }
  if (!ready || phase !== "ready" || selected < 0 || corrupt) return;
  phase = "kicking";
  elapsed = 0;
  hitDone = false;
  hero.rotation.y = 0;
  heroStart = hero.position.x;
  heroTarget = boardX[selected] - 1.12;
  setIdle();
  selectionRing.visible = false;
  controls();
  status("얍! 송판 뒤의 행운을 확인해요.");
  tone(350, 0.12, 0.05);
  tone(620, 0.12, 0.035, 0.12);
}
function impact() {
  hitDone = true;
  boardObjects[selected].visible = false;
  const x = boardX[selected];
  fragments.forEach((f, i) => {
    f.visible = true;
    f.position.set(x + (i ? 0.4 : -0.4), floorY + 0.2, boardZ);
    f.rotation.set(0, 0, 0);
  });
  particles.forEach((p, i) => {
    p.vy = 2.1 + (i % 3) * 0.6;
    p.mesh.visible = true;
    p.mesh.position.set(x + ((i % 3) - 1) * 0.2, 1.2, boardZ + 0.1);
    p.mesh.rotation.set(0, 0, 0);
  });
  const won = round[selected];
  state = recordDraw(
    state,
    selected,
    won,
    crypto.randomUUID(),
    new Date().toISOString(),
  );
  outcome = state.history[0];
  persist();
  refresh();
  crack();
  $("impact").hidden = false;
  $("viewport").dataset.outcome = won ? "win" : "miss";
}
function reveal() {
  phase = "result";
  hero.rotation.y = 0;
  hero.position.z = 1.25;
  $("impact").hidden = true;
  $("result").hidden = false;
  $("result").classList.toggle("miss", !outcome.won);
  $("result-badge").textContent = outcome.won
    ? "행운의 격파 성공!"
    : "멋지게 격파했어요!";
  $("result-title").textContent = outcome.won ? outcome.prize : "다음 기회에!";
  $("result-copy").textContent = outcome.won
    ? "축하해요! 다 같이 박수쳐 주세요."
    : "이번에는 꽝! 다음 행운에 다시 도전해요.";
  const x = boardX[selected];
  sign = fit(
    outcome.won ? "sign-win" : "sign-miss",
    [1.5, 0.45, 0.2],
    [x, 1.9, boardZ],
  );
  signText = textSprite(
    outcome.won ? "당첨" : "꽝",
    outcome.won ? "#6b441a" : "#fff6df",
  );
  signText.position.set(x, 2.16, boardZ + 0.16);
  medal.visible = outcome.won;
  medal.position.set(x, 0.68, boardZ);
  medal.rotation.set(0, 0, 0);
  if (outcome.won) {
    kickAction.paused = false;
    clapAction.reset().setLoop(THREE.LoopRepeat, Infinity).play();
    clapAction.crossFadeFrom(kickAction, 0.2, true);
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.24, 0.035, i * 0.12));
  } else setIdle();
  controls();
  status(
    outcome.won
      ? "축하해요! 한 번 더 버튼으로 새 송판을 준비해요."
      : "한 번 더 버튼으로 새로운 행운에 도전해 보세요.",
  );
}
function resize() {
  if (!renderer) return;
  const { width, height } = $("viewport").getBoundingClientRect();
  const aspect = width / height;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  const distance = Math.max(
    10.8,
    8.5 / (2 * Math.tan(THREE.MathUtils.degToRad(32 / 2)) * aspect),
  );
  camera.position.set(0, 1.55 + distance * 0.25, distance);
  camera.lookAt(0, 1.55, 0);
  renderer.setSize(width, height, false);
}
async function init() {
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: $("scene"),
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.88;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xfff5dd, 0x5b6480, 1.7));
    const sun = new THREE.DirectionalLight(0xffeed5, 2.0);
    sun.position.set(-3, 9, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, {
      left: -7,
      right: 7,
      top: 7,
      bottom: -7,
      near: 0.5,
      far: 25,
    });
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    const pmrem = new THREE.PMREMGenerator(renderer),
      room = new RoomEnvironment();
    environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    room.dispose();
    pmrem.dispose();
    const loader = new GLTFLoader();
    let count = 0;
    await Promise.all(
      modelNames.map(async (id) => {
        const r = await fetch(asset(`assets/models/${id}.glb`), {
          signal: abort.signal,
        });
        if (!r.ok) throw new Error(id);
        const gltf = await loader.parseAsync(await r.arrayBuffer(), "");
        loaded[id] = gltf;
        gltf.scene.traverse((n) => {
          if (n.isMesh) {
            n.castShadow = true;
            n.receiveShadow = true;
          }
        });
        $("load-progress").textContent =
          `3D 부품 ${++count} / ${modelNames.length}`;
      }),
    );
    if (disposed) {
      cleanup();
      return;
    }
    fit("stage", [8.5, 0.24, 4.3], [0, -0.02, 0.15]);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.ShadowMaterial({ opacity: 0.16 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.03;
    ground.receiveShadow = true;
    scene.add(ground);
    for (const [i, x] of boardX.entries()) {
      fit("stand", [1.95, 0.38, 0.52], [x, floorY, boardZ]);
      const board = fit("board", [1.65, 1.5, 0.13], [x, floorY + 0.19, boardZ]);
      boardObjects.push(board);
      board.traverse((n) => {
        if (n.isMesh) {
          n.userData.board = i;
          hitMeshes.push(n);
        }
      });
    }
    fragments = [
      fit("fragment-left", [0.85, 1.5, 0.16]),
      fit("fragment-right", [0.85, 1.5, 0.16]),
    ];
    for (let i = 0; i < 10; i++) {
      const mesh = fit("chips", [0.12 + 0.025 * (i % 3), 0.1, 0.12]);
      particles.push({
        mesh,
        vx: (i % 2 ? 1 : -1) * (0.8 + i * 0.14),
        vy: 2.1 + (i % 3) * 0.6,
        vz: ((i % 3) - 1) * 1.2,
      });
    }
    medal = fit("medal", [1.05, 1.05, 0.3]);
    selectionRing = new THREE.Mesh(
      new THREE.RingGeometry(0.78, 0.86, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffd46a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      }),
    );
    selectionRing.rotation.x = -Math.PI / 2;
    selectionRing.position.set(0, floorY + 0.015, boardZ);
    scene.add(selectionRing);
    hero = new THREE.Group();
    heroRig = clone(loaded["character-kick"].scene);
    heroRig.scale.setScalar(3.5);
    hero.add(heroRig);
    scene.add(hero);
    mixer = new THREE.AnimationMixer(heroRig);
    kickAction = mixer.clipAction(loaded["character-kick"].animations[0]);
    kickAction.setLoop(THREE.LoopOnce, 1);
    kickAction.clampWhenFinished = true;
    clapAction = mixer.clipAction(loaded["character-clap"].animations[0]);
    ready = true;
    $("loading").hidden = true;
    $("viewport").dataset.ready = "true";
    newRound();
    resize();
    observer = new ResizeObserver(resize);
    observer.observe($("viewport"));
    lastTime = performance.now();
    frame = requestAnimationFrame(animate);
    send("breaking-ready");
  } catch (error) {
    if (disposed) return;
    console.error(error);
    $("loading").hidden = true;
    $("error").hidden = false;
    send("breaking-error");
  }
}
function animate(now) {
  if (disposed) return;
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  if (!paused) {
    if (phase === "kicking") {
      const prev = elapsed;
      elapsed += dt;
      const t = Math.min(elapsed / 0.4, 1),
        smooth = t * t * (3 - 2 * t);
      hero.position.x = THREE.MathUtils.lerp(heroStart, heroTarget, smooth);
      if (prev < 0.4 && elapsed >= 0.4) {
        clapAction.stop();
        kickAction.reset().setLoop(THREE.LoopOnce, 1).play();
        kickAction.paused = false;
        kickAction.clampWhenFinished = true;
      }
      if (elapsed >= 0.4) mixer.update(dt);
      if (elapsed >= 1.22 && !hitDone) impact();
      if (hitDone) {
        const age = elapsed - 1.22;
        fragments.forEach((f, i) => {
          const side = i ? 1 : -1;
          f.position.x = boardX[selected] + side * (0.4 + age * 0.9);
          f.position.y = Math.max(
            floorY + 0.04,
            floorY + 0.2 + age * 0.8 - age * age * 2,
          );
          f.position.z = boardZ + age * 0.45;
          f.rotation.z = side * age * 1.25;
          f.rotation.y = side * age * 0.5;
        });
        particles.forEach((p) => {
          p.mesh.position.x += p.vx * dt;
          p.mesh.position.z += p.vz * dt;
          p.mesh.position.y = Math.max(floorY, p.mesh.position.y + p.vy * dt);
          p.vy -= 7 * dt;
          p.mesh.rotation.x += dt * 3;
        });
      }
      if (elapsed >= 2.05) reveal();
    } else if (phase === "result") {
      if (outcome?.won) {
        mixer.update(dt);
        medal.rotation.y = Math.sin(now / 700) * 0.18;
      }
    }
    if (selectionRing.visible)
      selectionRing.material.opacity = 0.7 + Math.sin(now / 300) * 0.2;
    renderer.render(scene, camera);
  }
  frame = requestAnimationFrame(animate);
}
function setPaused(value) {
  paused = Boolean(value);
  $("paused").hidden = !paused || phase !== "kicking";
  lastTime = performance.now();
  if (paused) void audio?.suspend();
}
window.__breakingPause = setPaused;
const visibility = () => setPaused(document.hidden);
document.addEventListener("visibilitychange", visibility);
const parentMessage = (e) => {
  if (
    e.source !== window.parent ||
    e.origin !== location.origin ||
    typeof e.data !== "string"
  )
    return;
  try {
    const d = JSON.parse(e.data);
    if (d.type === "breaking-pause") setPaused(d.paused);
    if (d.type === "breaking-dispose") cleanup();
  } catch {}
};
window.addEventListener("message", parentMessage);
function cleanup() {
  disposed = true;
  abort.abort();
  cancelAnimationFrame(frame);
  observer?.disconnect();
  document.removeEventListener("visibilitychange", visibility);
  window.removeEventListener("message", parentMessage);
  void audio?.close();
  mixer?.stopAllAction();
  if (heroRig) mixer?.uncacheRoot(heroRig);
  const geometries = new Set(),
    materials = new Set(),
    textures = new Set();
  const collect = (n) => {
    if (n.geometry) geometries.add(n.geometry);
    for (const m of Array.isArray(n.material)
      ? n.material
      : n.material
        ? [n.material]
        : []) {
      materials.add(m);
      for (const v of Object.values(m)) if (v?.isTexture) textures.add(v);
    }
  };
  scene?.traverse(collect);
  Object.values(loaded).forEach((g) => g.scene.traverse(collect));
  geometries.forEach((g) => g.dispose());
  textures.forEach((t) => t.dispose());
  materials.forEach((m) => m.dispose());
  environment?.dispose();
  renderer?.dispose();
}
window.__breakingDispose = cleanup;
$("scene").addEventListener("webglcontextlost", (e) => {
  e.preventDefault();
  ready = false;
  setPaused(true);
  controls();
  $("error").hidden = false;
  $("error-text").textContent =
    "3D 화면이 잠시 중단됐어요. 다시 불러와 주세요.";
});
const raycaster = new THREE.Raycaster(),
  pointer = new THREE.Vector2();
let down = null;
$("scene").addEventListener(
  "pointerdown",
  (e) => (down = [e.clientX, e.clientY]),
);
$("scene").addEventListener("pointerup", (e) => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 10)
    return;
  down = null;
  if (phase !== "ready" || !camera) return;
  const r = $("scene").getBoundingClientRect();
  pointer.set(
    ((e.clientX - r.left) / r.width) * 2 - 1,
    (-(e.clientY - r.top) / r.height) * 2 + 1,
  );
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(hitMeshes, false)[0];
  if (hit) selectBoard(hit.object.userData.board);
});
document
  .querySelectorAll("[data-board]")
  .forEach((b) =>
    b.addEventListener("click", () => selectBoard(Number(b.dataset.board))),
  );
$("kick").addEventListener("click", startKick);
$("retry").addEventListener("click", () => location.reload());
$("sound").addEventListener("click", () => {
  state.settings.sound = !state.settings.sound;
  persist();
  refresh();
  tone();
});
$("settings-open").addEventListener("click", () => {
  $("prize").value = state.settings.prize;
  $("winning-boards").value = String(state.settings.winningBoards);
  $("settings").showModal();
});
$("settings-close").addEventListener("click", () => $("settings").close());
$("settings-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (phase === "kicking") return;
  const prize = $("prize").value.trim();
  if (!prize) {
    $("prize").focus();
    return;
  }
  state.settings = {
    ...state.settings,
    prize,
    winningBoards: Number($("winning-boards").value),
  };
  persist();
  refresh();
  newRound();
  $("settings").close();
  status("설정을 저장했어요. 새로운 송판을 골라 주세요.");
});
$("history-clear").addEventListener("click", () =>
  $("confirm-clear").showModal(),
);
$("clear-cancel").addEventListener("click", () => $("confirm-clear").close());
$("clear-confirm").addEventListener("click", () => {
  if (phase === "kicking") return;
  state.history = [];
  corrupt = false;
  warning = "";
  persist();
  refresh();
  newRound();
  $("confirm-clear").close();
});
$("exit").addEventListener("click", () => {
  if (window.parent !== window || config.native) send("breaking-exit");
  else location.href = "/";
  cleanup();
});
refresh();
status("마음이 가는 송판을 하나 골라 보세요.");
init();
