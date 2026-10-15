import * as C from "cannon-es";
import { laneAt } from "./state";

export const PEGS = [
  [-1.6, -6.6],
  [0, -6.6],
  [1.6, -6.6],
  [-2.1, -3.1],
  [-0.8, -3.1],
  [0.8, -3.1],
  [2.1, -3.1],
  [-2.1, -1.5],
  [-0.8, -1.5],
  [0.8, -1.5],
  [2.1, -1.5],
  [-0.9, 2.2],
  [0.9, 2.2],
  [-1.8, 4.8],
  [0, 4.8],
  [1.8, 4.8],
];
export const BUMPERS = [
  [-1.8, -4.7],
  [1.8, -4.7],
  [-1.8, 0.2],
  [1.8, 0.2],
];
export const BALL_RADIUS = 0.2;

// The rolling surface is simulated in its local X/Z plane; the renderer tilts
// the complete board. This keeps the small scanned mesh details out of collisions.
export function createPhysics(onHit = () => {}) {
  const world = new C.World({ gravity: new C.Vec3(0, 0, 5.8) });
  const wood = new C.Material("wood"),
    rubber = new C.Material("rubber"),
    gold = new C.Material("gold");
  world.defaultContactMaterial.friction = 0;
  world.addContactMaterial(
    new C.ContactMaterial(gold, wood, { friction: 0, restitution: 0.52 }),
  );
  world.addContactMaterial(
    new C.ContactMaterial(gold, rubber, { friction: 0, restitution: 1.05 }),
  );
  const fixed = (shape, x, z, kind, material = wood, angle = 0) => {
    const b = new C.Body({ mass: 0, material });
    b.addShape(shape);
    b.position.set(x, 0.35, z);
    b.quaternion.setFromAxisAngle(new C.Vec3(0, 1, 0), angle);
    b.kind = kind;
    world.addBody(b);
    return b;
  };
  const box = (x, z, w, d, kind = "wall", angle = 0) =>
    fixed(new C.Box(new C.Vec3(w / 2, 1, d / 2)), x, z, kind, wood, angle);
  const circle = (x, z, r, kind, material) =>
    fixed(new C.Sphere(r), x, z, kind, material);
  box(-3.35, 0, 0.2, 20);
  box(3.35, 0, 0.2, 20);
  box(0, -9.3, 7, 0.2);
  for (const [x, z] of PEGS) circle(x, z, 0.14, "peg", wood);
  for (const [x, z] of BUMPERS) circle(x, z, 0.57, "bumper", rubber);
  for (const side of [-1, 1]) {
    box(side * 3.02, -6, 0.38, 1.5, "cushion");
    for (const z of [-2.4, 2.6])
      box(side * 3.0, z, 0.3, 1.2, "cushion", side * 0.45);
  }
  // A curved belt deflector: two shallow segments that leave a path on both sides.
  box(1.9, 3.6, 1.4, 0.12, "belt", -0.35);
  box(1.0, 3.85, 0.65, 0.12, "belt", -0.1);
  const breaking = box(-1.65, 3.3, 1.65, 0.12, "board");
  for (const x of [-1.95, -0.65, 0.65, 1.95]) box(x, 7.65, 0.1, 3.5, "divider");
  const ball = new C.Body({
    mass: 1,
    shape: new C.Sphere(BALL_RADIUS),
    material: gold,
    linearDamping: 0.08,
  });
  ball.linearFactor.set(1, 0, 1);
  ball.angularFactor.set(0, 1, 0);
  let active = false,
    elapsed = 0,
    stale = 0,
    broken = false,
    pendingBreak = false,
    lastHit = 0;
  ball.addEventListener("collide", (event) => {
    const other = event.body;
    if (other === breaking && !broken) {
      broken = true;
      pendingBreak = true;
      breaking.collisionResponse = false;
      onHit("board", other.position);
    } else if (elapsed - lastHit > 0.06) {
      lastHit = elapsed;
      onHit(other.kind, other.position);
    }
  });
  return {
    ball,
    world,
    get active() {
      return active;
    },
    launch(x, impulse) {
      if (active) return false;
      if (!Number.isFinite(x) || !Number.isFinite(impulse))
        throw new Error("잘못된 출발 위치");
      if (!world.bodies.includes(breaking)) world.addBody(breaking);
      breaking.collisionResponse = true;
      broken = false;
      pendingBreak = false;
      ball.position.set(Math.max(-2.4, Math.min(2.4, x)), 0.35, -8.4);
      ball.velocity.set(Math.max(-1.4, Math.min(1.4, impulse)), 0, 1.5);
      ball.angularVelocity.setZero();
      ball.force.setZero();
      world.addBody(ball);
      active = true;
      elapsed = 0;
      stale = 0;
      return true;
    },
    step(dt) {
      if (!active) return null;
      world.step(1 / 120, Math.min(dt, 0.05), 6);
      elapsed += Math.min(dt, 0.05);
      if (pendingBreak) {
        world.removeBody(breaking);
        pendingBreak = false;
      }
      const p = ball.position;
      if (p.z > 8.15) {
        active = false;
        world.removeBody(ball);
        return { lane: laneAt(p.x) };
      }
      // Gentle releases from pin dead-centres do not select or force a result lane.
      stale = ball.velocity.length() < 0.25 ? stale + dt : 0;
      if (stale > 0.7) {
        ball.velocity.x += p.x < 0 ? 0.3 : -0.3;
        ball.velocity.z += 0.25;
        stale = 0;
      }
      if (
        elapsed > 30 ||
        !Number.isFinite(p.x) ||
        Math.abs(p.x) > 4 ||
        p.z > 11 ||
        p.z < -11
      ) {
        active = false;
        world.removeBody(ball);
        return { error: "공이 멈췄어요. 다시 떨어뜨려 주세요." };
      }
      return null;
    },
    cancel() {
      if (active) world.removeBody(ball);
      active = false;
    },
  };
}
