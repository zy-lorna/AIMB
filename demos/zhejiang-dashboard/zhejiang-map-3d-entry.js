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
  controls.dampingFactor = .09;
  controls.minZoom = 1;
  controls.maxZoom = 8;
  controls.maxPolarAngle = Math.PI * .48;
  controls.minPolarAngle = Math.PI * .13;
  controls.target.set(0, 0, 0);
  const viewSize = Math.max(projectedWidth, projectedHeight) * 1.18;
  const depth = callbacks.townLevel ? Math.max(projectedWidth, projectedHeight) * .055 : 10;
  const baseZ = callbacks.townLevel ? -depth * .8 : -8;
  const pedestalRadius = Math.max(projectedWidth, projectedHeight) * .64;
  const ringWidth = callbacks.townLevel ? pedestalRadius * .012 : .55;
  const pedestal = new THREE.Mesh(new THREE.CircleGeometry(pedestalRadius, 96), new THREE.MeshBasicMaterial({ color: '#08294d', transparent: true, opacity: .72, depthWrite: false }));
  pedestal.position.z = baseZ;
  scene.add(pedestal);
  const pedestalRings = [1, .87].map((scale, index) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(pedestalRadius * scale - ringWidth, pedestalRadius * scale, 128), new THREE.MeshBasicMaterial({ color: index ? '#1c7dbb' : '#39bffc', transparent: true, opacity: index ? .2 : .48, side: THREE.DoubleSide, depthWrite: false }));
    ring.position.z = baseZ + depth * (.02 + index * .01);
    scene.add(ring);
    return ring;
  });
  const orbitArc = new THREE.Mesh(new THREE.RingGeometry(pedestalRadius - (callbacks.townLevel ? ringWidth * 1.5 : .8), pedestalRadius + (callbacks.townLevel ? ringWidth * .4 : .2), 48, 1, 0, Math.PI * .32), new THREE.MeshBasicMaterial({ color: '#79e6ff', transparent: true, opacity: .85, side: THREE.DoubleSide, depthWrite: false }));
  orbitArc.position.z = baseZ + depth * .045;
  scene.add(orbitArc);
  const meshes = [];
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
  const valid = values.map(item => item.value).filter(Number.isFinite);
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const heatColors = ['#218ed0', '#29c3e6', '#f4d467', '#fb9a53', '#f15c55'].map(color => new THREE.Color(color));
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
    const topColor = Number.isFinite(item?.value) ? heatColors[index].clone().lerp(heatColors[index + 1], scaled - index) : new THREE.Color('#1c5279');
    const sideColor = topColor.clone().multiplyScalar(.47);
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
      const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
      const mesh = new THREE.Mesh(geometry, [new THREE.MeshPhongMaterial({ color: topColor, emissive: topColor, emissiveIntensity: .17, shininess: 54 }), new THREE.MeshPhongMaterial({ color: sideColor })]);
      mesh.userData.name = name;
      scene.add(mesh);
      meshes.push(mesh);
      hitMeshes.push(mesh);
      const linePoints = sample.map(point => {
        const [x, y] = project(point);
        return new THREE.Vector3(x, y, depth + .01);
      });
      linePoints.push(linePoints[0].clone());
      const outline = new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePoints), new THREE.LineBasicMaterial({ color: '#83dcff', transparent: true, opacity: .72 }));
      scene.add(outline);
      meshes.push(outline);
    }
    const largestRing = polygons.map(polygon => polygon[0]).filter(Boolean).sort((a, b) => b.length - a.length)[0];
    const position = feature.properties.centroid || feature.properties.center || (largestRing && largestRing.reduce((sum, point) => [sum[0] + point[0] / largestRing.length, sum[1] + point[1] / largestRing.length], [0, 0]));
    if (position) {
      const label = document.createElement('span');
      label.className = 'map-3d-label';
      label.textContent = item?.displayName || name;
      labelLayer.appendChild(label);
      const [x, y] = project(position);
      labels.push({ element: label, position: new THREE.Vector3(x, y, depth + .02), county: !callbacks.townLevel && (callbacks.countyLevel || geojson.features.length > 20) });
    }
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
  camera.position.set(0, -viewSize * 1.15, viewSize * .78);
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
  const onClick = event => { if (hovered && (!pointerStart || Math.hypot(event.clientX - pointerStart[0], event.clientY - pointerStart[1]) < 5)) callbacks.onClick(hovered); };
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
    pedestalRings[0].rotation.z += .0007;
    pedestalRings[1].rotation.z -= .0004;
    orbitArc.rotation.z += .003;
    for (const label of labels) {
      const projected = label.position.clone().project(camera);
      const visible = (callbacks.showLabels !== false || geojson.features.length <= 11) && projected.z < 1 && Math.abs(projected.x) < .97 && Math.abs(projected.y) < .97 && (!label.county || geojson.features.length <= 20 || camera.zoom >= 2.5);
      label.element.style.display = visible ? '' : 'none';
      if (visible) label.element.style.transform = `translate(${(projected.x + 1) * host.clientWidth / 2}px, ${(-projected.y + 1) * host.clientHeight / 2}px) translate(-50%, -50%)`;
    }
    renderer.render(scene, camera);
  }
  animate();
  return {
    resize,
    zoom(action) {
      if (action === 'reset') {
        camera.position.set(0, -viewSize * 1.15, viewSize * .78);
        controls.target.set(0, 0, 0);
        camera.zoom = 1;
      } else camera.zoom = THREE.MathUtils.clamp(camera.zoom * (action === 'in' ? 1.5 : 1 / 1.5), 1, 8);
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
      renderer.dispose();
      renderer.forceContextLoss();
      host.replaceChildren();
    }
  };
}

export { mount };
