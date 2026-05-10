"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

const MAX_DPR = 2;
const FPS_CAP = 50;
const MAX_FILL_POINTS = 120000;

const layerCache = new Map();
let DOT_TEX: THREE.CanvasTexture | null = null;
let HALO_TEX: THREE.CanvasTexture | null = null;
let LAND_POLYS: Float32Array[][] | null = null;
let LAND_GEO_POLYS: { type: string; coordinates: number[][][] }[] | null = null;

const PINS = [
  { lon: -74.006, lat: 40.7128, name: "New York", prayer: "Isha 9:18 PM" },
  { lon: -0.1278, lat: 51.5074, name: "London", prayer: "Isha 10:15 PM" },
  { lon: 139.6917, lat: 35.6895, name: "Tokyo", prayer: "Fajr 4:12 AM" },
  { lon: 55.2708, lat: 25.2048, name: "Dubai", prayer: "Asr 3:45 PM" },
  { lon: -97.7431, lat: 30.2672, name: "Texas", prayer: "Dhuhr 1:15 PM" },
];

const POINT_COLOR = "#0A261E";
const FILL_COLOR = "#1a6b42";
const PIN_DOT_COLOR = "#1a6b42";
const TRAIL_COLOR = "#d4af37";
const POINT_SIZE = 0.008;
const FILL_OPACITY = 0.7;
const BACK_OPACITY = 0.15;
const PIN_SIZE = 0.014;
const HALO_SCALE = 8;
const AUTO_ROTATE_SPEED = 0.03;
const TILE_DEG = 1;

// --- Textures ---
function makeCircleDotTexture(size = 64) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const x = c.getContext("2d")!;
  x.clearRect(0, 0, size, size);
  const r = size / 2;
  const g = x.createRadialGradient(r, r, r * 0.82, r, r, r);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.beginPath();
  x.arc(r, r, r - 0.5, 0, Math.PI * 2);
  x.closePath();
  x.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

function makeHaloTexture(size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(26,107,66,0.5)");
  g.addColorStop(0.35, "rgba(26,107,66,0.2)");
  g.addColorStop(1, "rgba(26,107,66,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

// --- Geo helpers ---
function lonLatToVec3(lon: number, lat: number, r = 1) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function makePointsMat(
  color: string,
  size: number,
  backOpacity: number,
  dotTexture: THREE.Texture,
  overrideOpacity?: number
) {
  const material = new THREE.PointsMaterial({
    color: new THREE.Color(color),
    size,
    sizeAttenuation: true,
    depthWrite: false,
    transparent: true,
    map: dotTexture,
    alphaTest: 0,
    opacity: overrideOpacity ?? 1,
  });
  material.toneMapped = false;
  material.precision = "mediump";
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uCamPos = { value: new THREE.Vector3() };
    shader.uniforms.uBackOpacity = { value: backOpacity };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vWorldPos;\nuniform vec3 uCamPos;"
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvWorldPos = (modelMatrix * vec4(transformed,1.0)).xyz;"
      )
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
float ndv = dot(normalize(uCamPos - vWorldPos), normalize(vWorldPos));
gl_PointSize *= mix(0.6, 1.0, smoothstep(0.0, 0.25, ndv));`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vWorldPos;\nuniform vec3 uCamPos;\nuniform float uBackOpacity;"
      )
      .replace(
        "#include <clipping_planes_fragment>",
        `#include <clipping_planes_fragment>
float ndHem;
{
  vec3 viewDir = normalize(uCamPos - vWorldPos);
  vec3 normalDir = normalize(vWorldPos);
  ndHem = dot(viewDir, normalDir);
}`
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
diffuseColor.a *= mix(uBackOpacity, 1.0, smoothstep(0.0, 0.25, ndHem));`
      );
    (material as any).userData.shader = shader;
  };
  return material;
}

