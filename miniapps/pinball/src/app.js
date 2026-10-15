import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createPhysics, PEGS, BUMPERS } from "./physics";
import {
  STORAGE_KEY,
  freshState,
  decodeState,
  winningLanes,
  selectedWinningLanes,
  toggleWinningLane,
  recordDraw,
} from "./state";

const config = window.__PINBALL__ || {},
  $ = (id) => document.getElementById(id);
const asset = (path) => config.assets?.[path] || path;
if (config.standalone) $("exit").hidden = true;
document.documentElement.style.setProperty(
  "--dojo",
  `url("${asset("assets/dojo.jpg")}")`,
);
document
  .querySelectorAll("img.logo")
  .forEach((img) => (img.src = asset("assets/logo.png")));
let state = freshState(),
  corrupt = false,
  storageWarning = "",
  ready = false,
  drawing = false,
  disposed = false,
  paused = document.hidden;
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
  storageWarning =
    "저장된 기록을 읽지 못했어요. 기록 초기화 후 다시 시작해 주세요.";
}
const send = (type, data = {}) => {
  const message = JSON.stringify({ version: 1, type, ...data });
  if (config.native) window.ReactNativeWebView?.postMessage(message);
  else if (window.parent !== window)
    window.parent.postMessage(message, location.origin);
};
function persist() {
  if (corrupt) return;
  try {
    if (config.native) send("pinball-save", { state });
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    storageWarning =
      "기기에 저장하지 못했어요. 현재 화면에서만 기록이 유지돼요.";
  }
}
function status(text) {
  $("status").textContent = storageWarning || text;
}
function refresh() {
  $("prize-label").textContent = state.settings.prize;
  $("total-count").textContent = String(state.history.length);
  $("win-count").textContent = String(
    state.history.filter((x) => x.won).length,
  );
  $("sound").setAttribute("aria-pressed", String(state.settings.sound));
  $("sound").setAttribute(
    "aria-label",
    state.settings.sound ? "소리 끄기" : "소리 켜기",
  );
  $("sound").textContent = state.settings.sound ? "♪" : "♩";
  $("lane-legend").replaceChildren(
    ...Array.from({ length: 5 }, (_, i) => {
      const e = document.createElement("button"),
        won = selectedWinningLanes(state.settings).includes(i);
      e.type = "button";
      e.disabled = !ready || drawing || corrupt;
      e.setAttribute("aria-label", `${i + 1}번 칸 ${won ? "당첨" : "꽝"}`);
      e.setAttribute("aria-pressed", String(won));
      e.addEventListener("click", () => {
        if (!ready || physics?.active || corrupt) return;
        state.settings = toggleWinningLane(state.settings, i);
        persist();
        refresh();
        makeLanes();
        $("result").hidden = true;
        $("lane-legend").children[i].focus();
        status(`${i + 1}번 칸을 ${won ? "꽝" : "당첨"}으로 바꿨어요.`);
      });
      e.className = won ? "win" : "";
      e.textContent = won ? "당첨" : "꽝";
      return e;
    }),
  );
  $("history").replaceChildren(
    ...state.history.map((d) => {
      const li = document.createElement("li"),
        badge = document.createElement("span"),
        body = document.createElement("div"),
        name = document.createElement("strong"),
        time = document.createElement("small");
      badge.className = d.won ? "won" : "";
      badge.textContent = d.won ? "당첨" : "꽝";
      name.textContent = d.prize;
      time.textContent = `${d.lane + 1}번 칸 · ${new Date(d.at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;
      body.append(name, time);
      li.append(badge, body);
      return li;
    }),
  );
  $("empty-history").hidden = state.history.length > 0;
}
refresh();
status("출발 위치를 정하고 공을 떨어뜨려 보세요.");
let audio;
function tone(freq = 500, duration = 0.05, volume = 0.03) {
  if (!state.settings.sound || disposed) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    void audio.resume();
    const o = audio.createOscillator(),
      g = audio.createGain();
    o.frequency.value = freq;
    g.gain.setValueAtTime(volume, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    o.connect(g);
    g.connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + duration);
  } catch {
    /* Sound is optional on restricted devices. */
  }
}
const names = [
  "board",
  "launcher",
  "ball",
  "peg",
  "bumper-red",
  "bumper-blue",
  "cushion-red",
  "cushion-blue",
  "board-intact",
  "board-left",
  "board-right",
  "belt-ramp",
  "bin-win",
  "bin-miss",
  "gift",
  "side-cushion",
];
let renderer,
  environment,
  scene,
  camera,
  rig,
  ballMesh,
  launcherMesh,
  breakBoard,
  fragments = [],
  laneObjects = [],
  effects = [],
  physics,
  frame = 0,
  observer;
const loaded = {},
  abort = new AbortController();
let launchedAt = 0,
  brokenAt = null,
  lastTime = 0;
function fit(name, size, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const content = loaded[name].clone(true);
  content.rotation.set(...rotation);
  content.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(content),
    extent = box.getSize(new THREE.Vector3()),
    center = box.getCenter(new THREE.Vector3());
  content.position.add(new THREE.Vector3(-center.x, -box.min.y, -center.z));
  const group = new THREE.Group();
  group.add(content);
  group.scale.set(size[0] / extent.x, size[1] / extent.y, size[2] / extent.z);
  group.position.set(...position);
  rig.add(group);
  return group;
}
function label(text, x, z, won) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = won ? "#775015" : "#fff5df";
  ctx.font = "900 66px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 65);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.45),
    new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false }),
  );
  mesh.position.set(x, 0.38, z);
  mesh.rotation.x = -Math.PI / 3;
  rig.add(mesh);
  return mesh;
}
function makeLanes() {
  for (const o of laneObjects) {
    rig.remove(o);
    o.traverse((n) => {
      if (n.material?.map?.isCanvasTexture) {
        n.material.map.dispose();
        n.material.dispose();
        n.geometry.dispose();
      }
    });
  }
  laneObjects = [];
  const winning = selectedWinningLanes(state.settings);
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * 1.3,
      won = winning.includes(i);
    laneObjects.push(
      fit(won ? "bin-win" : "bin-miss", [1.24, 0.55, 2.35], [x, 0.04, 7.7]),
    );
    if (won) laneObjects.push(fit("gift", [0.38, 0.45, 0.38], [x, 0.2, 7.7]));
    laneObjects.push(label(won ? "당첨" : "꽝", x, 9.0, won));
  }
}
function controls(active) {
  drawing = active;
  $("drop").disabled = !ready || active || corrupt;
  $("launch-position").disabled = active;
  $("settings-open").disabled = active;
  $("history-clear").disabled = active;
  for (const button of $("lane-legend").children)
    button.disabled = !ready || active || corrupt;
  $("viewport").dataset.phase = active ? "drawing" : "ready";
  $("drop-label").textContent = active
    ? "공이 내려가고 있어요…"
    : state.history.length
      ? "한 번 더 떨어뜨리기"
      : "공 떨어뜨리기";
}
function resize() {
  if (!renderer) return;
  const { width, height } = $("viewport").getBoundingClientRect(),
    aspect = width / height;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  let distance = Math.max(25, 14 / aspect);
  const bounds = new THREE.Box3(
    new THREE.Vector3(-3.9, -1.1, -10),
    new THREE.Vector3(3.9, 1.3, 10),
  );
  for (let pass = 0; pass < 4; pass++) {
    camera.position.set(0, distance * 0.78, distance * 0.63);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    let ratio = 1;
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z]) {
          const p = new THREE.Vector3(x, y, z).project(camera);
          ratio = Math.max(ratio, Math.abs(p.x) / 0.97, Math.abs(p.y) / 0.97);
        }
    if (ratio <= 1) break;
    distance *= ratio * 1.02;
  }
  renderer.setSize(width, height, false);
}
function random() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] / 4294967296;
}
function hit(kind) {
  if (kind === "board") {
    brokenAt = performance.now();
    breakBoard.visible = false;
    for (const f of fragments) f.visible = true;
    tone(180, 0.12, 0.055);
  } else tone(kind === "bumper" ? 680 : 360, 0.045, 0.018);
}
function launch() {
  if (!ready || physics.active || corrupt) return;
  $("result").hidden = true;
  brokenAt = null;
  breakBoard.visible = true;
  for (const f of fragments) f.visible = false;
  for (const effect of effects) {
    rig.remove(effect.mesh);
    effect.mesh.geometry.dispose();
    effect.mesh.material.dispose();
  }
  effects = [];
  const x = Number($("launch-position").value) + (random() - 0.5) * 0.08;
  if (physics.launch(x, (random() - 0.5) * 2.6)) {
    launchedAt = performance.now();
    ballMesh.visible = true;
    controls(true);
    tone(750, 0.09, 0.05);
    status("공이 어디로 향할지 지켜보세요!");
  }
}
function finish(outcome) {
  controls(false);
  if (outcome.error) {
    status(outcome.error);
    return;
  }
  state = recordDraw(
    state,
    outcome.lane,
    `${Date.now()}-${Math.floor(random() * 1e9)}`,
    new Date().toISOString(),
  );
  persist();
  refresh();
  controls(false);
  const draw = state.history[0];
  $("viewport").dataset.lane = String(draw.lane);
  $("result").className = "result" + (draw.won ? "" : " miss");
  $("result-badge").textContent = draw.won ? "LUCKY! · 당첨" : "다음 기회에";
  $("result-title").textContent = draw.won ? draw.prize : "기합은 합격!";
  $("result-copy").textContent =
    `${draw.lane + 1}번 ${draw.won ? "금빛" : "남색"} 칸에 도착했어요.`;
  $("result").hidden = false;
  status("다시 떨어뜨리면 새로운 행운이 시작돼요.");
  tone(draw.won ? 880 : 330, 0.25, 0.04);
  if (draw.won && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (let i = 0; i < 22; i++) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 5, 4),
        new THREE.MeshBasicMaterial({ color: i % 2 ? 0xf3cf68 : 0xfff5cb }),
      );
      mesh.position.set((draw.lane - 2) * 1.3, 0.8, 7.5);
      rig.add(mesh);
      effects.push({
        mesh,
        start: performance.now(),
        vx: (random() - 0.5) * 3,
        vy: 2 + random() * 3,
        vz: (random() - 0.5) * 3,
      });
    }
  }
}
async function boot() {
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: $("scene"),
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.82;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xfff7e5, 0x786450, 1.3));
    const light = new THREE.DirectionalLight(0xfff4de, 1.5);
    light.position.set(-6, 14, 4);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    Object.assign(light.shadow.camera, {
      left: -12,
      right: 12,
      top: 12,
      bottom: -12,
      near: 0.1,
      far: 45,
    });
    light.shadow.bias = -0.0006;
    scene.add(light);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    room.dispose();
    pmrem.dispose();
    rig = new THREE.Group();
    rig.rotation.x = 0.11;
    scene.add(rig);
    const loader = new GLTFLoader();
    let count = 0;
    await Promise.all(
      names.map(async (name) => {
        const response = await fetch(asset(`assets/models/${name}.glb`), {
          signal: abort.signal,
        });
        if (!response.ok) throw new Error(`${name} 모델을 읽을 수 없어요.`);
        const result = await loader.parseAsync(
          await response.arrayBuffer(),
          "",
        );
        loaded[name] = result.scene;
        loaded[name].traverse((n) => {
          if (n.isMesh) {
            n.castShadow = true;
            n.receiveShadow = true;
          }
        });
        $("load-progress").textContent = `3D 부품 ${++count} / ${names.length}`;
      }),
    );
    if (disposed) {
      cleanup();
      return;
    }
    fit("board", [7.6, 0.65, 19.6], [0, -0.13, 0]);
    launcherMesh = fit("launcher", [1.1, 0.8, 1.75], [0, 0.1, -8.5]);
    for (const [x, z] of PEGS) fit("peg", [0.28, 0.5, 0.28], [x, 0.18, z]);
    BUMPERS.forEach(([x, z], i) =>
      fit(
        i % 2 ? "bumper-blue" : "bumper-red",
        [1.18, 0.65, 1.18],
        [x, 0.18, z],
      ),
    );
    for (const side of [-1, 1]) {
      fit(
        "side-cushion",
        [0.38, 0.28, 1.5],
        [side * 3.02, 0.22, -6],
        [Math.PI / 2, 0, 0],
      );
      for (const [i, z] of [-2.4, 2.6].entries())
        fit(
          i ? "cushion-blue" : "cushion-red",
          [0.65, 0.35, 1.05],
          [side * 2.96, 0.17, z],
          [0, (side * Math.PI) / 2, 0],
        );
    }
    for (const [i, x] of [-1.95, -0.65, 0.65, 1.95].entries())
      fit(
        i % 2 ? "cushion-red" : "cushion-blue",
        [0.35, 0.3, 0.55],
        [x, 0.14, 6.05],
      );
    breakBoard = fit("board-intact", [1.65, 0.83, 0.23], [-1.65, 0.18, 3.3]);
    fragments = [
      fit("board-left", [0.8, 0.82, 0.2], [-2.08, 0.18, 3.3]),
      fit("board-right", [0.8, 0.82, 0.2], [-1.22, 0.18, 3.3]),
    ];
    fragments.forEach((f) => (f.visible = false));
    fit("belt-ramp", [2.15, 0.62, 1.0], [1.55, 0.17, 3.5], [0, -0.15, 0]);
    makeLanes();
    ballMesh = fit("ball", [0.56, 0.56, 0.56], [0, 0.95, -8.4]);
    ballMesh.traverse((mesh) => {
      if (!mesh.isMesh) return;
      mesh.material = new THREE.MeshStandardMaterial({
        color: 0xffd44d,
        metalness: 0.55,
        roughness: 0.2,
        emissive: 0xffb800,
        emissiveIntensity: 0.28,
        envMapIntensity: 1.3,
      });
    });
    physics = createPhysics(hit);
    ready = true;
    $("loading").hidden = true;
    $("viewport").dataset.ready = "true";
    controls(false);
    resize();
    observer = new ResizeObserver(resize);
    observer.observe($("viewport"));
    lastTime = performance.now();
    frame = requestAnimationFrame(animate);
    send("pinball-ready");
  } catch (error) {
    if (disposed) return;
    console.error(error);
    $("loading").hidden = true;
    $("error").hidden = false;
    $("error-text").textContent =
      "3D 화면을 지원하는 브라우저인지 확인하고 다시 열어 주세요.";
    send("pinball-error");
  }
}
function animate(now) {
  if (disposed) return;
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  if (!paused) {
    if (physics?.active) {
      const outcome = physics.step(dt);
      const p = physics.ball.position;
      const lift = Math.max(0, 1 - (now - launchedAt) / 350) * 0.7;
      ballMesh.position.set(p.x, 0.25 + lift, p.z);
      ballMesh.rotation.x += physics.ball.velocity.z * dt * 2;
      ballMesh.rotation.z -= physics.ball.velocity.x * dt * 2;
      if (outcome) finish(outcome);
    } else if (ballMesh && $("result").hidden) {
      ballMesh.position.set(
        Number($("launch-position").value),
        0.95 + Math.sin(now / 450) * 0.025,
        -8.4,
      );
    }
    if (launcherMesh && !physics?.active)
      launcherMesh.position.x = Number($("launch-position").value);
    if (brokenAt !== null) {
      const t = Math.min((now - brokenAt) / 450, 1);
      fragments.forEach((f, i) => {
        f.rotation.z = (i ? 1 : -1) * t * 0.65;
        f.position.x = (i ? -1.22 : -2.08) + (i ? 1 : -1) * t * 0.25;
      });
    }
    effects = effects.filter((e) => {
      const age = (now - e.start) / 1000;
      if (age > 1.3) {
        rig.remove(e.mesh);
        e.mesh.geometry.dispose();
        e.mesh.material.dispose();
        return false;
      }
      e.mesh.position.x += e.vx * dt;
      e.mesh.position.y += e.vy * dt;
      e.mesh.position.z += e.vz * dt;
      e.vy -= 7 * dt;
      return true;
    });
    renderer.render(scene, camera);
  }
  frame = requestAnimationFrame(animate);
}
function setPaused(value) {
  paused = Boolean(value);
  $("paused").hidden = !paused || !physics?.active;
  lastTime = performance.now();
  if (paused) void audio?.suspend();
}
window.__pinballPause = setPaused;
const onVisibility = () => setPaused(document.hidden);
document.addEventListener("visibilitychange", onVisibility);
const onParent = (e) => {
  if (e.source !== window.parent || e.origin !== location.origin) return;
  try {
    const d = JSON.parse(e.data);
    if (d.type === "pinball-pause" && typeof d.paused === "boolean")
      setPaused(d.paused);
    if (d.type === "pinball-dispose") window.__pinballDispose?.();
  } catch {}
};
window.addEventListener("message", onParent);
$("launch-position").addEventListener("input", () => {
  if (!physics?.active) $("result").hidden = true;
});
$("drop").addEventListener("click", launch);
$("retry").addEventListener("click", () => location.reload());
$("sound").addEventListener("click", () => {
  state.settings.sound = !state.settings.sound;
  persist();
  refresh();
  tone();
});
$("settings-open").addEventListener("click", () => {
  $("prize").value = state.settings.prize;
  $("winning-bins").value = String(state.settings.winningBins);
  $("settings").showModal();
});
$("settings-close").addEventListener("click", () => $("settings").close());
$("settings-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (physics?.active) return;
  const prize = $("prize").value.trim();
  if (!prize) {
    $("prize").focus();
    return;
  }
  const count = Number($("winning-bins").value);
  state.settings = {
    ...state.settings,
    prize,
    winningBins: count,
    winningLaneIds:
      count === state.settings.winningBins
        ? selectedWinningLanes(state.settings)
        : winningLanes(count),
  };
  persist();
  refresh();
  if (ready) makeLanes();
  $("result").hidden = true;
  $("settings").close();
  status("새로운 뽑기 설정을 저장했어요.");
});
$("history-clear").addEventListener("click", () =>
  $("confirm-clear").showModal(),
);
$("clear-cancel").addEventListener("click", () => $("confirm-clear").close());
$("clear-confirm").addEventListener("click", () => {
  if (physics?.active) return;
  state.history = [];
  corrupt = false;
  storageWarning = "";
  persist();
  refresh();
  controls(false);
  $("confirm-clear").close();
  $("result").hidden = true;
  status("기록을 초기화했어요. 새로운 행운을 시작해 보세요.");
});
$("exit").addEventListener("click", () => {
  physics?.cancel();
  setPaused(true);
  if (config.native || window.parent !== window) send("pinball-exit");
  else location.href = "/";
});
$("scene").addEventListener("webglcontextlost", (e) => {
  e.preventDefault();
  physics?.cancel();
  ready = false;
  controls(false);
  $("error").hidden = false;
  $("error-text").textContent = "3D 화면이 중단됐어요. 다시 불러와 주세요.";
});
function cleanup() {
  cancelAnimationFrame(frame);
  observer?.disconnect();
  physics?.cancel();
  abort.abort();
  void audio?.close();
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
      Object.values(m).forEach((v) => {
        if (v?.isTexture) textures.add(v);
      });
    }
  };
  scene?.traverse(collect);
  Object.values(loaded).forEach((root) => root.traverse(collect));
  effects.forEach((e) => collect(e.mesh));
  textures.forEach((t) => t.dispose());
  materials.forEach((m) => m.dispose());
  geometries.forEach((g) => g.dispose());
  environment?.dispose();
  renderer?.dispose();
}
window.__pinballDispose = () => {
  disposed = true;
  document.removeEventListener("visibilitychange", onVisibility);
  window.removeEventListener("message", onParent);
  cleanup();
};
window.addEventListener("pagehide", () => window.__pinballDispose(), {
  once: true,
});
void boot();
