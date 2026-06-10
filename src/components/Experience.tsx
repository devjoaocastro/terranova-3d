import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html, RoundedBox, Stars, useCursor, useScroll } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import { easing } from '../lib/easing'
import { PAGES, setScrollEl } from '../scrollBus'

/** World depth: the camera flies from z=10 down the avenue to -DEPTH+10 */
const DEPTH = (PAGES - 1) * 18 // 108

/* ------------------------------------------------------------------ */
/* City — ~420 instanced buildings that RISE FROM THE GROUND as the    */
/* camera approaches them with the scroll. Some carry warm rooftop     */
/* beacons that pop once the building completes.                       */
/* ------------------------------------------------------------------ */

const BUILDING_COUNT = 420

type Building = { x: number; z: number; h: number; w: number; t: number }

function City() {
  const mesh = useRef<THREE.InstancedMesh>(null!)
  const beacons = useRef<THREE.InstancedMesh>(null!)
  const scroll = useScroll()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const buildings = useMemo<Building[]>(() => {
    const rng = (a: number, b: number) => a + Math.random() * (b - a)
    const arr: Building[] = []
    for (let i = 0; i < BUILDING_COUNT; i++) {
      const side = Math.random() < 0.5 ? -1 : 1
      const x = side * rng(2.8, 15)
      const z = 8 - Math.random() * (DEPTH + 34)
      // taller towers deeper into the journey
      const depthBoost = Math.min(1, -z / DEPTH)
      const h = rng(0.8, 2.2) + Math.pow(Math.random(), 1.7) * 6 * (0.5 + depthBoost)
      const w = rng(0.6, 1.9)
      // build trigger: rises shortly before the camera reaches it
      const t = THREE.MathUtils.clamp((-z - 2) / (DEPTH + 26), 0, 0.93) + rng(-0.045, 0.02)
      arr.push({ x, z, h, w, t: Math.max(0, t) })
    }
    return arr
  }, [])

  const beaconSet = useMemo(() => buildings.filter((b, i) => i % 6 === 0 && b.h > 3.5), [buildings])

  useFrame(() => {
    const o = scroll.offset
    buildings.forEach((b, i) => {
      const s = THREE.MathUtils.smoothstep(o, b.t, b.t + 0.06)
      dummy.position.set(b.x, (b.h * s) / 2, b.z)
      dummy.scale.set(b.w, Math.max(0.001, b.h * s), b.w)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true

    beaconSet.forEach((b, i) => {
      const s = THREE.MathUtils.smoothstep(o, b.t, b.t + 0.06)
      dummy.position.set(b.x, b.h * s + 0.09, b.z)
      dummy.scale.setScalar(s > 0.98 ? 1 : 0.001)
      dummy.updateMatrix()
      beacons.current.setMatrixAt(i, dummy.matrix)
    })
    beacons.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={mesh} args={[undefined, undefined, BUILDING_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0b1830" roughness={0.85} metalness={0.25} />
      </instancedMesh>
      <instancedMesh ref={beacons} args={[undefined, undefined, beaconSet.length]}>
        <boxGeometry args={[0.14, 0.14, 0.14]} />
        <meshBasicMaterial color="#e8c285" toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Ground — dark plane + faint brass grid (survey-map aesthetic)       */
/* ------------------------------------------------------------------ */

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -DEPTH / 2]}>
        <planeGeometry args={[120, DEPTH + 140]} />
        <meshStandardMaterial color="#030d1f" roughness={0.95} metalness={0} />
      </mesh>
      <gridHelper
        args={[240, 120, '#1b3a5c', '#0a1f3a']}
        position={[0, 0.01, -DEPTH / 2]}
      />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* DistrictPin — glowing survey pin with pulsing ground ring + label.  */
/* Hubtown's map navigation, reimagined as 3D markers in the city.     */
/* ------------------------------------------------------------------ */

function DistrictPin({
  position,
  name,
  count,
}: {
  position: [number, number, number]
  name: string
  count: string
}) {
  const ring = useRef<THREE.Mesh>(null!)
  const group = useRef<THREE.Group>(null!)
  const label = useRef<HTMLDivElement>(null)
  const scroll = useScroll()
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const pulse = 1 + Math.sin(t * 2.4) * 0.25
    ring.current.scale.setScalar(pulse)
    ;(ring.current.material as THREE.MeshBasicMaterial).opacity = 0.5 - Math.sin(t * 2.4) * 0.2
    easing.damp3(group.current.scale, hovered ? 1.35 : 1, 0.18, delta)

    // HTML labels ignore fog/depth — only show them while the Territory
    // section (page 3) is on screen, fading in/out with the scroll.
    if (label.current) {
      const sec = scroll.offset * (PAGES - 1)
      const visibility = Math.max(0, 1 - Math.abs(sec - 3) * 1.6)
      label.current.style.opacity = visibility.toFixed(3)
      label.current.style.display = visibility < 0.04 ? 'none' : ''
    }
  })

  return (
    <group
      ref={group}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* mast */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 1.6, 8]} />
        <meshStandardMaterial color="#c8a96a" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* glowing head */}
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshBasicMaterial color={hovered ? '#ffe3ad' : '#e8c285'} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.7, 0]} intensity={hovered ? 10 : 4} distance={7} color="#e8c285" />
      {/* pulsing ground ring */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.55, 0.62, 48]} />
        <meshBasicMaterial color="#c8a96a" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* label */}
      <Html center position={[0, 2.35, 0]} className="pin-html" zIndexRange={[20, 0]}>
        <div ref={label} className={`pin-label ${hovered ? 'pin-label--hot' : ''}`} style={{ opacity: 0, display: 'none' }}>
          <strong>{name}</strong>
          <span>{count} developments</span>
        </div>
      </Html>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* DevelopmentBoard — billboard with curated photography that lifts    */
