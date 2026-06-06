import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const SECTORS = [
  { id: 'P1', n: 1, gate: 'Nord', pct: 28, color: '#22c55e', c: -90, cams: 8, agents: 342, cap: 11200 },
  { id: 'P2', n: 2, gate: 'Nord-Est', pct: 39, color: '#22c55e', c: -30, cams: 8, agents: 210, cap: 11200 },
  { id: 'P3', n: 3, gate: 'Est', pct: 82, color: '#ef4444', c: 30, critical: true, cams: 9, agents: 89, cap: 11600 },
  { id: 'P4', n: 4, gate: 'Sud', pct: 61, color: '#f59e0b', c: 90, cams: 8, agents: 280, cap: 11600 },
  { id: 'P5', n: 5, gate: 'Ouest', pct: 35, color: '#22c55e', c: 150, cams: 7, agents: 256, cap: 11200 },
  { id: 'P6', n: 6, gate: 'Nord-Ouest', pct: 71, color: '#f59e0b', c: 210, cams: 8, agents: 168, cap: 11200 },
];

const D2R = Math.PI / 180;
const COLOR_MAP = {
  '#22c55e': 0x22c55e,
  '#ef4444': 0xef4444,
  '#f59e0b': 0xf59e0b,
  '#e6edf7': 0xe6edf7,
};

export default function Stadium3D({ selectedId, onSectorClick }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const stadiumGroupRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1426);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 120, 100);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Stadium group
    const stadiumGroup = new THREE.Group();
    stadiumGroupRef.current = stadiumGroup;
    scene.add(stadiumGroup);

    // Pitch (terrain de jeu)
    const pitchGeometry = new THREE.BufferGeometry();
    const pitchVertices = [];
    const pitchIndices = [];
    
    const pitchA = 60, pitchB = 40;
    const pitchSegments = 32;
    
    for (let i = 0; i <= pitchSegments; i++) {
      const angle = (i / pitchSegments) * Math.PI * 2;
      const x = Math.cos(angle) * pitchA;
      const z = Math.sin(angle) * pitchB;
      pitchVertices.push(x, 0, z);
    }
    
    for (let i = 0; i < pitchSegments; i++) {
      pitchIndices.push(0, i, i + 1);
    }
    
    pitchGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pitchVertices), 3));
    pitchGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(pitchIndices), 1));
    pitchGeometry.computeVertexNormals();
    
    const pitchMaterial = new THREE.MeshStandardMaterial({ color: 0x1c6e2f, roughness: 0.8 });
    const pitch = new THREE.Mesh(pitchGeometry, pitchMaterial);
    pitch.position.y = 0;
    pitch.receiveShadow = true;
    stadiumGroup.add(pitch);

    // Bowl (structure principale)
    const A = 120, B = 80;
    const RI = 50, RO = 100;
    
    // Helper function to create elliptical ring
    const createEllipseRing = (radiusInner, radiusOuter, height, color, segments = 64) => {
      const geometry = new THREE.BufferGeometry();
      const vertices = [];
      const indices = [];

      // Create outer ring
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle) * radiusOuter;
        const z = Math.sin(angle) * radiusOuter;
        
        vertices.push(x, 0, z);
        vertices.push(x, height, z);
      }

      // Create inner ring
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle) * radiusInner;
        const z = Math.sin(angle) * radiusInner;
        
        vertices.push(x, 0, z);
        vertices.push(x, height, z);
      }

      // Create indices for faces
      for (let i = 0; i < segments; i++) {
        const base = i * 2;
        const baseNext = ((i + 1) % (segments + 1)) * 2;
        const innerBase = (segments + 1) * 2 + i * 2;
        const innerNext = (segments + 1) * 2 + ((i + 1) % (segments + 1)) * 2;

        // Outer face
        indices.push(base, baseNext, base + 1);
        indices.push(baseNext, baseNext + 1, base + 1);

        // Inner face
        indices.push(innerBase + 1, innerNext, innerBase);
        indices.push(innerBase + 1, innerNext + 1, innerNext);

        // Side faces
        indices.push(base, innerBase, baseNext);
        indices.push(baseNext, innerBase, innerNext);
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
      geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
      geometry.computeVertexNormals();

      const material = new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };
    
    // Create seating tiers
    const tier1 = createEllipseRing(RI, RI + 15, 15, 0x243246);
    const tier2 = createEllipseRing(RI + 15, RI + 30, 15, 0x2a3c52);
    tier2.position.y = 15;
    const tier3 = createEllipseRing(RI + 30, RO, 15, 0x2a3c52);
    tier3.position.y = 30;

    stadiumGroup.add(tier1, tier2, tier3);

    // Sector indicators (cylinders for each sector)
    SECTORS.forEach((sector) => {
      const angle = sector.c * D2R;
      const radius = RO + 20;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Indicator cylinder
      const indicatorGeometry = new THREE.CylinderGeometry(8, 8, 8, 16);
      const color = parseInt(sector.color.replace('#', '0x'));
      const indicatorMaterial = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.6,
        emissive: color,
        emissiveIntensity: 0.3,
      });
      const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
      indicator.position.set(x, 4, z);
      indicator.castShadow = true;
      indicator.receiveShadow = true;
      indicator.userData = { sectorId: sector.id };
      indicator.onClick = () => onSectorClick?.(sector);
      stadiumGroup.add(indicator);
    });

    // Seats (small spheres)
    SECTORS.forEach((sector) => {
      const count = Math.floor(sector.pct / 10) * 5;
      const angle = sector.c * D2R;
      const color = parseInt(sector.color.replace('#', '0x'));

      for (let i = 0; i < count; i++) {
        const r = RI + 20 + Math.random() * 30;
        const a = angle - 15 * D2R + Math.random() * 30 * D2R;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        const y = 10 + Math.random() * 20;

        const seatGeometry = new THREE.SphereGeometry(1, 8, 8);
        const seatMaterial = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.7,
          emissive: color,
          emissiveIntensity: 0.2,
        });
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(x, y, z);
        seat.scale.set(0.8, 0.8, 0.8);
        stadiumGroup.add(seat);
      }
    });

    // Simple orbit controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotation = { x: 0.5, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      rotation.y += deltaX * 0.01;
      rotation.x += deltaY * 0.01;

      rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotation.x));

      const radius = 200;
      camera.position.x = Math.sin(rotation.y) * Math.cos(rotation.x) * radius;
      camera.position.y = Math.sin(rotation.x) * radius + 50;
      camera.position.z = Math.cos(rotation.y) * Math.cos(rotation.x) * radius;
      camera.lookAt(0, 20, 0);

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mouseleave', onMouseUp);

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mouseleave', onMouseUp);
      cancelAnimationFrame(animationId);
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [onSectorClick]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          color: '#aab8d0',
          fontSize: '12px',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <p style={{ margin: 0 }}>🖱️ Drag to rotate • Scroll to zoom</p>
      </div>
    </div>
  );
}
