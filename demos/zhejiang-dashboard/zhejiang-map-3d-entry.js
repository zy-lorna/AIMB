import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function mount(host, geojson, values, callbacks) {
  const valueByName = new Map(values.map(item => [item.name, item]));
  const points = geojson.features.flatMap(feature => {
    const polygons = feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates : [feature.geometry.coordinates];
    return polygons.flatMap(polygon => polygon[0]);
  });
  const bounds = points.reduce((box, [lon, lat]) => [Math.min(box[0], lon), Math.min(box[1], lat), Math.max(box[2], lon), Math.max(box[3], lat)], [Infinity, Infinity, -Infinity, -Infinity]);
  const centerLon = (bounds[0] + bounds[2]) / 2;
  const centerLat = (bounds[1] + bounds[3]) / 2;
  const cosLat = Math.cos(centerLat * Math.PI / 180);
  const project = ([lon, lat]) => [(lon - centerLon) * cosLat * 30, (lat - centerLat) * 30];
  const projectedWidth = (bounds[2] - bounds[0]) * cosLat * 30;
  const projectedHeight = (bounds[3] - bounds[1]) * 30;
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0x8dc7ed, 1.5));
  const sun = new THREE.DirectionalLight(0xe1f6ff, 1.7);
  sun.position.set(-45, 50, 110);
  scene.add(sun);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const camera = new THREE.OrthographicCamera();
  camera.up.set(0, 0, 1);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableRotate = false;
  controls.dampingFactor = .09;
  controls.minZoom = 0.01;
  controls.maxZoom = Infinity;
  controls.maxPolarAngle = Math.PI * .48;
  controls.minPolarAngle = Math.PI * .13;
  controls.target.set(0, 0, 0);
  const viewSize = Math.max(projectedWidth, projectedHeight) * 1.18;
  const depth = Math.max(projectedWidth, projectedHeight) * .045;
  const meshes = [];
  // The flat administrative basemap uses the same projection as the raised map.
  // Include nearby county boundaries when available so drilldown retains context.
  const contextFeatures = [...(window.CHINA_CONTEXT_GEOJSON?.features || []), ...(window.ZHEJIANG_COUNTIES_DATAV_GEOJSON?.features || []), ...(callbacks.townLevel ? geojson.features : [])];
  const marginLon = (bounds[2] - bounds[0]) * 1.5, marginLat = (bounds[3] - bounds[1]) * 1.5;
  const segments = [];
  for (const feature of contextFeatures) {
    if (!feature.geometry || !['Polygon', 'MultiPolygon'].includes(feature.geometry.type)) continue;
    const polygons = feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates : [feature.geometry.coordinates];
    for (const polygon of polygons) for (const ring of polygon) {
      for (let i = 1; i < ring.length; i++) {
        const a = ring[i - 1], b = ring[i];
        if (Math.max(a[0], b[0]) < bounds[0] - marginLon || Math.min(a[0], b[0]) > bounds[2] + marginLon || Math.max(a[1], b[1]) < bounds[1] - marginLat || Math.min(a[1], b[1]) > bounds[3] + marginLat) continue;
        const [x1, y1] = project(a), [x2, y2] = project(b);
        segments.push(x1, y1, 0, x2, y2, 0);
      }
    }
  }
  const basemapGeometry = new THREE.BufferGeometry();
  basemapGeometry.setAttribute('position', new THREE.Float32BufferAttribute(segments, 3));
  // 二维边界距当前区域越远，颜色越暗。
  const nearColor = new THREE.Color('#287da7'), farColor = new THREE.Color('#071a2d');
  const boundaryColors = [];
  for (let i=0; i<segments.length; i+=3) {
    const nx = Math.abs(segments[i]) / Math.max(projectedWidth*.5, .001);
    const ny = Math.abs(segments[i+1]) / Math.max(projectedHeight*.5, .001);
    const distance = Math.max(0, Math.hypot(Math.max(0,nx-.5), Math.max(0,ny-.5)));
    const blend = THREE.MathUtils.smoothstep(distance, .25, 2.6);
    const color = nearColor.clone().lerp(farColor, blend);
    boundaryColors.push(color.r,color.g,color.b);
  }
  basemapGeometry.setAttribute('color', new THREE.Float32BufferAttribute(boundaryColors,3));
  const basemap = new THREE.LineSegments(basemapGeometry, new THREE.LineBasicMaterial({ vertexColors:true, transparent:true, opacity:.8 }));
  const board = host.closest('.situation-board, .construction-board, .outcome-board');
  const backgroundScene = board ? scene : null;
  let backgroundRenderer = null;
  let backgroundCamera = null;
  let backgroundWidth = 0, backgroundHeight = 0;
  if (board) {
    backgroundScene.add(basemap);
    renderer.domElement.style.opacity = '0';
    backgroundRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    backgroundRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    backgroundRenderer.outputColorSpace = THREE.SRGBColorSpace;
    backgroundRenderer.domElement.className = 'situation-map-background';
    board.prepend(backgroundRenderer.domElement);
    backgroundCamera = camera.clone();
  } else scene.add(basemap);
  for (const [from, to] of callbacks.flowLines || []) {
    const [x1, y1] = project(from), [x2, y2] = project(to);
    const start = new THREE.Vector3(x1, y1, depth + .2);
    const end = new THREE.Vector3(x2, y2, depth + .2);
    const midpoint = start.clone().add(end).multiplyScalar(.5);
    midpoint.z += Math.max(viewSize * .035, start.distanceTo(end) * .2);
    const curve = new THREE.QuadraticBezierCurve3(start, midpoint, end);
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(32)), new THREE.LineBasicMaterial({ color: '#f1ba66', transparent: true, opacity: .75 })));
  }
  const hitMeshes = [];
  const labels = [];
  const nodePoints = [];
  const valid = values.map(item => item.value).filter(Number.isFinite);
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const heatColors = ['#2186d0', '#55a8df', '#c3d3cf', '#ed9d64', '#e65c58'].map(color => new THREE.Color(color));
  // Interpolate measured region values across the map; the texture is clipped by each region's geometry.
  const samples = geojson.features.flatMap(feature => {
    const value = valueByName.get(feature.properties.name)?.value;
    const polygons = feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates : [feature.geometry.coordinates];
    const ring = polygons.map(p => p[0]).filter(Boolean).sort((a, b) => b.length - a.length)[0];
    const center = feature.properties.centroid || feature.properties.center || (ring && ring.reduce((sum, p) => [sum[0] + p[0] / ring.length, sum[1] + p[1] / ring.length], [0, 0]));
    if (!center || !Number.isFinite(value)) return [];
    const [x, y] = project(center);
    const suppliedColor = valueByName.get(feature.properties.name)?.color;
    const rgb = /^#[0-9a-f]{6}$/i.test(suppliedColor || '') ? [1,3,5].map(i => parseInt(suppliedColor.slice(i,i+2),16)) : null;
    return [{ x, y, value, rgb }];
  });
  const heatCanvas = document.createElement('canvas');
  heatCanvas.width = heatCanvas.height = 256;
  const heatContext = heatCanvas.getContext('2d');
  const heatImage = heatContext.createImageData(256, 256);
  const colorStops = [[33,134,208], [85,168,223], [242,165,74], [237,123,70], [230,92,88]];
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const px = (x / 255 - .5) * projectedWidth, py = (y / 255 - .5) * projectedHeight;
    let weighted = 0, weightSum = 0, rgbWeight = 0; const weightedRgb = [0,0,0];
    for (const sample of samples) {
      const distance = ((px - sample.x) / projectedWidth) ** 2 + ((py - sample.y) / projectedHeight) ** 2;
      const weight = 1 / Math.max(.00005, distance ** 1.5);
      weighted += sample.value * weight; weightSum += weight;
      if (sample.rgb) { rgbWeight += weight; for (let c=0;c<3;c++) weightedRgb[c] += sample.rgb[c]*weight; }
    }
    const ratio = weightSum && max > min ? THREE.MathUtils.clamp((weighted / weightSum - min) / (max - min), 0, 1) : .5;
    const scaled = Math.min(3.999, ratio * 4), index = Math.floor(scaled), offset = (y * 256 + x) * 4;
    for (let c = 0; c < 3; c++) heatImage.data[offset+c] = rgbWeight ? weightedRgb[c] / rgbWeight : colorStops[index][c] + (colorStops[index + 1][c] - colorStops[index][c]) * (scaled - index);
    heatImage.data[offset + 3] = 255;
  }
  heatContext.putImageData(heatImage, 0, 0);
  const heatTexture = new THREE.CanvasTexture(heatCanvas);
  heatTexture.colorSpace = THREE.SRGBColorSpace;
  heatTexture.flipY = false;
  heatTexture.wrapS = heatTexture.wrapT = THREE.ClampToEdgeWrapping;
  heatTexture.repeat.set(1 / projectedWidth, 1 / projectedHeight);
  heatTexture.offset.set(.5, .5);
  const labelLayer = document.createElement('div');
  labelLayer.className = 'map-3d-label-layer';
  if (callbacks.townLevel) labelLayer.classList.add('township-labels');
  host.appendChild(labelLayer);
  const tooltip = document.createElement('div');
  tooltip.className = 'map-3d-tooltip';
  tooltip.hidden = true;
  host.appendChild(tooltip);
  for (const feature of geojson.features) {
    const name = feature.properties.name;
    const item = valueByName.get(name);
    const ratio = Number.isFinite(item?.value) && max > min ? (item.value - min) / (max - min) : .15;
    const scaled = Math.min(heatColors.length - 1.001, Math.max(0, ratio * (heatColors.length - 1)));
    const index = Math.floor(scaled);
    const topColor = item?.color ? new THREE.Color(item.color) : Number.isFinite(item?.value) ? heatColors[index].clone().lerp(heatColors[index + 1], scaled - index) : new THREE.Color('#758393');
    
    const polygons = feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates : [feature.geometry.coordinates];
    for (const polygon of polygons) {
      const ring = polygon[0];
      if (!ring || ring.length < 4) continue;
      const step = Math.max(1, Math.ceil(ring.length / 240));
      const sample = ring.filter((_, index) => index % step === 0);
      if (sample.length < 3) continue;
      const shape = new THREE.Shape();
      sample.forEach((point, index) => {
        const [x, y] = project(point);
        if (index === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      });
      shape.closePath();
      for (const holeRing of polygon.slice(1)) {
        if (holeRing.length < 4) continue;
        const hole = new THREE.Path();
        holeRing.forEach((point, index) => { const [x,y] = project(point); index ? hole.lineTo(x,y) : hole.moveTo(x,y); });
        hole.closePath(); shape.holes.push(hole);
      }
      const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
      const position = geometry.attributes.position;
      const colors = [];
      const lower = new THREE.Color('#063251'), upper = new THREE.Color('#16739b');
      for (let i = 0; i < position.count; i++) { const c = lower.clone().lerp(upper, THREE.MathUtils.clamp(position.getZ(i) / depth, 0, 1)); colors.push(c.r,c.g,c.b); }
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      const mesh = new THREE.Mesh(geometry, [new THREE.MeshBasicMaterial(Number.isFinite(item?.value) ? { map: heatTexture } : { color: topColor }), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .82, depthWrite: true })]);
      mesh.userData.name = name;
      scene.add(mesh);
      meshes.push(mesh);
      hitMeshes.push(mesh);
      const linePoints = sample.map(point => {
        const [x, y] = project(point);
        return new THREE.Vector3(x, y, depth + .01);
      });
      linePoints.push(linePoints[0].clone());
      const outline = new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePoints), new THREE.LineBasicMaterial({ color: '#a1e9ff', transparent: true, opacity: .95 }));
      scene.add(outline);
      meshes.push(outline);
      const glow = new THREE.Line(outline.geometry.clone(), new THREE.LineBasicMaterial({color:'#1dbde8', transparent:true, opacity:.22, blending:THREE.AdditiveBlending, depthWrite:false}));
      glow.position.z = depth * .015; scene.add(glow); meshes.push(glow);
      const bottomLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePoints.map(p => new THREE.Vector3(p.x,p.y,.02))), new THREE.LineBasicMaterial({color:'#17779a',transparent:true,opacity:.65}));
      scene.add(bottomLine); meshes.push(bottomLine);
    }
    const largestRing = polygons.map(polygon => polygon[0]).filter(Boolean).sort((a, b) => b.length - a.length)[0];
    const position = feature.properties.centroid || feature.properties.center || (largestRing && largestRing.reduce((sum, point) => [sum[0] + point[0] / largestRing.length, sum[1] + point[1] / largestRing.length], [0, 0]));
    if (position) {
      const label = document.createElement('span');
      label.className = 'map-3d-label';
      label.textContent = (item?.displayName || name).replace(/^.*?市(?=.+(?:区|县|市)$)/, '');
      labelLayer.appendChild(label);
      const [x, y] = project(position);
      nodePoints.push(x, y, depth + .05);
      labels.push({ element: label, position: new THREE.Vector3(x, y, depth + .02), county: !callbacks.townLevel && (callbacks.countyLevel || geojson.features.length > 20) });
    }
  }
  if (nodePoints.length) {
    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(nodePoints, 3));
    scene.add(new THREE.Points(nodeGeometry, new THREE.PointsMaterial({color:'#65d9f6', size:3.5, sizeAttenuation:false, transparent:true, opacity:.72, depthWrite:false})));
  }
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = '';
  let pointerStart = null;
  let frame = 0;
  let disposed = false;
  function resize() {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    const aspect = width / height;
    camera.left = -viewSize * aspect / 2;
    camera.right = viewSize * aspect / 2;
    camera.top = viewSize / 2;
    camera.bottom = -viewSize / 2;
    camera.near = .1;
    camera.far = 1000;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  camera.position.set(0, -viewSize * .65, viewSize * 1.25);
  camera.lookAt(0, 0, 0);
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  function showAt(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(hitMeshes, false)[0];
    const name = hit?.object.userData.name || '';
    hovered = name;
    tooltip.hidden = !name;
    if (!name) return;
    tooltip.innerHTML = callbacks.onHover(name);
    const x = (event.clientX - rect.left) * host.clientWidth / rect.width;
    const y = (event.clientY - rect.top) * host.clientHeight / rect.height;
    tooltip.style.left = `${Math.max(5, Math.min(x + 12, host.clientWidth - tooltip.offsetWidth - 5))}px`;
    tooltip.style.top = `${Math.max(5, Math.min(y + 12, host.clientHeight - tooltip.offsetHeight - 5))}px`;
  }
  const onLeave = () => { hovered = ''; tooltip.hidden = true; };
  const onClick = event => {
    if (pointerStart && Math.hypot(event.clientX - pointerStart[0], event.clientY - pointerStart[1]) >= 5) return;
    showAt(event);
    if (hovered) callbacks.onClick(hovered);
  };
  const onPointerDown = event => { pointerStart = [event.clientX, event.clientY]; };
  renderer.domElement.addEventListener('pointermove', showAt);
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointerleave', onLeave);
  renderer.domElement.addEventListener('click', onClick);
  controls.addEventListener('change', () => callbacks.onZoom(camera.zoom));
  function animate() {
    if (disposed) return;
    frame = requestAnimationFrame(animate);
    controls.update();
    const occupied = [];
    for (const label of labels) {
      const projected = label.position.clone().project(camera);
      const x = (projected.x + 1) * host.clientWidth / 2, y = (-projected.y + 1) * host.clientHeight / 2;
      const overlaps = occupied.some(point => Math.abs(point.x - x) < 55 && Math.abs(point.y - y) < 20);
      const visible = (callbacks.showLabels !== false || geojson.features.length <= 11) && projected.z < 1 && Math.abs(projected.x) < .97 && Math.abs(projected.y) < .97 && (!label.county || geojson.features.length <= 20 || camera.zoom >= 2.5) && !overlaps;
      label.element.style.display = visible ? '' : 'none';
      if (visible) { occupied.push({ x, y }); label.element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`; }
    }
    if (backgroundRenderer && board.isConnected && host.clientHeight) {
      const boardRect = board.getBoundingClientRect(), hostRect = host.getBoundingClientRect();
      const scaleX = board.clientWidth / boardRect.width, scaleY = board.clientHeight / boardRect.height;
      const centerX = (hostRect.left + hostRect.width / 2 - boardRect.left) * scaleX;
      const centerY = (hostRect.top + hostRect.height / 2 - boardRect.top) * scaleY;
      const unit = viewSize / (host.clientHeight * camera.zoom);
      backgroundCamera.position.copy(camera.position);
      backgroundCamera.quaternion.copy(camera.quaternion);
      backgroundCamera.zoom = 1;
      backgroundCamera.near = camera.near; backgroundCamera.far = camera.far;
      backgroundCamera.left = -centerX * unit;
      backgroundCamera.right = (board.clientWidth - centerX) * unit;
      backgroundCamera.top = centerY * unit;
      backgroundCamera.bottom = -(board.clientHeight - centerY) * unit;
      backgroundCamera.updateProjectionMatrix();
      if (backgroundWidth !== board.clientWidth || backgroundHeight !== board.clientHeight) {
        backgroundWidth = board.clientWidth; backgroundHeight = board.clientHeight;
        backgroundRenderer.setSize(backgroundWidth, backgroundHeight);
      }
      backgroundRenderer.render(backgroundScene, backgroundCamera);
    }
    renderer.render(scene, camera);
  }
  animate();
  return {
    resize,
    zoom(action) {
      if (action === 'reset') {
        camera.position.set(0, -viewSize * .65, viewSize * 1.25);
        controls.target.set(0, 0, 0);
        camera.zoom = 1;
      } else camera.zoom = Math.max(0.01, camera.zoom * (action === 'in' ? 1.5 : 1 / 1.5));
      camera.updateProjectionMatrix();
      controls.update();
      return camera.zoom;
    },
    dispose() {
      disposed = true;
      resizeObserver.disconnect();
      cancelAnimationFrame(frame);
      controls.dispose();
      scene.traverse(object => {
        object.geometry?.dispose();
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose());
      });
      if (backgroundRenderer) {
        backgroundRenderer.dispose(); backgroundRenderer.forceContextLoss();
        backgroundRenderer.domElement.remove();
      }
      renderer.dispose();
      heatTexture.dispose();
      renderer.forceContextLoss();
      host.replaceChildren();
    }
  };
}

export { mount };
