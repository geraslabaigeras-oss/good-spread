"use client"
import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { geoEquirectangular, geoGraticule, geoPath } from "d3-geo"
import { feature, mesh } from "topojson-client"
import type { Topology, GeometryCollection } from "topojson-specification"
import type { Airport } from "@/lib/flow/scenario"

const PLANE =
  "M0,-9 C1,-9 1.3,-7 1.3,-5.5 L1.3,-2 L8.5,2.5 L8.5,4.5 L1.3,2.4 L1.3,6 L3.6,7.8 L3.6,9.3 L0,8.4 L-3.6,9.3 L-3.6,7.8 L-1.3,6 L-1.3,2.4 L-8.5,4.5 L-8.5,2.5 L-1.3,-2 L-1.3,-5.5 C-1.3,-7 -1,-9 0,-9Z"

const ll = (lat: number, lon: number, R = 1) => {
  const p = ((90 - lat) * Math.PI) / 180
  const t = ((lon + 180) * Math.PI) / 180
  return new THREE.Vector3(-R * Math.sin(p) * Math.cos(t), R * Math.cos(p), R * Math.sin(p) * Math.sin(t))
}

let topoCache: Promise<Topology> | null = null

export interface GlobeProps {
  from: Airport
  to: Airport
  progress: number // 0..1 of the flight flown
  toLabel: string // e.g. "VNO · 10:45"
  fromLabel: string
  /** fraction of width to push the globe right (keeps overlay text off the land) */
  shiftX?: number
}

