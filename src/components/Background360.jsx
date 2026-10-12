import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function Background360({ isPlaying, currentTime }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Create hidden video element
    const video = document.createElement('video');
    video.src = '/mv/Track00_MV.mp4';
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('playsinline', 'true');
    video.playbackRate = 1.0;
    videoRef.current = video;

    // Auto-play muted video
    video.play().catch(() => {
      // Browser autoplay policy fallback on user interaction
      const startPlay = () => {
        video.play().catch(() => {});
        window.removeEventListener('click', startPlay);
      };
      window.addEventListener('click', startPlay, { once: true });
    });

    // 2. Three.js Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      1,
      1200
    );
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.className = 'bg-360-canvas';
    container.appendChild(renderer.domElement);

    // 3. Inverted 360 Sphere
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    // Invert geometry so the inside of the sphere is visible
    geometry.scale(-1, 1, 1);

    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // 4. Continuous smooth rotation loop + interactive drag
    let animationFrameId;
    let rotationSpeed = 0.0012; // Continuous 360 pan speed
    let isDragging = false;
    let previousPos = { x: 0, y: 0 };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isDragging) {
        sphere.rotation.y += rotationSpeed;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Mouse & Touch drag support on free areas
    const onPointerDown = (e) => {
      if (e.target.closest('button, input, a, .lyrics-list-viewport, .cover-card, .player-bar, .header')) return;
      isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      previousPos = { x: clientX, y: clientY };
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - previousPos.x;
      const deltaY = clientY - previousPos.y;

      sphere.rotation.y += deltaX * 0.003;
      camera.rotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, camera.rotation.x + deltaY * 0.002));
      previousPos = { x: clientX, y: clientY };
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // 5. Responsive Resize
    const handleResize = () => {
      if (!renderer || !camera) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);

      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }

      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync play/pause state with audio player
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      if (video.paused) {
        video.play().catch(() => {});
      }
    } else {
      if (!video.paused) {
        video.pause();
      }
    }
  }, [isPlaying]);

  // Optional: keep video time roughly synchronized with track audio (within 1.5s margin)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || currentTime == null) return;

    if (Math.abs(video.currentTime - currentTime) > 2) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  return <div ref={containerRef} className="bg-360-container" />;
}