/* and tilts towards the cursor.                                       */
/* ------------------------------------------------------------------ */

function useSafeTexture(url: string) {
  const [tex, setTex] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    let alive = true
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    loader.load(
      url,
      (t) => {
        if (!alive) return
        t.colorSpace = THREE.SRGBColorSpace
        setTex(t)
      },
      undefined,
      () => {}, // offline → keep the dark panel
    )
    return () => {
      alive = false
    }
  }, [url])

  return tex
}

function DevelopmentBoard({
  position,
  rotation,
  image,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  image: string
}) {
  const group = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)
  const texture = useSafeTexture(image)

  useFrame((state, delta) => {
    const target: [number, number, number] = hovered
      ? [-state.pointer.y * 0.35, state.pointer.x * 0.35, 0]
      : rotation
    easing.dampE(group.current.rotation, target, 0.2, delta)
    easing.damp3(
      group.current.position,
      hovered ? [position[0], position[1] + 0.25, position[2]] : position,
      0.2,
      delta,
    )
  })

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      <RoundedBox args={[2.6, 3.4, 0.1]} radius={0.06} smoothness={4}>
        <meshStandardMaterial color="#0b1830" metalness={0.5} roughness={0.4} />
      </RoundedBox>
      {texture && (
        <mesh position={[0, 0, 0.07]}>
          <planeGeometry args={[2.4, 3.2]} />
          <meshBasicMaterial map={texture} />
        </mesh>
      )}
      {/* brass edge light */}
      <mesh position={[0, -1.78, 0]}>
        <boxGeometry args={[2.6, 0.04, 0.12]} />
        <meshBasicMaterial color="#e8c285" toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Monolith — the flagship tower that completes during the Legacy      */
/* section, crowned with light.                                        */
/* ------------------------------------------------------------------ */