export default function Globe({ from, to, progress, toLabel, fromLabel, shiftX = 0.2 }: GlobeProps) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const lblA = useRef<HTMLDivElement>(null)
  const lblB = useRef<HTMLDivElement>(null)
  const plane = useRef<SVGSVGElement>(null)
  const prog = useRef(progress)
  const [failed, setFailed] = useState(false)
  prog.current = progress

  useEffect(() => {
    const el = wrap.current!
    const cv = canvas.current!
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true })
    } catch {
      setFailed(true)
      return
    }
    const css = getComputedStyle(el)
    const v = (n: string, f: string) => css.getPropertyValue(n).trim() || f
    const C = {
      sea: v("--f-globe-sea", "#e9e6e2"), land: v("--f-globe-land", "#fbfaf8"), coast: v("--f-globe-coast", "#0d0d0d"),
      border: v("--f-globe-border", "rgba(13,13,13,.25)"), grid: v("--f-globe-grid", "rgba(13,13,13,.06)"),
      arc: v("--f-globe-arc", "#0d0d0d"), paper: v("--f-paper", "#f7f5f3"),
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    const scene = new THREE.Scene()
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
    const G = new THREE.Group()
    scene.add(G)
    scene.add(new THREE.AmbientLight(0xffffff, 1.55))
    const dl = new THREE.DirectionalLight(0xfff8f0, 1.5)
    scene.add(dl)

    // land texture drawn from Natural Earth via d3-geo
    const TW = 4096, TH = 2048
    const tc = document.createElement("canvas")
    tc.width = TW; tc.height = TH
    const x = tc.getContext("2d")!
    x.fillStyle = C.sea; x.fillRect(0, 0, TW, TH)
    const tex = new THREE.CanvasTexture(tc)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), new THREE.MeshLambertMaterial({ map: tex }))
    G.add(sphere)
    topoCache ??= fetch("/geo/countries-50m.json").then((r) => r.json())
    let alive = true
    topoCache.then((w) => {
      if (!alive) return
      const objs = w.objects as Record<string, GeometryCollection>
      const pr = geoEquirectangular().scale(TW / (2 * Math.PI)).translate([TW / 2, TH / 2])
      const gp = geoPath(pr, x)
      x.beginPath(); gp(geoGraticule().step([10, 10])()); x.strokeStyle = C.grid; x.lineWidth = 1.5; x.stroke()
      x.beginPath(); gp(feature(w, objs.land)); x.fillStyle = C.land; x.fill(); x.strokeStyle = C.coast; x.lineWidth = 1.6; x.stroke()
      x.beginPath(); gp(mesh(w, objs.countries, (a, b) => a !== b)); x.strokeStyle = C.border; x.lineWidth = 0.9; x.stroke()
      tex.needsUpdate = true
    })

    // soft rim
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.05, 96, 64), new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide, depthWrite: false,
      vertexShader: "varying vec3 n;void main(){n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: "varying vec3 n;void main(){float i=pow(clamp(.72-dot(n,vec3(0,0,1.)),0.,1.),2.2);gl_FragColor=vec4(.25,.22,.2,i*.35);}",
    })))

    // route: great circle lifted 0.15r at the midpoint
    const A = ll(from.lat, from.lon), B = ll(to.lat, to.lon), N = 200
    const pts: THREE.Vector3[] = [], gnd: THREE.Vector3[] = []
    for (let i = 0; i <= N; i++) {
      const t = i / N
      const u = A.clone().lerp(B, t).normalize()
      gnd.push(u.clone().multiplyScalar(1.002))
      pts.push(u.clone().multiplyScalar(1 + 0.15 * Math.sin(Math.PI * t)))
    }
    const arcCol = new THREE.Color(C.arc)
    const rest = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: arcCol, dashSize: 0.012, gapSize: 0.01, transparent: true, opacity: 0.35 }))
    rest.computeLineDistances(); G.add(rest)
    for (const p of [A, B]) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.008, 16, 12), new THREE.MeshBasicMaterial({ color: arcCol }))
      dot.position.copy(p); G.add(dot)
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.016, 0.019, 48), new THREE.MeshBasicMaterial({ color: arcCol, transparent: true, opacity: 0.7, side: THREE.DoubleSide }))
      ring.position.copy(p.clone().multiplyScalar(1.001)); ring.lookAt(p.clone().multiplyScalar(2)); G.add(ring)
    }
    let flown: THREE.Mesh | null = null
    let drop: THREE.Line | null = null
    let builtK = -1
    const buildFlown = (k: number) => {
      if (k === builtK) return
      builtK = k
      if (flown) { G.remove(flown); flown.geometry.dispose() }
      if (drop) { G.remove(drop); drop.geometry.dispose() }
      flown = null; drop = null
      if (k >= 2) {
        flown = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.slice(0, k + 1)), 100, 0.0042, 10), new THREE.MeshBasicMaterial({ color: arcCol }))
        G.add(flown)
      }
      drop = new THREE.Line(new THREE.BufferGeometry().setFromPoints([pts[k], gnd[k]]), new THREE.LineBasicMaterial({ color: arcCol, transparent: true, opacity: 0.25 }))
      G.add(drop)
    }

    // camera looks at the route midpoint; the group rotates slowly until in view, then eases home
    const mid = ll((from.lat + to.lat) / 2 - 6, (from.lon + to.lon) / 2)
    cam.position.copy(mid.clone().normalize().multiplyScalar(3.7)); cam.lookAt(0, 0, 0)
    dl.position.copy(ll(62, -25).multiplyScalar(5)).add(new THREE.Vector3(0, 2, 0))

    let W = 1, H = 1
    const resize = () => {
      W = el.clientWidth; H = el.clientHeight
      renderer.setSize(W, H, false)
      cam.aspect = W / H
      // fill the height; push the globe right and slightly down
      cam.setViewOffset(W, H, W > 700 ? -W * shiftX : 0, -H * (W > 700 ? 0.13 : 0.06), W, H)
      cam.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(el)

    let active = false
    const io = new IntersectionObserver(([e]) => { active = e.isIntersecting }, { threshold: 0.3 }); io.observe(el)
    let rot = -0.9
    let last = performance.now()
    let raf = 0
    const scr = (p: THREE.Vector3) => {
      const q = p.clone().applyMatrix4(G.matrixWorld).project(cam)
      return [((q.x + 1) / 2) * W, ((1 - q.y) / 2) * H] as const
    }
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now
      if (active) rot += (0 - rot) * Math.min(1, dt * 1.6)
      else rot += 0.02 * dt
      G.rotation.y = rot
      G.updateMatrixWorld()
      const k = Math.max(0, Math.min(N, Math.round(N * prog.current)))
      buildFlown(k)
      renderer.render(scene, cam)
      const [ax, ay] = scr(A), [bx, by] = scr(B), [px, py] = scr(pts[k]), [nx, ny] = scr(pts[Math.min(N, k + 3)]), [qx, qy] = scr(pts[Math.max(0, k - 3)])
      const ang = (k >= N ? Math.atan2(py - qy, px - qx) : Math.atan2(ny - py, nx - px)) * 180 / Math.PI + 90
      if (lblA.current) lblA.current.style.transform = `translate(${ax - 14}px, ${ay + 6}px) translateX(-100%)`
      if (lblB.current) lblB.current.style.transform = `translate(${bx + 16}px, ${by - 14}px)`
      if (plane.current) plane.current.style.transform = `translate(${px - 15}px, ${py - 15}px) rotate(${ang}deg)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      alive = false
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect()
      renderer.dispose(); tex.dispose()
    }
  }, [from, to, shiftX])

  return (
    <div ref={wrap} className="f-globe-wrap">
      <canvas ref={canvas} aria-label={`Globe showing the flight from ${from.city} to ${to.city}`} />
      {failed && <div className="f-label" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>3D globe needs WebGL</div>}
      <div ref={lblA} className="f-globe-lbl"><span className="f-display" style={{ fontSize: 20 }}>{from.city}</span> <span className="f-mute">{fromLabel}</span></div>
      <div ref={lblB} className="f-globe-lbl"><span className="f-display" style={{ fontSize: 20 }}>{to.city}</span> <span className="f-mute">{toLabel}</span></div>
      <svg ref={plane} className="f-plane" viewBox="-15 -15 30 30" aria-hidden><path d={PLANE} transform="scale(1.45)" /></svg>
    </div>
  )
}
