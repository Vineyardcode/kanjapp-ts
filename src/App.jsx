import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader'
import React, { Suspense, useState, useEffect, useMemo, useRef } from 'react'
import { Canvas, useLoader, useThree, useFrame } from '@react-three/fiber'
import { useTransition, useSpring, a } from '@react-spring/three'
import { CameraControls, CatmullRomLine, Line, Trail, Float, Stars, Text3D, Center } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import './App.css'
import kvg_index from './assets/kvg_index.json'
import asiana from './assets/fonts/Asiana_Regular'

function Spark({ radius = 5, speed = 0.3, path, ...props }) {
  const ref = useRef();
  const position = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const t = Math.sin(state.clock.getElapsedTime() * speed);

    const point = path.getPointAt((t + 1) / 2);

    position.set(point.x, point.y, point.z);
    ref.current.position.copy(position);
  });

  return (
    <group {...props}>
      <Trail width={15} length={10} color={new THREE.Color(2, 1, 10)} attenuation={(t) => t * t}>
        <mesh ref={ref}>
          <sphereGeometry args={[1]} />
          <meshBasicMaterial color={[6, 0.5, 2]} toneMapped={false} />        
        </mesh>
      </Trail>
    </group>
  );
}

const TubeComponent = ({ path }) => {
  const tubeRef = useRef();
  const geometry = useMemo(() => {
    const tubeRadius = 0.75; 
    const curves = path.curves.map(curve => {
      const v0 = new THREE.Vector3(...curve.v0);
      const v1 = new THREE.Vector3(...curve.v1);
      const v2 = new THREE.Vector3(...curve.v2);
      const v3 = new THREE.Vector3(...curve.v3);

      return new THREE.CubicBezierCurve3(v0, v1, v2, v3);
    });

    const pathCurve = new THREE.CatmullRomCurve3(curves.flatMap(curve => curve.getPoints(50)));

    return new THREE.TubeGeometry(pathCurve, 100, tubeRadius, 50, false);
  }, [path]);

  return (
    <line ref={tubeRef}>
      <bufferGeometry attach="geometry" {...geometry} />
      <lineBasicMaterial attach="material" color={0xff00ff} />
    </line>
  );
};

const PathManager = () => {
  const [randomName, setRandomName] = useState('');
  
  useEffect(() => {
    const generateRandomName = () => {
      const randomCharacter = Object.keys(kvg_index)[Math.floor(Math.random() * Object.keys(kvg_index).length)];
      const randomFileNames = kvg_index[randomCharacter];
      const randomFileName = randomFileNames[Math.floor(Math.random() * randomFileNames.length)];
      setRandomName(randomFileName);
    };
  
    generateRandomName();
  
    const intervalId = setInterval(generateRandomName, 3000);
  
    return () => clearInterval(intervalId);
  }, []);
  const data = useLoader(SVGLoader, `/${randomName}`);

  return (
    <>
      {data.paths && data.paths.map((path, index) => (
        <React.Fragment key={index}>
          <TubeComponent path={path.currentPath} />
          <Spark path={path.currentPath} />
        </React.Fragment>
      ))}
    </>
  );
};

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 200] }}>
      <color attach="background" args={['black']} />
          <Text3D
            font={asiana}
            position={[-90, 50, 100]}
            scale={5}
            material={new THREE.MeshNormalMaterial}
          >
            Closed for server migration. Please check in later... 
          </Text3D>
      <Float speed={4} rotationIntensity={1} floatIntensity={2}>
        <group rotation={[Math.PI,0,0]} position={[-50,50,0]}>
          <PathManager />
        </group>
      </Float>
      <Stars saturation={0} count={400} speed={0.5} />
      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={0.5} radius={0.7} />
      </EffectComposer>
      <CameraControls />
    </Canvas>
  )
}
