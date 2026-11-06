"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useLayoutEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import {
  Group,
  Mesh,
  Quaternion,
  Vector3,
  InstancedMesh,
  Object3D,
  Color,
  Matrix4,
  DoubleSide,
} from "three";
import { TrackballControls } from "three/addons/controls/TrackballControls.js";
import {
  directionVector,
  FRAMES,
  position,
  type Arrow,
  type Face,
  type Level,
  type Route,
  type Vec,
} from "../core/engine";

export type Motion = {
  id: string;
  kind: "extract" | "blocked";
  route: Route;
  startedAt: number;
  reduced: boolean;
};
const vec = (v: Vec) => new Vector3(...v);
const Y = new Vector3(0, 1, 0);
function headQuaternion(direction: Vector3, normal: Vector3) {
  const right = direction.clone().cross(normal).normalize();
  const up = right.clone().cross(direction).normalize();
  return new Quaternion().setFromRotationMatrix(
    new Matrix4().makeBasis(right, direction, up),
  );
}
function HeadGeometry({ dense }: { dense: boolean }) {
  const vertices = useMemo(
    () =>
      new Float32Array([
        dense ? -0.22 : -0.15,
        -0.12,
        0,
        dense ? 0.22 : 0.15,
        -0.12,
        0,
        0,
        dense ? 0.24 : 0.22,
        0,
      ]),
    [dense],
  );
  return (
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[vertices, 3]} />
    </bufferGeometry>
  );
}
function pathPoints(
  arrow: Arrow,
  level: Level,
  route?: Route,
  appendExit = true,
) {
  const cells = [...arrow.cells, ...(route?.steps.map((s) => s.cell) ?? [])];
  const points: Vector3[] = [];
  cells.forEach((cell, i) => {
    const p = vec(position(cell, level.gridSize, 0.07));
    if (i && cell.face !== cells[i - 1].face) {
      const a = points.at(-1)!,
        corner = a.clone().add(p).multiplyScalar(0.5);
      // Projeter les deux normales sur l'arête, pour ne pas couper dans le cube.
      for (const f of [cell.face, cells[i - 1].face]) {
        const n = vec(FRAMES[f].n);
        corner.addScaledVector(n, level.gridSize / 2 + 0.07 - corner.dot(n));
      }
      points.push(corner);
    }
    points.push(p);
  });
  if (route && appendExit)
    points.push(
      points
        .at(-1)!
        .clone()
        .addScaledVector(
          vec(directionVector(route.exit.cell.face, route.exit.direction)),
          arrow.cells.length + 2,
        ),
    );
  // Conserver les coudes et les points d'arête, fusionner les cellules alignées.
  return points.filter((p, i) => {
    if (i === 0 || i === points.length - 1) return true;
    const a = p.clone().sub(points[i - 1]),
      b = points[i + 1].clone().sub(p);
    return a.clone().cross(b).lengthSq() > 1e-8 || a.dot(b) <= 0;
  });
}
function sampler(points: Vector3[]) {
  const lengths = [0];
  for (let i = 1; i < points.length; i++)
    lengths.push(lengths[i - 1] + points[i].distanceTo(points[i - 1]));
  return {
    length: lengths.at(-1)!,
    at: (distance: number) => {
      const d = Math.max(0, Math.min(distance, lengths.at(-1)!));
      let i = 1;
      while (i < lengths.length - 1 && lengths[i] < d) i++;
      return points[i - 1]
        .clone()
        .lerp(
          points[i],
          (d - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1),
        );
    },
  };
}
function ArrowShape({
  arrow,
  level,
  motion,
  blocked,
  hint,
  onDone,
}: {
  arrow: Arrow;
  level: Level;
  motion: Motion | null;
  blocked: string[];
  hint: string | null;
  onTap: (id: string) => void;
  onDone: (id: string, kind: Motion["kind"]) => void;
}) {
  const group = useRef<Group>(null),
    finished = useRef(false);
  const active = motion?.id === arrow.id ? motion : null;
  const curve = useMemo(
    () =>
      sampler(
        pathPoints(arrow, level, active?.route, active?.kind !== "blocked"),
      ),
    [arrow, level, active],
  );
  const bodyLength = useMemo(
    () => sampler(pathPoints(arrow, level)).length,
    [arrow, level],
  );
  const segments = Math.ceil(bodyLength / 0.1);
  const color = blocked.includes(arrow.id)
    ? "#f33a4a"
    : hint === arrow.id
      ? "#0070f3"
      : "#152742";
  useFrame(() => {
    if (!group.current) return;
    const limit = Math.max(
      0,
      curve.length -
        bodyLength -
        (active?.kind === "blocked" ? (level.gridSize > 10 ? 0.38 : 0.31) : 0),
    );
    const outward = active?.reduced
      ? 40
      : Math.max(45, ((limit * 3) / level.gridSize / 48) * 1000);
    const duration = active?.kind === "blocked" ? 2 * outward + 20 : outward;
    const elapsed = active ? performance.now() - active.startedAt : 0;
    const progress = active ? Math.min(1, elapsed / duration) : 0;
    const phase =
      active?.kind === "blocked"
        ? elapsed < outward
          ? elapsed / outward
          : elapsed < outward + 20
            ? 1
            : Math.max(0, 1 - (elapsed - outward - 20) / outward)
        : progress;
    const travel = phase * limit;
    const children = group.current.children as Mesh[];
    for (let i = 0; i < segments; i++) {
      const a = curve.at(travel + (bodyLength * i) / segments),
        b = curve.at(travel + (bodyLength * (i + 1)) / segments),
        delta = b.clone().sub(a);
      children[i].position.copy(a).add(b).multiplyScalar(0.5);
      children[i].quaternion.setFromUnitVectors(Y, delta.clone().normalize());
      children[i].scale.set(1, delta.length() + 0.025, 1);
    }
    const head = curve.at(travel + bodyLength);
    const direction = active
      ? head
          .clone()
          .sub(curve.at(travel + bodyLength - 0.08))
          .normalize()
      : vec(directionVector(arrow.cells.at(-1)!.face, arrow.direction));
    children[segments].position.copy(head).addScaledVector(direction, 0.06);
    const normal = Object.values(FRAMES)
      .map((f) => vec(f.n))
      .sort(
        (a, b) =>
          Math.abs(head.dot(a) - level.gridSize / 2 - 0.07) -
          Math.abs(head.dot(b) - level.gridSize / 2 - 0.07),
      )[0];
    children[segments].quaternion.copy(headQuaternion(direction, normal));
    if (active && progress === 1 && !finished.current) {
      finished.current = true;
      onDone(arrow.id, active.kind);
    }
  });
  return (
    <group ref={group} renderOrder={3}>
      {Array.from({ length: segments }, (_, i) => (
        <mesh key={i}>
          <cylinderGeometry
            args={[
              level.gridSize > 10 ? 0.075 : 0.038,
              level.gridSize > 10 ? 0.075 : 0.038,
              1,
              6,
            ]}
          />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
      <mesh>
        <HeadGeometry dense={level.gridSize > 10} />
        <meshBasicMaterial color={color} side={DoubleSide} />
      </mesh>
    </group>
  );
}

function StaticArrows({
  arrows,
  level,
  blocked,
  hint,
  ghost = false,
}: {
  arrows: Arrow[];
  level: Level;
  blocked: string[];
  hint: string | null;
  onTap: (id: string) => void;
  ghost?: boolean;
}) {
  const bodies = useRef<InstancedMesh>(null),
    heads = useRef<InstancedMesh>(null);
  const { invalidate } = useThree();
  const data = useMemo(() => {
    const segments: { a: Vector3; b: Vector3; id: string }[] = [];
    const tips: {
      point: Vector3;
      direction: Vector3;
      normal: Vector3;
      id: string;
    }[] = [];
    for (const arrow of arrows) {
      const points = pathPoints(arrow, level);
      for (let i = 1; i < points.length; i++)
        segments.push({ a: points[i - 1], b: points[i], id: arrow.id });
      tips.push({
        point: points.at(-1)!,
        normal: vec(FRAMES[arrow.cells.at(-1)!.face].n),
        direction: vec(
          directionVector(arrow.cells.at(-1)!.face, arrow.direction),
        ),
        id: arrow.id,
      });
    }
    return { segments, tips };
  }, [arrows, level]);
  useLayoutEffect(() => {
    const object = new Object3D();
    const color = (id: string) =>
      new Color(
        ghost
          ? "#dceeff"
          : blocked.includes(id)
            ? "#f33a4a"
            : hint === id
              ? "#0070f3"
              : "#152742",
      );
    data.segments.forEach(({ a, b, id }, i) => {
      const delta = b.clone().sub(a);
      object.position.copy(a).add(b).multiplyScalar(0.5);
      object.quaternion.setFromUnitVectors(Y, delta.clone().normalize());
      object.scale.set(1, delta.length() + 0.025, 1);
      object.updateMatrix();
      bodies.current!.setMatrixAt(i, object.matrix);
      bodies.current!.setColorAt(i, color(id));
    });
    data.tips.forEach(({ point, direction, normal, id }, i) => {
      object.position.copy(point).addScaledVector(direction, 0.04);
      object.quaternion.copy(headQuaternion(direction, normal));
      object.scale.set(1, 1, 1);
      object.updateMatrix();
      heads.current!.setMatrixAt(i, object.matrix);
      heads.current!.setColorAt(i, color(id));
    });
    for (const mesh of [bodies.current, heads.current])
      if (mesh) {
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.computeBoundingSphere();
      }
    invalidate();
  }, [data, blocked, hint, ghost, invalidate]);
  return (
    <group renderOrder={ghost ? 0 : 3}>
      <instancedMesh
        key={`body-${data.segments.length}`}
        ref={bodies}
        args={[undefined, undefined, Math.max(1, data.segments.length)]}
        count={data.segments.length}

        raycast={ghost ? () => {} : undefined}
        renderOrder={ghost ? 0 : 3}
      >
        <cylinderGeometry
          args={[
            level.gridSize > 10 ? 0.075 : 0.038,
            level.gridSize > 10 ? 0.075 : 0.038,
            1,
            6,
          ]}
        />
        <meshBasicMaterial
          transparent
          opacity={ghost ? 0.24 : 1}
          depthTest={!ghost}
          depthWrite={!ghost}
        />
      </instancedMesh>
      <instancedMesh
        key={`head-${data.tips.length}`}
        ref={heads}
        args={[undefined, undefined, Math.max(1, data.tips.length)]}
        count={data.tips.length}

        raycast={ghost ? () => {} : undefined}
        renderOrder={ghost ? 0 : 3}
      >
        <HeadGeometry dense={level.gridSize > 10} />
        <meshBasicMaterial
          side={DoubleSide}
          transparent
          opacity={ghost ? 0.24 : 1}
          depthTest={!ghost}
          depthWrite={!ghost}
        />
      </instancedMesh>
    </group>
  );
}
function Controls({
  view,
  zoom,
  onReady,
}: {
  view: { face: Face | null; revision: number };
  zoom: number;
  onReady: () => void;
}) {
  const { camera, gl, invalidate } = useThree();
  const controls = useRef<TrackballControls | null>(null);
  useEffect(() => {
    const f = view.face ? FRAMES[view.face] : null;
    const distance = controls.current ? camera.position.length() : zoom;
    camera.position
      .copy(
        f
          ? vec(f.n)
              .multiplyScalar(8.5)
              .addScaledVector(vec(f.u), 0.8)
              .addScaledVector(vec(f.v), 0.8)
          : new Vector3(6, 5.2, 7),
      )
      .normalize()
      .multiplyScalar(distance);
    camera.up.copy(f ? vec(f.v) : new Vector3(0, 1, 0));
    camera.lookAt(0, 0, 0);
    const instance = new TrackballControls(camera, gl.domElement);
    controls.current = instance;
    instance.noPan = true;
    instance.staticMoving = true;
    instance.rotateSpeed = 5;
    instance.minDistance = 3.2;
    instance.maxDistance = 14;
    const changed = () => invalidate();
    const resize = () => instance.handleResize();
    instance.addEventListener("change", changed);
    instance.addEventListener("start", changed);
    gl.domElement.addEventListener("pointermove", changed);
    gl.domElement.addEventListener("wheel", changed);
    const observer = new ResizeObserver(resize);
    observer.observe(gl.domElement);
    window.addEventListener("scroll", resize, true);
    instance.update();
    invalidate();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", resize, true);
      gl.domElement.removeEventListener("pointermove", changed);
      gl.domElement.removeEventListener("wheel", changed);
      instance.dispose();
    };
  }, [camera, gl, invalidate, view, zoom]);
  const reported = useRef(false);
  useFrame(() => {
    controls.current?.update();
    if (!reported.current) {
      reported.current = true;
      requestAnimationFrame(onReady);
    }
  });
  return null;
}

function Selection({
  level,
  arrows,
  onTap,
}: {
  level: Level;
  arrows: Arrow[];
  onTap: (id: string) => void;
}) {
  const { camera, gl, size } = useThree();
  const segments = useMemo(
    () =>
      arrows.flatMap((arrow) => {
        const points = pathPoints(arrow, level),
          result: { id: string; a: Vector3; b: Vector3; normal: Vector3 }[] =
            [];
        for (let i = 1; i < points.length; i++) {
          const a = points[i - 1],
            b = points[i];
          const face = (Object.keys(FRAMES) as Face[]).find((f) => {
            const normal = vec(FRAMES[f].n);
            return (
              Math.abs(a.dot(normal) - level.gridSize / 2 - 0.07) < 1e-5 &&
              Math.abs(b.dot(normal) - level.gridSize / 2 - 0.07) < 1e-5
            );
          });
          if (face)
            result.push({ id: arrow.id, a, b, normal: vec(FRAMES[face].n) });
        }
        const head = arrow.cells.at(-1)!,
          a = vec(position(head, level.gridSize, 0.07));
        result.push({
          id: arrow.id,
          a,
          b: a
            .clone()
            .addScaledVector(
              vec(directionVector(head.face, arrow.direction)),
              0.22,
            ),
          normal: vec(FRAMES[head.face].n),
        });
        return result;
      }),
    [arrows, level],
  );
  useEffect(() => {
    const click = (event: MouseEvent) => {
      const box = gl.domElement.getBoundingClientRect(),
        x = event.clientX - box.left,
        y = event.clientY - box.top;
      const radius = (
        event as MouseEvent & {
          sourceCapabilities?: { firesTouchEvents: boolean };
        }
      ).sourceCapabilities?.firesTouchEvents
        ? 16
        : 12;
      let best: { id: string; distance: number; depth: number } | null = null;
      const screen = (p: Vector3) => {
        const q = p
          .clone()
          .multiplyScalar(3 / level.gridSize)
          .project(camera);
        return {
          x: ((q.x + 1) * size.width) / 2,
          y: ((1 - q.y) * size.height) / 2,
          z: q.z,
        };
      };
      for (const segment of segments) {
        const p = segment.a,
          surface = p.clone().multiplyScalar(3 / level.gridSize);
        if (segment.normal.dot(camera.position.clone().sub(surface)) <= 0)
          continue;
        const end = segment.b;
        const a = screen(p),
          b = screen(end);
        if (a.z > 1 || a.z < -1) continue;
        const dx = b.x - a.x,
          dy = b.y - a.y;
        const t = Math.max(
          0,
          Math.min(
            1,
            ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1),
          ),
        );
        const distance = Math.hypot(x - a.x - t * dx, y - a.y - t * dy);
        if (
          distance <= radius &&
          (!best ||
            distance < best.distance - 0.1 ||
            (Math.abs(distance - best.distance) < 0.1 && a.z < best.depth))
        )
          best = { id: segment.id, distance, depth: a.z };
      }
      if (best) onTap(best.id);
    };
    gl.domElement.addEventListener("click", click);
    return () => gl.domElement.removeEventListener("click", click);
  }, [camera, gl, size, level, segments, onTap]);
  return null;
}
function edgeBands(level: Level) {
  const groups = new Map<
    string,
    {
      center: Vector3;
      axis: number;
      tangent: Vector3;
      intervals: [number, number][];
    }
  >();
  const n = level.gridSize;
  for (const r of level.edgeRules.filter((r) => r.action === "continue")) {
    const cell = {
      face: r.face,
      x: r.direction === "east" ? n - 1 : r.direction === "west" ? 0 : r.index,
      y:
        r.direction === "north" ? n - 1 : r.direction === "south" ? 0 : r.index,
    };
    const center = vec(position(cell, n, 0)).addScaledVector(
      vec(directionVector(r.face, r.direction)),
      0.5,
    );
    const tangent = vec(
      r.direction === "east" || r.direction === "west"
        ? FRAMES[r.face].v
        : FRAMES[r.face].u,
    );
    const axis = [0, 1, 2].find(
      (i) => Math.abs(tangent.getComponent(i)) === 1,
    )!;
    const key = [
      axis,
      ...[0, 1, 2].filter((i) => i !== axis).map((i) => center.getComponent(i)),
    ].join(":");
    const group = groups.get(key) ?? { center, axis, tangent, intervals: [] };
    group.intervals.push([
      center.getComponent(axis) - 0.5,
      center.getComponent(axis) + 0.5,
    ]);
    groups.set(key, group);
  }
  const result: { center: Vector3; tangent: Vector3; length: number }[] = [];
  for (const { center, axis, tangent, intervals } of groups.values()) {
    intervals.sort((a, b) => a[0] - b[0]);
    let [start, end] = intervals[0];
    const add = () =>
      result.push({
        center: center.clone().setComponent(axis, (start + end) / 2),
        tangent,
        length: end - start,
      });
    for (const [a, b] of intervals.slice(1)) {
      if (a <= end) end = Math.max(end, b);
      else {
        add();
        start = a;
        end = b;
      }
    }
    add();
  }
  return result;
}
function ContinuationBand({
  band,
  size,
}: {
  band: ReturnType<typeof edgeBands>[number];
  size: number;
}) {
  const ref = useRef<Mesh>(null),
    { camera } = useThree();
  const normals = useMemo(
    () =>
      [0, 1, 2]
        .filter(
          (axis) =>
            Math.abs(Math.abs(band.center.getComponent(axis)) - size / 2) <
            1e-6,
        )
        .map((axis) => {
          const normal = new Vector3();
          normal.setComponent(axis, Math.sign(band.center.getComponent(axis)));
          return normal;
        }),
    [band, size],
  );
  useFrame(() => {
    if (ref.current) {
      const towardCamera = camera.position
        .clone()
        .sub(band.center.clone().multiplyScalar(3 / size));
      ref.current.visible = normals.some(
        (normal) => normal.dot(towardCamera) > 0,
      );
    }
  });
  return (
    <group renderOrder={10}>
      <mesh
        ref={ref}
        position={band.center}
        scale={[1, band.length, 1]}
        quaternion={new Quaternion().setFromUnitVectors(Y, band.tangent)}
        renderOrder={6}
      >
        <cylinderGeometry
          args={[size > 10 ? 0.11 : 0.035, size > 10 ? 0.11 : 0.035, 1, 8]}
        />
        <meshBasicMaterial
          color="#f2c94c"
          transparent
          opacity={1}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
function Scene({
  level,
  arrows,
  motion,
  blocked,
  hint,
  onTap,
  onDone,
  view,
  zoom,
  onReady,
}: SceneProps & { onReady: () => void }) {
  const n = level.gridSize;
  const bands = useMemo(() => edgeBands(level), [level]);
  return (
    <>
      <ambientLight intensity={1.7} />
      <directionalLight position={[5, 8, 7]} intensity={2.3} />
      <directionalLight position={[-5, -4, -3]} intensity={0.8} />
      <group scale={3 / n}>
        <StaticArrows
          arrows={arrows.filter((a) => a.id !== motion?.id)}
          level={level}
          blocked={blocked}
          hint={hint}
          onTap={onTap}
          ghost
        />
        <mesh renderOrder={1} onClick={(e) => e.stopPropagation()}>
          <boxGeometry args={[n, n, n]} />
          <meshBasicMaterial
            color="#f4fcff"
            toneMapped={false}
            transparent
            opacity={0.72}
            depthWrite
          />
        </mesh>
        {Object.entries(FRAMES).map(([face, frame]) => {
          const rotation = new Quaternion().setFromUnitVectors(
            new Vector3(0, 0, 1),
            vec(frame.n),
          );
          return (
            <group
              key={face}
              position={vec(frame.n).multiplyScalar(n / 2 + 0.012)}
              quaternion={rotation}
            >
              {Array.from({ length: n > 10 ? 0 : n - 1 }, (_, i) => (
                <group key={i}>
                  <mesh position={[i + 1 - n / 2, 0, 0]}>
                    <planeGeometry args={[0.012, n]} />
                    <meshBasicMaterial color="#cce5f3" />
                  </mesh>
                  <mesh position={[0, i + 1 - n / 2, 0]}>
                    <planeGeometry args={[n, 0.012]} />
                    <meshBasicMaterial color="#cce5f3" />
                  </mesh>
                </group>
              ))}
            </group>
          );
        })}
        {bands.map((band, i) => (
          <ContinuationBand key={i} band={band} size={n} />
        ))}
        <StaticArrows
          arrows={arrows.filter((a) => a.id !== motion?.id)}
          level={level}
          blocked={blocked}
          hint={hint}
          onTap={onTap}
        />
        {motion &&
          arrows
            .filter((a) => a.id === motion.id)
            .map((a) => (
              <ArrowShape
                key={a.id}
                arrow={a}
                level={level}
                motion={motion}
                blocked={blocked}
                hint={hint}
                onTap={onTap}
                onDone={onDone}
              />
            ))}
      </group>
      <Selection level={level} arrows={arrows} onTap={onTap} />
      <Controls view={view} zoom={zoom} onReady={onReady} />
    </>
  );
}
type SceneProps = {
  level: Level;
  arrows: Arrow[];
  motion: Motion | null;
  blocked: string[];
  hint: string | null;
  onTap: (id: string) => void;
  onDone: (id: string, kind: Motion["kind"]) => void;
  view: { face: Face | null; revision: number };
  zoom: number;
};
class WebGLBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="canvas-fallback" role="alert">
        Le rendu 3D est indisponible. Activez WebGL ou essayez un navigateur
        récent.
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function CubeScene(props: SceneProps) {
  const [ready, setReady] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const suppressTap = useRef(false);
  return (
    <WebGLBoundary>
      <div
        className="scene-container"
        aria-busy={!ready}
        onPointerDownCapture={(e) => {
          if (!pointers.current.size) suppressTap.current = false;
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.current.size > 1) suppressTap.current = true;
        }}
        onPointerMoveCapture={(e) => {
          const start = pointers.current.get(e.pointerId);
          if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6)
            suppressTap.current = true;
        }}
        onPointerUpCapture={(e) => pointers.current.delete(e.pointerId)}
        onPointerCancelCapture={(e) => pointers.current.delete(e.pointerId)}
        onClickCapture={(e) => {
          if (suppressTap.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <Canvas
          camera={{ position: [6, 5.2, 7], fov: 40 }}
          dpr={[1, 1.25]}
          frameloop={props.motion ? "always" : "demand"}
          fallback={<p>WebGL est nécessaire pour afficher le cube.</p>}
          aria-label="Cube 3D interactif : faites glisser pour tourner, touchez une flèche pour la libérer."
        >
          <Suspense fallback={null}>
            <Scene {...props} onReady={() => setReady(true)} />
          </Suspense>
        </Canvas>
        {!ready && (
          <div className="scene-loading" role="status">
            Préparation du cube…
          </div>
        )}
      </div>
    </WebGLBoundary>
  );
}