function addPin(
  group: THREE.Group,
  pin: { lon: number; lat: number; name: string; prayer: string },
  tex: THREE.Texture,
  pinDotColor: string,
  pinSize: number,
  haloScale: number
) {
  const pos = lonLatToVec3(pin.lon, pin.lat, 1);
  const g = new THREE.Group();
  g.position.copy(pos);
  g.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(pinSize, 16, 16),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(pinDotColor) })
    )
  );
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      color: new THREE.Color(pinDotColor),
      map: tex,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    })
  );
  const sz = pinSize * haloScale;
  halo.scale.set(sz, sz, sz);
  g.add(halo);

  // Label
  const el = document.createElement("div");
  el.style.cssText =
    "pointer-events:none;white-space:nowrap;font-family:system-ui,-apple-system,sans-serif;" +
    "background:rgba(10,38,30,0.85);backdrop-filter:blur(8px);" +
    "border:1px solid rgba(26,107,66,0.3);border-radius:8px;" +
    "padding:6px 10px;color:#fff;line-height:1.3;";
  el.innerHTML =
    `<div style="font-size:11px;font-weight:700;letter-spacing:0.02em">${pin.name}</div>` +
    `<div style="font-size:10px;color:rgba(212,175,55,0.9);margin-top:2px">${pin.prayer}</div>`;
  const label = new CSS2DObject(el);
  label.position.set(0, 0.06, 0);
  g.add(label);

  group.add(g);
  return { g, pos };
}

function limitPoints(src: Float32Array, cap: number) {
  const n = src.length / 3;
  if (n <= cap) return src;
  const idxs = new Uint32Array(n);
  for (let i = 0; i < n; i++) idxs[i] = i;
  for (let i = n - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
  }
  const out = new Float32Array(cap * 3);
  for (let k = 0; k < cap; k++) {
    const i = idxs[k] * 3;
    out[k * 3] = src[i];
    out[k * 3 + 1] = src[i + 1];
    out[k * 3 + 2] = src[i + 2];
  }
  return out;
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((o: any) => {
    o.geometry?.dispose();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach((m: any) => m.dispose());
      else o.material.dispose();
    }
  });
}

// --- Topo data ---
function toRing(ring: number[][], idx: number) {
  if (idx > 0) {
    const out = new Float32Array((ring.length + 1) * 2);
    let k = 0;
    for (const pt of ring) { out[k++] = pt[0]; out[k++] = pt[1]; }
    out[k++] = ring[ring.length - 1][0];
    out[k++] = ring[ring.length - 1][1];
    return out.subarray(0, k);
  }
  const L = ring.length, target = 3000, step = L > target ? Math.floor(L / target) : 1;
  const out = new Float32Array(((Math.ceil(L / step) + 1) | 0) * 2);
  let k = 0;
  for (let i = 0; i < L; i += step) { out[k++] = ring[i][0]; out[k++] = ring[i][1]; }
  out[k++] = ring[L - 1][0];
  out[k++] = ring[L - 1][1];
  return out.subarray(0, k);
}

async function getLand() {
  if (LAND_POLYS && LAND_GEO_POLYS) return { polys: LAND_POLYS, geoPolys: LAND_GEO_POLYS };
  const urls = [
    "https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json",
    "https://unpkg.com/world-atlas@2/land-110m.json",
  ];
  let topo: any = null;
  for (const u of urls) {
    try {
      const r = await fetch(u, { cache: "force-cache" });
      if (r.ok) { topo = await r.json(); break; }
    } catch {}
  }
  if (!topo) throw new Error("land data unavailable");

  // Dynamic import topojson-client
  const topojson = await import(/* webpackIgnore: true */ "https://esm.sh/topojson-client@3?bundle" as any);
  const land = topojson.feature(topo, topo.objects.land);
  const polys: Float32Array[][] = [];
  const geoPolys: any[] = [];
  for (const f of land.features || []) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === "Polygon") {
      polys.push(g.coordinates.map((ring: any, idx: number) => toRing(ring, idx)));
      geoPolys.push({ type: "Polygon", coordinates: g.coordinates });
    } else if (g.type === "MultiPolygon") {
      for (const poly of g.coordinates) {
        polys.push(poly.map((ring: any, idx: number) => toRing(ring, idx)));
        geoPolys.push({ type: "Polygon", coordinates: poly });
      }
    }
  }
  LAND_POLYS = polys;
  LAND_GEO_POLYS = geoPolys;
  return { polys, geoPolys };
}

