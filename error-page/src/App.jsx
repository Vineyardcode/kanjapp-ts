import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader'
import React, { Suspense, useState, useEffect, useMemo, useRef } from 'react'
import { Canvas, useLoader, useFrame } from '@react-three/fiber'
import { CameraControls, Trail, Float, Stars, Text3D, Center } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import './App.css'
import kvg_index from './assets/kvg_index.json'
import asiana from './assets/fonts/Asiana_Regular'

// --- tuning ---------------------------------------------------------------
const DRAW_SECONDS = 5       // time to draw a full character, stroke by stroke
const HOLD_SECONDS = 10      // time a finished character stays before switching
const CHARACTER_SIZE = 90    // world units the kanji is scaled to fill
const STROKE_RADIUS = 1.1
const TUBULAR_SEGMENTS = 120
const RADIAL_SEGMENTS = 8

// Read the current error message from the URL, e.g.
//   /?message=Server%20under%20maintenance&code=503
function readError() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const raw = params.get('message')
  const message = raw && raw.trim() ? raw.trim() : 'Something went wrong. Please try again later.'
  return { code, message }
}

// Greedy word-wrap so long messages fit the 3D text block.
function wrapText(text, maxChars) {
  const lines = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    if (line && (line + ' ' + word).length > maxChars) {
      lines.push(line)
      line = word
    } else {
      line = line ? line + ' ' + word : word
    }
  }
  if (line) lines.push(line)
  return lines
}

// Parse a KanjiVG SVG into centered, scaled 3D tube geometries — one per stroke,
// in stroke order.
function buildStrokes(data) {
  const rawStrokes = []
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

  for (const shapePath of data.paths) {
    const subPaths = shapePath.subPaths && shapePath.subPaths.length
      ? shapePath.subPaths
      : [shapePath.currentPath]
    const pts = []
    for (const sub of subPaths) {
      if (!sub) continue
      for (const p of sub.getPoints(30)) {
        pts.push(p)
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x)
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y)
      }
    }
    if (pts.length >= 2) rawStrokes.push(pts)
  }
  if (rawStrokes.length === 0) return []

  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const scale = CHARACTER_SIZE / Math.max(maxX - minX, maxY - minY, 1)

  return rawStrokes.map((pts) => {
    // KanjiVG is Y-down; negate Y so the character is upright.
    const pts3 = pts.map((p) => new THREE.Vector3((p.x - cx) * scale, -(p.y - cy) * scale, 0))
    const curve = new THREE.CatmullRomCurve3(pts3)
    const geometry = new THREE.TubeGeometry(curve, TUBULAR_SEGMENTS, STROKE_RADIUS, RADIAL_SEGMENTS, false)
    return { geometry, curve }
  })
}

// Draws one kanji stroke-by-stroke over DRAW_SECONDS, then holds it. A single
// "pen" tip rides the stroke currently being drawn — it is not left behind on
// finished strokes and vanishes once the whole character is complete.
function KanjiStrokes({ url }) {
  const data = useLoader(SVGLoader, url)
  const strokes = useMemo(() => buildStrokes(data), [data])
  const meshRefs = useRef([])
  const penGroup = useRef()
  const penMesh = useRef()
  const start = useRef(null)

  useEffect(() => {
    start.current = null
    return () => strokes.forEach((s) => s.geometry.dispose())
  }, [strokes])

  useFrame((state) => {
    if (start.current === null) start.current = state.clock.elapsedTime
    const elapsed = state.clock.elapsedTime - start.current
    const n = strokes.length
    // global progress in "stroke units": 0..n across DRAW_SECONDS
    const g = n ? Math.min(elapsed / DRAW_SECONDS, 1) * n : 0

    for (let i = 0; i < n; i++) {
      const frac = g >= i + 1 ? 1 : g > i ? g - i : 0
      const mesh = meshRefs.current[i]
      if (!mesh) continue
      const geo = mesh.geometry
      const { tubularSegments, radialSegments } = geo.parameters
      const rings = Math.round(frac * tubularSegments)
      geo.setDrawRange(0, rings * radialSegments * 6)
      mesh.visible = frac > 0
    }

    // Position the pen at the tip of the stroke being drawn; hide it once the
    // whole character is finished so no spark lingers on completed strokes.
    const done = n === 0 || g >= n
    if (penGroup.current) penGroup.current.visible = !done
    if (!done && penMesh.current) {
      const active = Math.min(Math.floor(g), n - 1)
      const fracInStroke = Math.min(g - active, 1)
      const tip = strokes[active].curve.getPointAt(fracInStroke)
      penMesh.current.position.copy(tip)
    }
  })

  return (
    <>
      {strokes.map((s, i) => (
        <mesh key={i} ref={(el) => (meshRefs.current[i] = el)} geometry={s.geometry}>
          <meshBasicMaterial color={[3, 0.3, 6]} toneMapped={false} />
        </mesh>
      ))}
      <group ref={penGroup}>
        <Trail width={7} length={6} color={new THREE.Color(4, 1, 10)} attenuation={(w) => w * w}>
          <mesh ref={penMesh}>
            <sphereGeometry args={[1.6]} />
            <meshBasicMaterial color={[8, 2, 12]} toneMapped={false} />
          </mesh>
        </Trail>
      </group>
    </>
  )
}

// Picks a random character, then switches to a new one every (draw + hold).
function PathManager() {
  const [randomName, setRandomName] = useState('')
  const [randomCharacter, setRandomCharacter] = useState('')

  useEffect(() => {
    const keys = Object.keys(kvg_index)
    const pick = () => {
      const ch = keys[Math.floor(Math.random() * keys.length)]
      const files = kvg_index[ch]
      const file = files[Math.floor(Math.random() * files.length)]
      setRandomCharacter(ch)
      setRandomName(file)
    }
    pick()
    const id = setInterval(pick, (DRAW_SECONDS + HOLD_SECONDS) * 1000)
    return () => clearInterval(id)
  }, [])

  if (!randomName) return null

  return (
    <group onClick={() => window.open(`https://en.wiktionary.org/wiki/${randomCharacter}`, '_blank')}>
      <Suspense fallback={null}>
        {/* key restarts the draw animation whenever the character changes */}
        <KanjiStrokes key={randomName} url={`/${randomName}`} />
      </Suspense>
    </group>
  )
}

export default function App() {
  const { code, message } = readError()
  const lines = []
  if (code) lines.push(`Error ${code}`)
  for (const l of wrapText(message, 24)) lines.push(l)
  const text = lines.join('\n')

  return (
    <Canvas camera={{ position: [0, 0, 220] }}>
      <color attach="background" args={['black']} />

      <Center position={[0, 72, 0]}>
        <Text3D font={asiana} size={9} height={1.5} curveSegments={4} bevelEnabled={false}>
          {text}
          <meshNormalMaterial />
        </Text3D>
      </Center>

      <Float speed={3} rotationIntensity={0.4} floatIntensity={1.5}>
        <group position={[0, -25, 0]}>
          <PathManager />
        </group>
      </Float>

      <Stars saturation={0} count={400} speed={0.5} />

      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={0.7} radius={0.7} />
      </EffectComposer>

      <CameraControls />
    </Canvas>
  )
}