function Monolith({ z }: { z: number }) {
  const body = useRef<THREE.Mesh>(null!)
  const crown = useRef<THREE.Mesh>(null!)
  const scroll = useScroll()

  useFrame(() => {
    const r = scroll.range(4.2 / (PAGES - 1), 1.1 / (PAGES - 1))
    const h = Math.max(0.001, r * 13)
    body.current.scale.set(1, h, 1)
    body.current.position.y = h / 2
    crown.current.position.y = h + 0.12
    crown.current.scale.setScalar(r > 0.97 ? 1 : 0.001)
  })

  return (
    <group position={[6.5, 0, z]}>
      <mesh ref={body}>
        <boxGeometry args={[2.4, 1, 2.4]} />
        <meshStandardMaterial color="#11243f" roughness={0.5} metalness={0.55} />
      </mesh>
      <mesh ref={crown}>
        <boxGeometry args={[2.5, 0.1, 2.5]} />
        <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Sunrise — warm glowing disc on the horizon, the journey's finale    */
/* ------------------------------------------------------------------ */

function Sunrise() {
  const sun = useRef<THREE.Mesh>(null!)
  const scroll = useScroll()

  useFrame((state) => {
    // the sun lifts above the horizon during the last stretch
    const r = scroll.range(5.2 / (PAGES - 1), 1.6 / (PAGES - 1))
    sun.current.position.y = -4 + r * 7
    const breathe = 1 + Math.sin(state.clock.elapsedTime * 1.2) * 0.02
    sun.current.scale.setScalar(breathe)
  })

  return (
    <group position={[0, 0, -DEPTH - 26]}>
      <mesh ref={sun} position={[0, -4, 0]}>
        <sphereGeometry args={[5.4, 48, 48]} />
        <meshBasicMaterial color="#ffb36b" toneMapped={false} />
      </mesh>
      <pointLight position={[0, 4, 4]} intensity={120} distance={60} color="#ff9d52" />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Experience root — flying camera, mouse-reveal light, city, post FX  */
/* ------------------------------------------------------------------ */

export default function Experience() {
  const scroll = useScroll()
  const mouseLight = useRef<THREE.PointLight>(null!)

  useEffect(() => {
    setScrollEl(scroll.el)
  }, [scroll.el])

  useFrame((state, delta) => {
    const o = scroll.offset
    const z = -o * DEPTH + 10

    // fly down the avenue + gentle mouse parallax
    easing.damp3(
      state.camera.position,
      [state.pointer.x * 1.3, 2.3 - state.pointer.y * 0.45, z],
      0.3,
      delta,
    )
    state.camera.lookAt(state.pointer.x * 2.2, 1.7, z - 9)

    // zoom transition: subtle dolly-zoom settle on each section
    const cam = state.camera as THREE.PerspectiveCamera
    const sec = o * (PAGES - 1)
    const frac = Math.abs(sec - Math.round(sec))
    const targetFov = 44 - (1 - Math.min(1, frac * 2.5)) * 3
    cam.fov = THREE.MathUtils.damp(cam.fov, targetFov, 4, delta)
    cam.updateProjectionMatrix()

    // mouse-reveal: a warm light that explores the dark city with you
    mouseLight.current.position.set(state.pointer.x * 11, 2.6, z - 5)

    document.documentElement.style.setProperty('--scroll', o.toFixed(4))
  })

  return (
    <>
      {/* a city at night: almost dark, revealed by light */}
      <ambientLight intensity={0.16} />
      <directionalLight position={[8, 18, -10]} intensity={0.35} color="#4a6fa5" />
      <pointLight ref={mouseLight} intensity={95} distance={17} color="#c8a96a" />

      <Stars radius={110} depth={60} count={2600} factor={4} saturation={0} fade speed={0.4} />

      <Ground />
      <City />
      <Monolith z={-92} />
      <Sunrise />

      {/* Territory — district pins (page 3, z ≈ -44) */}
      <DistrictPin position={[-5.5, 0, -40]} name="Riverside" count="09" />
      <DistrictPin position={[4.8, 0, -45]} name="Old Town" count="12" />
      <DistrictPin position={[-3.8, 0, -50]} name="Atlantic Coast" count="18" />
      <DistrictPin position={[6.4, 0, -53]} name="The Hills" count="06" />

      {/* Developments — photo billboards (page 4, z ≈ -62) */}
      <DevelopmentBoard
        position={[-4.6, 2.3, -60]}
        rotation={[0, 0.4, 0]}
        image="https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?auto=format&fit=crop&w=900&q=80"
      />
      <DevelopmentBoard
        position={[0, 2.5, -64]}
        rotation={[0, 0, 0]}
        image="https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=900&q=80"
      />
      <DevelopmentBoard
        position={[4.6, 2.3, -68]}
        rotation={[0, -0.4, 0]}
        image="https://images.unsplash.com/photo-1431576901776-e539bd916ba2?auto=format&fit=crop&w=900&q=80"
      />

      <EffectComposer>
        <Bloom intensity={0.7} luminanceThreshold={0.3} luminanceSmoothing={0.7} mipmapBlur />
        <Noise opacity={0.045} />
        <Vignette offset={0.15} darkness={0.88} />
      </EffectComposer>
    </>
  )
}