function boundsOfRing(ring: Float32Array) {
  let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
  for (let i = 0; i < ring.length; i += 2) {
    const x = ring[i], y = ring[i + 1];
    if (x < minLon) minLon = x;
    if (x > maxLon) maxLon = x;
    if (y < minLat) minLat = y;
    if (y > maxLat) maxLat = y;
  }
  return { minLon, maxLon, minLat, maxLat };
}

function filterNonPolarPolys(polys: Float32Array[][], geoPolys: any[]) {
  const outP: Float32Array[][] = [], outG: any[] = [];
  for (let i = 0; i < polys.length; i++) {
    const outer = polys[i][0];
    if (!outer || outer.length < 4) continue;
    const bbox = boundsOfRing(outer);
    if (bbox.maxLon - bbox.minLon > 300 && Math.abs((bbox.minLat + bbox.maxLat) / 2) > 60) continue;
    outP.push(polys[i]);
    outG.push(geoPolys[i]);
  }
  return { polys: outP, geoPolys: outG };
}

// --- Workers ---
function buildEdgesInWorker(polys: Float32Array[][], densityDeg: number): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const payload = polys.map((poly) => poly.map((ring) => new Float32Array(ring)));
    const src = `
function wrapLon(lon){ return ((lon + 540) % 360) - 180; }
function sampleEdgeFlat(ring, maxDegStep){
  var out = [];
  for (var i=0;i<ring.length-2;i+=2){
    var lon1=ring[i],lat1=ring[i+1],lon2=ring[i+2],lat2=ring[i+3];
    var dLon=lon2-lon1;
    if(Math.abs(dLon)>180){lon2+=dLon>0?-360:360;dLon=lon2-lon1;}
    var dLat=lat2-lat1,maxSpan=Math.max(Math.abs(dLon),Math.abs(dLat));
    var steps=Math.max(1,Math.ceil(maxSpan/maxDegStep));
    for(var s=0;s<=steps;s++){var t=s/steps;out.push(wrapLon(lon1+dLon*t),lat1+dLat*t);}
  }
  return new Float32Array(out);
}
function lonLatToVec3(lon,lat){
  var phi=(90-lat)*Math.PI/180,theta=(lon+180)*Math.PI/180;
  return[-Math.sin(phi)*Math.cos(theta),Math.cos(phi),Math.sin(phi)*Math.sin(theta)];
}
onmessage=function(e){
  var d=e.data,edgeOut=[];
  for(var p=0;p<d.polysIn.length;p++){
    var poly=d.polysIn[p];
    for(var r=0;r<poly.length;r++){
      var sampled=sampleEdgeFlat(poly[r],Math.max(0.2,d.densityDeg));
      for(var i=0;i<sampled.length;i+=2){var v=lonLatToVec3(sampled[i],sampled[i+1]);edgeOut.push(v[0],v[1],v[2]);}
    }
  }
  var arr=new Float32Array(edgeOut);
  postMessage({ok:true,edge:arr},[arr.buffer]);
};`;
    const blob = new Blob([src], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    worker.onmessage = (e) => { URL.revokeObjectURL(url); worker.terminate(); e.data?.ok ? resolve(e.data.edge) : reject(); };
    worker.onerror = (err) => { URL.revokeObjectURL(url); worker.terminate(); reject(err); };
    worker.postMessage({ densityDeg, polysIn: payload });
  });
}

