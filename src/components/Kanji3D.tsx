import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

// --- tuning ---------------------------------------------------------------
const TARGET_SIZE = 6;        // world units the whole kanji fills
const STROKE_RADIUS = 0.22;   // "brush" thickness of each stroke tube
const RADIAL_SEGMENTS = 8;    // roundness of the tube
const SECONDS_PER_STROKE = 0.7;

export interface Kanji3DHandle {
  play: () => void;   // (re)draw every stroke from the start, one by one
  erase: () => void;  // clear the canvas
  next: () => void;   // reveal the next stroke instantly
  prev: () => void;   // hide the last stroke
  toggleRotate: () => void;
}

interface Kanji3DProps {
  /** KanjiVG stroke path "d" strings, already in correct stroke order. */
  strokes: string[];
}

/** Sample one SVG path "d" string into 2D points along its centerline. */
function sampleStroke(d: string): THREE.Vector2[] {
  const loader = new SVGLoader();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`;
  const { paths } = loader.parse(svg);
  const points: THREE.Vector2[] = [];
  for (const shapePath of paths) {
    for (const sub of shapePath.subPaths) {
      for (const p of sub.getPoints(20)) points.push(p);
    }
  }
  return points;
}

interface StrokeData {
  geometry: THREE.TubeGeometry;
  color: THREE.Color;
  start: THREE.Vector3;
}

/** Turn ordered stroke "d" strings into centered, scaled 3D tube geometries. */
function buildStrokes(strokes: string[]): StrokeData[] {
  const sampled = strokes.map(sampleStroke).filter((p) => p.length > 1);
  if (sampled.length === 0) return [];

  // KanjiVG uses a Y-down coordinate system; center on the combined bbox.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of sampled) {
    for (const p of s) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const scale = TARGET_SIZE / Math.max(maxX - minX, maxY - minY, 1);
  const to3D = (p: THREE.Vector2) =>
    new THREE.Vector3((p.x - cx) * scale, -(p.y - cy) * scale, 0);

  return sampled.map((pts, i) => {
    const points3D = pts.map(to3D);
    const curve = new THREE.CatmullRomCurve3(points3D);
    const tubular = Math.max(24, points3D.length * 2);
    const geometry = new THREE.TubeGeometry(
      curve,
      tubular,
      STROKE_RADIUS,
      RADIAL_SEGMENTS,
      false,
    );
    const hue = ((200 + i * 28) % 360) / 360;
    const color = new THREE.Color().setHSL(hue, 0.9, 0.55);
    return { geometry, color, start: points3D[0] };
  });
}

interface AnimState {
  drawn: number;    // how many strokes are fully drawn
  progress: number; // 0..1 progress of the stroke currently being drawn
  playing: boolean;
}

function StrokeScene({
  data,
  state,
  autoRotate,
}: {
  data: StrokeData[];
  state: React.MutableRefObject<AnimState>;
  autoRotate: boolean;
}) {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const dots = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((_, delta) => {
    const s = state.current;
    const total = data.length;

    if (s.playing && s.drawn < total) {
      s.progress += delta / SECONDS_PER_STROKE;
      while (s.progress >= 1 && s.drawn < total) {
        s.progress -= 1;
        s.drawn += 1;
      }
      if (s.drawn >= total) {
        s.drawn = total;
        s.progress = 0;
        s.playing = false;
      }
    }

    for (let i = 0; i < total; i++) {
      let frac = 0;
      if (i < s.drawn) frac = 1;
      else if (i === s.drawn) frac = Math.min(s.progress, 1);

      const mesh = meshes.current[i];
      if (mesh) {
        const geo = mesh.geometry as THREE.TubeGeometry;
        const { tubularSegments, radialSegments } = geo.parameters;
        const rings = Math.round(frac * tubularSegments);
        geo.setDrawRange(0, rings * radialSegments * 6);
        mesh.visible = frac > 0;
      }
      const dot = dots.current[i];
      if (dot) dot.visible = frac > 0;
    }
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 6, 8]} intensity={1.1} />
      <directionalLight position={[-5, -3, 4]} intensity={0.4} />
      {data.map((d, i) => (
        <group key={i}>
          <mesh
            ref={(el) => {
              meshes.current[i] = el;
            }}
            geometry={d.geometry}
          >
            <meshStandardMaterial color={d.color} roughness={0.35} metalness={0.15} />
          </mesh>
          <mesh
            ref={(el) => {
              dots.current[i] = el;
            }}
            position={d.start}
          >
            <sphereGeometry args={[STROKE_RADIUS * 1.4, 16, 16]} />
            <meshStandardMaterial color={d.color} roughness={0.3} />
          </mesh>
        </group>
      ))}
      <OrbitControls
        enablePan={false}
        autoRotate={autoRotate}
        autoRotateSpeed={2.5}
        minDistance={6}
        maxDistance={20}
      />
    </>
  );
}

const Kanji3D = forwardRef<Kanji3DHandle, Kanji3DProps>(({ strokes }, ref) => {
  const data = useMemo(() => buildStrokes(strokes), [strokes]);
  const state = useRef<AnimState>({ drawn: 0, progress: 0, playing: false });
  const [autoRotate, setAutoRotate] = useState(false);

  // (Re)start the drawing animation whenever the kanji (its strokes) changes.
  useEffect(() => {
    state.current.drawn = 0;
    state.current.progress = 0;
    state.current.playing = data.length > 0;
    return () => {
      data.forEach((d) => d.geometry.dispose());
    };
  }, [data]);

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        state.current.drawn = 0;
        state.current.progress = 0;
        state.current.playing = data.length > 0;
      },
      erase: () => {
        state.current.drawn = 0;
        state.current.progress = 0;
        state.current.playing = false;
      },
      next: () => {
        const s = state.current;
        s.playing = false;
        s.progress = 0;
        s.drawn = Math.min(s.drawn + 1, data.length);
      },
      prev: () => {
        const s = state.current;
        s.playing = false;
        s.progress = 0;
        s.drawn = Math.max(s.drawn - 1, 0);
      },
      toggleRotate: () => setAutoRotate((v) => !v),
    }),
    [data],
  );

  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 45 }}
      gl={{ alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <StrokeScene data={data} state={state} autoRotate={autoRotate} />
    </Canvas>
  );
});

Kanji3D.displayName = 'Kanji3D';

export default Kanji3D;
