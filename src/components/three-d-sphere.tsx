"use client";

import { useEffect, useRef } from "react";

export function ThreeDSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, lastX: 0, lastY: 0, velocity: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width;
    let height = canvas.height;

    // Device Pixel Ratio scaling for sharp rendering
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Track mouse movement and calculate velocity
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / width - 0.5;
      const y = (e.clientY - rect.top) / height - 0.5;
      
      const mouse = mouseRef.current;
      mouse.targetX = x * 2.0;
      mouse.targetY = y * 2.0;

      // Calculate velocity (speed of cursor movement)
      const dx = x - mouse.lastX;
      const dy = y - mouse.lastY;
      mouse.velocity = Math.min(2.5, Math.hypot(dx, dy) * 100);
      mouse.lastX = x;
      mouse.lastY = y;
    };

    window.addEventListener("mousemove", onMouseMove);

    // 3D/4D/5D Particles configuration
    interface Particle {
      // Current 3D position
      x: number;
      y: number;
      z: number;
      // Coordinates for target shapes
      sphereX: number;
      sphereY: number;
      sphereZ: number;
      cubeX: number;
      cubeY: number;
      cubeZ: number;
      torusX: number;
      torusY: number;
      torusZ: number;

      size: number;
      color: string;
      type: "dot" | "rupee" | "percent" | "chart" | "tax" | "node";
      angle: number;
      speed: number;
      radius: number;
    }

    const isMobile = window.innerWidth < 768;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const particles: Particle[] = [];
    const particleCount = isMobile ? 60 : 130;
    const sphereRadius = 135;

    // Colors list
    const colors = [
      "rgba(59, 130, 246, 0.8)",  // electric blue
      "rgba(16, 185, 129, 0.8)",  // emerald green
      "rgba(245, 183, 74, 0.8)",  // gold highlights
      "rgba(255, 255, 255, 0.95)", // pure white
    ];

    const types: Particle["type"][] = ["dot", "rupee", "percent", "chart", "tax", "node"];

    // Initialize morph targets for 4D transition
    for (let i = 0; i < particleCount; i++) {
      // 1. Sphere target coordinates
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = sphereRadius * (0.35 + 0.65 * Math.random());
      const sx = r * Math.sin(phi) * Math.cos(theta);
      const sy = r * Math.sin(phi) * Math.sin(theta);
      const sz = r * Math.cos(phi);

      // 2. Cube target coordinates
      let cx = 0, cy = 0, cz = 0;
      const face = Math.floor(Math.random() * 6);
      const u = (Math.random() - 0.5) * sphereRadius * 1.5;
      const v = (Math.random() - 0.5) * sphereRadius * 1.5;
      const half = (sphereRadius * 1.5) / 2;

      switch(face) {
        case 0: cx = half; cy = u; cz = v; break;
        case 1: cx = -half; cy = u; cz = v; break;
        case 2: cx = u; cy = half; cz = v; break;
        case 3: cx = u; cy = -half; cz = v; break;
        case 4: cx = u; cy = v; cz = half; break;
        case 5: cx = u; cy = v; cz = -half; break;
      }

      // 3. Torus target coordinates
      const torusAngle = Math.random() * Math.PI * 2;
      const tubeAngle = Math.random() * Math.PI * 2;
      const R_torus = sphereRadius * 1.1;
      const r_tube = sphereRadius * 0.35;
      const tx = (R_torus + r_tube * Math.cos(tubeAngle)) * Math.cos(torusAngle);
      const ty = (R_torus + r_tube * Math.cos(tubeAngle)) * Math.sin(torusAngle);
      const tz = r_tube * Math.sin(tubeAngle);

      particles.push({
        x: sx,
        y: sy,
        z: sz,
        sphereX: sx,
        sphereY: sy,
        sphereZ: sz,
        cubeX: cx,
        cubeY: cy,
        cubeZ: cz,
        torusX: tx,
        torusY: ty,
        torusZ: tz,
        size: 1.2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: types[Math.floor(Math.random() * types.length)],
        angle: Math.random() * Math.PI * 2,
        speed: (0.003 + Math.random() * 0.006) * (Math.random() > 0.5 ? 1 : -1),
        radius: r,
      });
    }

    // Rings metadata
    interface RingItem {
      label: string;
      angleOffset: number;
      color: string;
    }

    const rings: { items: RingItem[]; rotX: number; rotZ: number; size: number }[] = [
      {
        size: 195,
        rotX: Math.PI / 3.2,
        rotZ: Math.PI / 5,
        items: [
          { label: "GST", angleOffset: 0, color: "#4f7cff" },
          { label: "Income Tax", angleOffset: Math.PI * 0.67, color: "#34d399" },
          { label: "Transfer Pricing", angleOffset: Math.PI * 1.33, color: "#f5b74a" },
        ],
      },
      {
        size: 245,
        rotX: -Math.PI / 3.8,
        rotZ: -Math.PI / 3.8,
        items: [
          { label: "Intl Tax", angleOffset: 0, color: "#38e1d6" },
          { label: "Compliance", angleOffset: Math.PI * 0.5, color: "#3b82f6" },
          { label: "Advisory", angleOffset: Math.PI, color: "#f5b74a" },
          { label: "Virtual CFO", angleOffset: Math.PI * 1.5, color: "#ffffff" },
        ],
      },
    ];

    let time = 0;
    const focalLength = 400;

    // Rotation functions
    const rotateX = (x: number, y: number, z: number, angle: number) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { x, y: y * cos - z * sin, z: y * sin + z * cos };
    };

    const rotateY = (x: number, y: number, z: number, angle: number) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { x: x * cos + z * sin, y, z: -x * sin + z * cos };
    };

    const rotateZ = (x: number, y: number, z: number, angle: number) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { x: x * cos - y * sin, y: x * sin + y * cos, z };
    };

    // Visibility: pause animation when canvas is off-screen
    let isVisible = true;
    let running = false;

    // Render loop
    const tick = () => {
      if (!isVisible) { running = false; return; }
      time += 0.005;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Smooth mouse follow (easing) and decelerate velocity
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.07;
      mouse.y += (mouse.targetY - mouse.y) * 0.07;
      mouse.velocity *= 0.95; // decay

      // 4D: Determine active morph target based on time cycles
      const cycleDuration = 8; // seconds per shape
      const cycleTime = (time * 2) % (cycleDuration * 3);
      let morphProgress = 0;
      let activeShape: "sphere" | "cube" | "torus" = "sphere";
      let nextShape: "sphere" | "cube" | "torus" = "cube";

      if (cycleTime < cycleDuration) {
        activeShape = "sphere";
        nextShape = "cube";
        morphProgress = cycleTime / cycleDuration;
      } else if (cycleTime < cycleDuration * 2) {
        activeShape = "cube";
        nextShape = "torus";
        morphProgress = (cycleTime - cycleDuration) / cycleDuration;
      } else {
        activeShape = "torus";
        nextShape = "sphere";
        morphProgress = (cycleTime - cycleDuration * 2) / cycleDuration;
      }

      // Smooth step interpolation for morphing
      const easeProgress = 3 * morphProgress * morphProgress - 2 * morphProgress * morphProgress * morphProgress;

      // Base rotation angles
      const angleY = time * 0.4 + mouse.x * 0.35;
      const angleX = time * 0.25 + mouse.y * 0.35;

      interface Projected {
        x2d: number;
        y2d: number;
        depth: number;
        scale: number;
        opacity: number;
        color: string;
        render: () => void;
      }

      const drawQueue: Projected[] = [];

      // 1. Process 4D/5D Particles
      particles.forEach(p => {
        // Orbit update
        p.angle += p.speed;

        // Get coordinates for active and next morph targets
        let x1 = 0, y1 = 0, z1 = 0;
        let x2 = 0, y2 = 0, z2 = 0;

        // Shape 1
        if (activeShape === "sphere") {
          x1 = p.radius * Math.cos(p.angle);
          y1 = p.sphereY;
          z1 = p.radius * Math.sin(p.angle);
        } else if (activeShape === "cube") {
          x1 = p.cubeX; y1 = p.cubeY; z1 = p.cubeZ;
        } else {
          x1 = p.torusX; y1 = p.torusY; z1 = p.torusZ;
        }

        // Shape 2
        if (nextShape === "sphere") {
          x2 = p.radius * Math.cos(p.angle);
          y2 = p.sphereY;
          z2 = p.radius * Math.sin(p.angle);
        } else if (nextShape === "cube") {
          x2 = p.cubeX; y2 = p.cubeY; z2 = p.cubeZ;
        } else {
          x2 = p.torusX; y2 = p.torusY; z2 = p.torusZ;
        }

        // 4D Morph interpolation
        let base3D = {
          x: x1 + (x2 - x1) * easeProgress,
          y: y1 + (y2 - y1) * easeProgress,
          z: z1 + (z2 - z1) * easeProgress,
        };

        // 5D: Cursor Gravity Influence attractor field
        // Project cursor position into 3D plane (z=0) relative to center
        const cursor3D = { x: mouse.x * width * 0.45, y: mouse.y * height * 0.45, z: 0 };
        const distToCursor = Math.hypot(base3D.x - cursor3D.x, base3D.y - cursor3D.y);
        
        // Attract particles within a radius, scaled by cursor movement speed (5D effect)
        const pullRadius = 120;
        if (distToCursor < pullRadius) {
          const force = (1 - distToCursor / pullRadius) * (0.15 + mouse.velocity * 0.25);
          base3D.x += (cursor3D.x - base3D.x) * force;
          base3D.y += (cursor3D.y - base3D.y) * force;
          base3D.z += (cursor3D.z - base3D.z) * force;
        }

        // Rotate 3D
        let rot = rotateY(base3D.x, base3D.y, base3D.z, angleY);
        rot = rotateX(rot.x, rot.y, rot.z, angleX);

        // Perspective scale
        const scale = focalLength / (focalLength + rot.z);
        const x2d = centerX + rot.x * scale;
        const y2d = centerY + rot.y * scale;

        // Depth opacity
        const opacity = Math.max(0.1, Math.min(1, (focalLength - rot.z) / (focalLength * 1.5)));

        drawQueue.push({
          x2d,
          y2d,
          depth: rot.z,
          scale,
          opacity,
          color: p.color,
          render: () => {
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.fillStyle = p.color;

            if (p.type === "rupee") {
              ctx.font = `bold ${Math.round(11 * scale)}px sans-serif`;
              ctx.fillText("₹", x2d - 3, y2d + 4);
            } else if (p.type === "percent") {
              ctx.font = `bold ${Math.round(9 * scale)}px sans-serif`;
              ctx.fillText("%", x2d - 4, y2d + 3);
            } else if (p.type === "chart") {
              const bh = 10 * scale;
              const bw = 3 * scale;
              ctx.fillRect(x2d - bw * 1.5, y2d - bh * 0.5, bw, bh);
              ctx.fillRect(x2d - bw * 0.2, y2d - bh * 0.8, bw, bh * 1.3);
              ctx.fillRect(x2d + bw * 1.1, y2d - bh * 0.3, bw, bh * 0.8);
            } else if (p.type === "tax") {
              ctx.font = `bold ${Math.round(8 * scale)}px monospace`;
              ctx.fillText("ITR", x2d - 8, y2d + 3);
            } else if (p.type === "node") {
              ctx.beginPath();
              ctx.arc(x2d, y2d, p.size * scale * 1.6, 0, Math.PI * 2);
              ctx.shadowColor = p.color;
              ctx.shadowBlur = 12;
              ctx.fill();
            } else {
              ctx.beginPath();
              ctx.arc(x2d, y2d, p.size * scale * 0.8, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          },
        });
      });

      // 2. Draw rings in 3D
      rings.forEach(ring => {
        const ringPoints = 72;
        const ringRotTime = time * 0.15;

        // Draw ring segments
        const points3D: { x: number; y: number; z: number }[] = [];
        for (let i = 0; i <= ringPoints; i++) {
          const angle = (i / ringPoints) * Math.PI * 2;
          const rx = ring.size * Math.cos(angle);
          const rz = ring.size * Math.sin(angle);
          
          let p3d = rotateX(rx, 0, rz, ring.rotX);
          p3d = rotateZ(p3d.x, p3d.y, p3d.z, ring.rotZ);
          p3d = rotateY(p3d.x, p3d.y, p3d.z, angleY * 0.4);
          p3d = rotateX(p3d.x, p3d.y, p3d.z, angleX * 0.4);
          points3D.push(p3d);
        }

        for (let i = 0; i < ringPoints; i++) {
          const p1 = points3D[i];
          const p2 = points3D[i + 1];

          const avgZ = (p1.z + p2.z) / 2;
          const scale1 = focalLength / (focalLength + p1.z);
          const scale2 = focalLength / (focalLength + p2.z);

          const x1 = centerX + p1.x * scale1;
          const y1 = centerY + p1.y * scale1;
          const x2 = centerX + p2.x * scale2;
          const y2 = centerY + p2.y * scale2;

          const op = Math.max(0.04, Math.min(0.26, (focalLength - avgZ) / (focalLength * 2.2)));

          drawQueue.push({
            x2d: (x1 + x2) / 2,
            y2d: (y1 + y2) / 2,
            depth: avgZ,
            scale: (scale1 + scale2) / 2,
            opacity: op,
            color: "rgba(59, 130, 246, 0.4)",
            render: () => {
              ctx.save();
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.strokeStyle = `rgba(59, 130, 246, ${op})`;
              ctx.lineWidth = 1;
              ctx.stroke();
              ctx.restore();
            },
          });
        }

        // Draw ring items (holographic text tags)
        ring.items.forEach(item => {
          const angle = ringRotTime + item.angleOffset;
          const rx = ring.size * Math.cos(angle);
          const rz = ring.size * Math.sin(angle);

          let p3d = rotateX(rx, 0, rz, ring.rotX);
          p3d = rotateZ(p3d.x, p3d.y, p3d.z, ring.rotZ);
          p3d = rotateY(p3d.x, p3d.y, p3d.z, angleY * 0.4);
          p3d = rotateX(p3d.x, p3d.y, p3d.z, angleX * 0.4);

          const scale = focalLength / (focalLength + p3d.z);
          const x2d = centerX + p3d.x * scale;
          const y2d = centerY + p3d.y * scale;

          const opacity = Math.max(0.15, Math.min(1, (focalLength - p3d.z) / (focalLength * 1.4)));

          drawQueue.push({
            x2d,
            y2d,
            depth: p3d.z,
            scale,
            opacity,
            color: item.color,
            render: () => {
              ctx.save();
              ctx.globalAlpha = opacity;
              ctx.font = `bold ${Math.round(9 * scale)}px sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";

              // Tag card background
              const tw = ctx.measureText(item.label).width + 12;
              const th = 16 * scale;
              ctx.fillStyle = "rgba(5, 5, 5, 0.85)";
              ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(x2d - tw / 2, y2d - th / 2, tw, th, 6);
              ctx.fill();
              ctx.stroke();

              // Text glow
              ctx.fillStyle = item.color;
              ctx.shadowColor = item.color;
              ctx.shadowBlur = 8;
              ctx.fillText(item.label, x2d, y2d + 0.5);
              ctx.restore();
            },
          });
        });
      });

      // Sort by depth (Painters algorithm)
      drawQueue.sort((a, b) => b.depth - a.depth);

      // Render back objects
      let i = 0;
      while (i < drawQueue.length && drawQueue[i].depth > 0) {
        drawQueue[i].render();
        i++;
      }

      // Draw the central glass crystal sphere (z = 0) with shifting 5D spectrum colors
      ctx.save();
      
      // Calculate color spectrum shift based on mouse interaction (5D theme)
      const spectrumShift = (time * 12 + mouse.x * 60) % 360;
      const glowColor = `hsla(${spectrumShift}, 70%, 60%, 0.12)`;
      const rimColor = `hsla(${spectrumShift}, 70%, 75%, 0.35)`;

      const sphereGrad = ctx.createRadialGradient(
        centerX - sphereRadius * 0.35,
        centerY - sphereRadius * 0.35,
        sphereRadius * 0.1,
        centerX,
        centerY,
        sphereRadius
      );
      sphereGrad.addColorStop(0, "rgba(255, 255, 255, 0.2)");
      sphereGrad.addColorStop(0.35, glowColor);
      sphereGrad.addColorStop(0.7, "rgba(5, 5, 5, 0.2)");
      sphereGrad.addColorStop(0.95, "rgba(59, 130, 246, 0.1)");
      sphereGrad.addColorStop(1, rimColor);

      ctx.beginPath();
      ctx.arc(centerX, centerY, sphereRadius, 0, Math.PI * 2);
      ctx.fillStyle = sphereGrad;
      ctx.shadowColor = `hsla(${spectrumShift}, 80%, 60%, 0.35)`;
      ctx.shadowBlur = 55;
      ctx.fill();

      // Crystal rim line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top gloss highlight
      ctx.beginPath();
      ctx.ellipse(
        centerX - sphereRadius * 0.38,
        centerY - sphereRadius * 0.38,
        sphereRadius * 0.24,
        sphereRadius * 0.11,
        -Math.PI / 4,
        0,
        Math.PI * 2
      );
      const reflectGrad = ctx.createLinearGradient(
        centerX - sphereRadius * 0.48,
        centerY - sphereRadius * 0.48,
        centerX - sphereRadius * 0.28,
        centerY - sphereRadius * 0.28
      );
      reflectGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
      reflectGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = reflectGrad;
      ctx.fill();
      ctx.restore();

      // Render front objects
      while (i < drawQueue.length) {
        drawQueue[i].render();
        i++;
      }

      if (!reducedMotion) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible && !running) {
        running = true;
        animationFrameId = requestAnimationFrame(tick);
      }
    }, { rootMargin: "80px" });
    observer.observe(canvas);

    running = true;
    tick();

    // Clean up
    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background neon fog behind the canvas */}
      <div className="absolute w-[290px] h-[290px] rounded-full bg-gradient-to-tr from-[#3b82f6]/20 via-[#10b981]/15 to-transparent blur-[65px] pointer-events-none" />
      <canvas
        ref={canvasRef}
        className="w-full h-[380px] sm:h-[480px] relative z-10 cursor-grab active:cursor-grabbing"
      />
    </div>
  );
}