function buildFillTileInWorker(geoPolys: any[], tileDeg: number): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const src = `
var PI=Math.PI;
function wrap180(lon){return((lon+540)%360)-180;}
function vec3(lon,lat){var phi=(90-lat)*PI/180,th=(lon+180)*PI/180;return[-Math.sin(phi)*Math.cos(th),Math.cos(phi),Math.sin(phi)*Math.sin(th)];}
function unwrapRing(ring,refLon){var out=new Array(ring.length),prev=null;for(var i=0;i<ring.length;i++){var L=ring[i][0],A=ring[i][1];var d=L-refLon;if(d>180)L-=360;else if(d<-180)L+=360;if(prev){var step=L-prev[0];if(step>180)L-=360;else if(step<-180)L+=360;}out[i]=[L,A];prev=out[i];}return out;}
function pointInRing(pt,ring){var x=pt[0],y=pt[1],inside=false,n=ring.length;for(var i=0,j=n-1;i<n;j=i++){var xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];var denom=yj-yi;if(denom===0)continue;if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/denom+xi))inside=!inside;}return inside;}
function containsUnwrapped(poly,refLon,lon,lat){var rings=poly.coordinates;if(!rings||!rings.length)return false;var r0=unwrapRing(rings[0],refLon);if(!pointInRing([lon,lat],r0))return false;for(var k=1;k<rings.length;k++){if(pointInRing([lon,lat],unwrapRing(rings[k],refLon)))return false;}return true;}
function bbox(r){var minLon=1e9,maxLon=-1e9,minLat=90,maxLat=-90;for(var i=0;i<r.length;i++){var L=r[i][0],A=r[i][1];if(L<minLon)minLon=L;if(L>maxLon)maxLon=L;if(A<minLat)minLat=A;if(A>maxLat)maxLat=A;}return{minLon:minLon,maxLon:maxLon,minLat:minLat,maxLat:maxLat};}
onmessage=function(e){
  var geos=e.data.geos,step=Math.max(0.2,Math.min(6.0,e.data.tileDeg||1.0));var out=[];
  for(var p=0;p<geos.length;p++){
    var r0=unwrapRing(geos[p].coordinates[0],0);var bb=bbox(r0);var refLon=(bb.minLon+bb.maxLon)/2;
    r0=unwrapRing(geos[p].coordinates[0],refLon);bb=bbox(r0);
    var latStart=Math.floor((bb.minLat-1)/step)*step,latEnd=Math.ceil((bb.maxLat+1)/step)*step;
    for(var lat=latStart;lat<=latEnd;lat+=step){
      var odd=Math.round(Math.abs(lat/step))%2;
      var lonStart=Math.floor((bb.minLon-1)/step)*step+(odd?step*0.5:0),lonEnd=Math.ceil((bb.maxLon+1)/step)*step;
      for(var lon=lonStart;lon<=lonEnd;lon+=step){
        var llLat=Math.max(-90,Math.min(90,lat));
        if(containsUnwrapped(geos[p],refLon,lon,llLat)){var v=vec3(wrap180(lon),llLat);out.push(v[0],v[1],v[2]);}
      }
    }
  }
  var arr=new Float32Array(out);
  postMessage({ok:true,fill:arr},[arr.buffer]);
};`;
    const blob = new Blob([src], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    worker.onmessage = (e) => { URL.revokeObjectURL(url); worker.terminate(); e.data?.ok ? resolve(e.data.fill) : reject(); };
    worker.onerror = (err) => { URL.revokeObjectURL(url); worker.terminate(); reject(err); };
    worker.postMessage({ geos: JSON.parse(JSON.stringify(geoPolys)), tileDeg });
  });
}

// --- Trail shader ---
const TRAIL_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const TRAIL_FRAGMENT = `
uniform vec3 uColor;
uniform float uProgress;
varying vec2 vUv;
void main() {
  float t = uProgress;
  float len = 0.4;
  float dist = t - vUv.x;
  if (dist < 0.0 || dist > len) discard;
  float alpha = 1.0 - (dist / len);
  alpha = pow(alpha, 1.5);
  gl_FragColor = vec4(uColor, alpha * 0.9);
}`;

// --- Component ---
export default function VisibilityGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    const run = async () => {
      const container = containerRef.current;
      if (!container) return;
      while (container.firstChild) container.removeChild(container.firstChild);

      const { width, height } = {
        width: container.clientWidth || 600,
        height: container.clientHeight || 600,
      };

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
      camera.position.set(0, 0, 2.7);

      const renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: "low-power",
        premultipliedAlpha: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);

      if (disposed || !containerRef.current) { renderer.dispose(); return; }
      container.appendChild(renderer.domElement);

      const labelRenderer = new CSS2DRenderer();
      labelRenderer.setSize(width, height);
      labelRenderer.domElement.style.position = "absolute";
      labelRenderer.domElement.style.top = "0";
      labelRenderer.domElement.style.left = "0";
      labelRenderer.domElement.style.pointerEvents = "none";
      container.appendChild(labelRenderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.enableZoom = false;

      const globeGroup = new THREE.Group();
      scene.add(globeGroup);

      if (!DOT_TEX) DOT_TEX = makeCircleDotTexture(64);
      if (!HALO_TEX) HALO_TEX = makeHaloTexture();

      // Pins
      const pinPositions: THREE.Vector3[] = [];
      for (const p of PINS) {
        const { pos } = addPin(globeGroup, p, HALO_TEX, PIN_DOT_COLOR, PIN_SIZE, HALO_SCALE);
        pinPositions.push(pos);
      }

      // Land data
      let result: { polys: Float32Array[][] | null; geoPolys: any[] | null };
      try {
        result = await getLand();
      } catch {
        result = { polys: null, geoPolys: null };
      }
      if (disposed) { renderer.dispose(); return; }
      if (!result.polys?.length || !result.geoPolys) { setLoading(false); return; }

      const filtered = filterNonPolarPolys(result.polys, result.geoPolys);
      const polys = filtered.polys;
      const geoPolys = filtered.geoPolys;

      const edgeMat = makePointsMat(POINT_COLOR, POINT_SIZE, BACK_OPACITY, DOT_TEX);
      const fillMat = makePointsMat(FILL_COLOR, Math.max(0.75 * POINT_SIZE, 0.003), BACK_OPACITY, DOT_TEX, FILL_OPACITY);

      let edgePos: Float32Array, fillPos: Float32Array;
      const cached = layerCache.get(TILE_DEG);
      if (cached) {
        edgePos = cached.edge;
        fillPos = cached.fill;
      } else {
        try {
          edgePos = await buildEdgesInWorker(polys, Math.max(0.2, TILE_DEG));
          if (disposed) { renderer.dispose(); return; }
          fillPos = limitPoints(await buildFillTileInWorker(geoPolys, TILE_DEG), MAX_FILL_POINTS);
          if (disposed) { renderer.dispose(); return; }
          layerCache.set(TILE_DEG, { edge: edgePos, fill: fillPos });
        } catch {
          edgePos = new Float32Array(0);
          fillPos = new Float32Array(0);
        }
      }

      const edgeGeo = new THREE.BufferGeometry();
      edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(edgePos, 3));
      globeGroup.add(new THREE.Points(edgeGeo, edgeMat));

      const fillGeo = new THREE.BufferGeometry();
      fillGeo.setAttribute("position", new THREE.Float32BufferAttribute(fillPos, 3));
      globeGroup.add(new THREE.Points(fillGeo, fillMat));

      // --- Trails ---
      const activeTrails: { mesh: THREE.Mesh; progress: number; speed: number }[] = [];
      const trailsGroup = new THREE.Group();
      globeGroup.add(trailsGroup);
      let trailSpawnTimer = 0;

      const spawnTrail = () => {
        if (pinPositions.length < 2) return;
        let i1 = Math.floor(Math.random() * pinPositions.length);
        let i2 = Math.floor(Math.random() * pinPositions.length);
        while (i1 === i2) i2 = Math.floor(Math.random() * pinPositions.length);
        const vStart = pinPositions[i1];
        const vEnd = pinPositions[i2];
        const dist = vStart.distanceTo(vEnd);
        const mid = vStart.clone().add(vEnd).multiplyScalar(0.5).normalize();
        const vControl = mid.multiplyScalar(1 + dist * 0.5);
        const curve = new THREE.QuadraticBezierCurve3(vStart, vControl, vEnd);
        const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.005, 8, false);
        const mat = new THREE.ShaderMaterial({
          uniforms: {
            uColor: { value: new THREE.Color(TRAIL_COLOR) },
            uProgress: { value: 0 },
          },
          vertexShader: TRAIL_VERTEX,
          fragmentShader: TRAIL_FRAGMENT,
          transparent: true,
          blending: THREE.NormalBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(tubeGeo, mat);
        trailsGroup.add(mesh);
        activeTrails.push({ mesh, progress: 0, speed: 0.3 + Math.random() * 0.4 });
      };

      setLoading(false);

      // --- Render loop ---
      const clock = new THREE.Clock();
      const FRAME = 1 / FPS_CAP;
      let acc = FRAME;

      const renderOnce = (delta: number) => {
        if (disposed) return;
        [edgeMat, fillMat].forEach((mat: any) => {
          const shader = mat?.userData?.shader;
          if (shader) {
            shader.uniforms.uCamPos.value.copy(camera.position);
            shader.uniforms.uBackOpacity.value = BACK_OPACITY;
          }
        });

        trailSpawnTimer += delta;
        if (trailSpawnTimer > 0.6 && activeTrails.length < 6 && Math.random() > 0.5) {
          spawnTrail();
          trailSpawnTimer = 0;
        }
        for (let i = activeTrails.length - 1; i >= 0; i--) {
          const trail = activeTrails[i];
          trail.progress += trail.speed * delta;
          if (trail.progress >= 1.4) {
            trailsGroup.remove(trail.mesh);
            trail.mesh.geometry.dispose();
            (trail.mesh.material as THREE.Material).dispose();
            activeTrails.splice(i, 1);
          } else {
            (trail.mesh.material as THREE.ShaderMaterial).uniforms.uProgress.value = trail.progress;
          }
        }

        controls.update();
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
      };

      const loop = () => {
        if (disposed || !runningRef.current) return;
        const dt = clock.getDelta();
        acc += dt;
        globeGroup.rotation.y += AUTO_ROTATE_SPEED * dt;
        if (!document.hidden && acc >= FRAME) {
          renderOnce(dt);
          acc = 0;
        }
        rafRef.current = requestAnimationFrame(loop);
      };

      const start = () => {
        if (disposed || runningRef.current) return;
        runningRef.current = true;
        acc = FRAME;
        loop();
      };
      const stop = () => { runningRef.current = false; cancelAnimationFrame(rafRef.current); };

      const onVis = () => (document.hidden ? stop() : start());
      document.addEventListener("visibilitychange", onVis);

      const io = new IntersectionObserver(
        (entries) => { entries[0]?.isIntersecting ? start() : stop(); },
        { root: null, threshold: 0 }
      );
      if (containerRef.current) io.observe(containerRef.current);
      renderOnce(0);
      start();

      const onResize = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const w = Math.max(1, Math.round(rect.width));
        const h = Math.max(1, Math.round(rect.height));
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
        renderer.setSize(w, h);
        labelRenderer.setSize(w, h);
        renderOnce(0);
      };
      window.addEventListener("resize", onResize);

      let ro: ResizeObserver | null = null;
      try {
        ro = new ResizeObserver(onResize);
        if (containerRef.current) ro.observe(containerRef.current);
      } catch {}

      cleanup = () => {
        stop();
        window.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", onVis);
        io.disconnect();
        ro?.disconnect();
        if (labelRenderer.domElement.parentNode) labelRenderer.domElement.parentNode.removeChild(labelRenderer.domElement);
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        renderer.dispose();
        controls.dispose();
        activeTrails.forEach((t) => { t.mesh.geometry.dispose(); (t.mesh.material as THREE.Material).dispose(); });
        disposeScene(scene);
      };
    };

    run().catch(() => setLoading(false));
    return () => { disposed = true; cleanup?.(); };
  }, []);

  return (
    <div className="relative aspect-square w-full max-w-[700px] mx-auto lg:mx-0">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-dark-green/10 border-t-dark-green/40" />
        </div>
      )}
      <div ref={containerRef} className="relative h-full w-full" />
    </div>
  );
}
