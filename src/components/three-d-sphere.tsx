"use client";

import { useEffect, useRef } from "react";

export function ThreeDSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

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

    // Track mouse movement
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / width - 0.5;
      const y = (e.clientY - rect.top) / height - 0.5;
      mouseRef.current.targetX = x * 2.0; // multiplier for sensitivity
      mouseRef.current.targetY = y * 2.0;
    };

    window.addEventListener("mousemove", onMouseMove);

    // 3D Particles configuration
    interface Particle {
      x: number;
      y: number;
      z: number;
      baseX: number;
      baseY: number;
      baseZ: number;
      size: number;
      color: string;
      type: "dot" | "rupee" | "percent" | "chart" | "tax" | "node";
      angle: number;
      speed: number;
      radius: number;
    }

    const particles: Particle[] = [];
    const particleCount = 120;
    const sphereRadius = 140;

    // Colors list
    const colors = [
      "rgba(59, 130, 246, 0.8)",  // blue
      "rgba(16, 185, 129, 0.8)",  // emerald
      "rgba(245, 183, 74, 0.8)",  // gold
      "rgba(255, 255, 255, 0.9)", // white
    ];

    const types: Particle["type"][] = ["dot", "rupee", "percent", "chart", "tax", "node"];

    // Initialize particles in a sphere shell
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = sphereRadius * (0.3 + 0.7 * Math.random()); // distribute inside sphere

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      particles.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        size: 1 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: types[Math.floor(Math.random() * types.length)],
        angle: Math.random() * Math.PI * 2,
        speed: (0.002 + Math.random() * 0.005) * (Math.random() > 0.5 ? 1 : -1),
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
        size: 190,
        rotX: Math.PI / 3.5,
        rotZ: Math.PI / 6,
        items: [
          { label: "Audit", angleOffset: 0, color: "#3b82f6" },
          { label: "Tax", angleOffset: Math.PI * 0.67, color: "#10b981" },
          { label: "GST", angleOffset: Math.PI * 1.33, color: "#f5b74a" },
        ],
      },
      {
        size: 240,
        rotX: -Math.PI / 4,
        rotZ: -Math.PI / 4,
        items: [
          { label: "Compliance", angleOffset: 0, color: "#10b981" },
          { label: "Startup", angleOffset: Math.PI * 0.5, color: "#3b82f6" },
          { label: "CFO Services", angleOffset: Math.PI, color: "#f5b74a" },
          { label: "Business Advisory", angleOffset: Math.PI * 1.5, color: "#ffffff" },
        ],
      },
    ];

    let time = 0;
    const focalLength = 400;

    // Helper: Rotate points in 3D space
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

    // Render loop
    const tick = () => {
      time += 0.005;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Smooth mouse follow (easing)
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Base rotation angles
      const angleY = time * 0.5 + mouse.x * 0.3;
      const angleX = time * 0.3 + mouse.y * 0.3;

      // Project and draw 3D objects
      interface Projected {
        x2d: number;
        y2d: number;
        depth: number;
        size: number;
        color: string;
        render: () => void;
      }

      const drawQueue: Projected[] = [];

      // Add particles to queue
      particles.forEach(p => {
        // Orbit particle around Y axis
        p.angle += p.speed;
        const orbitX = p.radius * Math.cos(p.angle);
        const orbitZ = p.radius * Math.sin(p.angle);
        
        // Rotate 3D
        let rot = rotateY(orbitX, p.y, orbitZ, angleY);
        rot = rotateX(rot.x, rot.y, rot.z, angleX);

        // Perspective scale
        const scale = focalLength / (focalLength + rot.z);
        const x2d = centerX + rot.x * scale;
        const y2d = centerY + rot.y * scale;

        // Opacity based on depth
        const opacity = Math.max(0.1, Math.min(1, (focalLength - rot.z) / (focalLength * 1.5)));

        drawQueue.push({
          x2d,
          y2d,
          depth: rot.z,
          size: p.size * scale,
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
              // mini bar chart
              const bh = 10 * scale;
              const bw = 3 * scale;
              ctx.fillRect(x2d - bw * 1.5, y2d - bh * 0.5, bw, bh);
              ctx.fillRect(x2d - bw * 0.2, y2d - bh * 0.8, bw, bh * 1.3);
              ctx.fillRect(x2d + bw * 1.1, y2d - bh * 0.3, bw, bh * 0.8);
            } else if (p.type === "tax") {
              ctx.font = `bold ${Math.round(8 * scale)}px monospace`;
              ctx.fillText("ITR", x2d - 8, y2d + 3);
            } else if (p.type === "node") {
              // Glowing node
              ctx.beginPath();
              ctx.arc(x2d, y2d, p.size * scale * 1.5, 0, Math.PI * 2);
              ctx.shadowColor = p.color;
              ctx.shadowBlur = 10;
              ctx.fill();
            } else {
              // simple dot
              ctx.beginPath();
              ctx.arc(x2d, y2d, p.size * scale * 0.8, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          },
        });
      });

      // Add orbital rings to queue
      rings.forEach(ring => {
        const ringPoints = 72;
        const ringRotTime = time * 0.15;

        // Draw ring track in 3D
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

        // Draw segments
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

          const op = Math.max(0.05, Math.min(0.3, (focalLength - avgZ) / (focalLength * 2)));

          drawQueue.push({
            x2d: (x1 + x2) / 2,
            y2d: (y1 + y2) / 2,
            depth: avgZ,
            size: 1,
            color: "rgba(79, 124, 255, 0.4)",
            render: () => {
              ctx.save();
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.strokeStyle = `rgba(79, 124, 255, ${op})`;
              ctx.lineWidth = 1;
              ctx.stroke();
              ctx.restore();
            },
          });
        }

        // Draw ring floating text items
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

          const opacity = Math.max(0.1, Math.min(1, (focalLength - p3d.z) / (focalLength * 1.5)));

          drawQueue.push({
            x2d,
            y2d,
            depth: p3d.z,
            size: 1,
            color: item.color,
            render: () => {
              ctx.save();
              ctx.globalAlpha = opacity;
              ctx.fillStyle = item.color;
              ctx.font = `bold ${Math.round(9 * scale)}px sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";

              // Glass tag background
              const tw = ctx.measureText(item.label).width + 12;
              const th = 16 * scale;
              ctx.fillStyle = "rgba(10, 13, 21, 0.75)";
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

      // Sort by depth (painters algorithm) - render back items first
      drawQueue.sort((a, b) => b.depth - a.depth);

      // Render items behind the sphere
      let i = 0;
      while (i < drawQueue.length && drawQueue[i].depth > 0) {
        drawQueue[i].render();
        i++;
      }

      // Draw the central glass crystal sphere (at z = 0 depth)
      ctx.save();
      // Spherical reflection & refraction effect
      const sphereGrad = ctx.createRadialGradient(
        centerX - sphereRadius * 0.35,
        centerY - sphereRadius * 0.35,
        sphereRadius * 0.1,
        centerX,
        centerY,
        sphereRadius
      );
      // Dark space glass color palette
      sphereGrad.addColorStop(0, "rgba(255, 255, 255, 0.18)");
      sphereGrad.addColorStop(0.3, "rgba(59, 130, 246, 0.05)");
      sphereGrad.addColorStop(0.7, "rgba(10, 13, 21, 0.15)");
      sphereGrad.addColorStop(0.95, "rgba(59, 130, 246, 0.12)");
      sphereGrad.addColorStop(1, "rgba(255, 255, 255, 0.35)");

      ctx.beginPath();
      ctx.arc(centerX, centerY, sphereRadius, 0, Math.PI * 2);
      ctx.fillStyle = sphereGrad;
      ctx.shadowColor = "rgba(59, 130, 246, 0.3)";
      ctx.shadowBlur = 50;
      ctx.fill();

      // Translucent rim highlight
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top-left reflection highlight gloss
      ctx.beginPath();
      ctx.ellipse(
        centerX - sphereRadius * 0.4,
        centerY - sphereRadius * 0.4,
        sphereRadius * 0.25,
        sphereRadius * 0.12,
        -Math.PI / 4,
        0,
        Math.PI * 2
      );
      const reflectGrad = ctx.createLinearGradient(
        centerX - sphereRadius * 0.5,
        centerY - sphereRadius * 0.5,
        centerX - sphereRadius * 0.3,
        centerY - sphereRadius * 0.3
      );
      reflectGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
      reflectGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = reflectGrad;
      ctx.fill();
      ctx.restore();

      // Render front items (depth < 0)
      while (i < drawQueue.length) {
        drawQueue[i].render();
        i++;
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background soft lighting mesh behind the canvas */}
      <div className="absolute w-[280px] h-[280px] rounded-full bg-gradient-to-tr from-[#3b82f6]/20 via-[#10b981]/10 to-transparent blur-[60px] pointer-events-none" />
      <canvas
        ref={canvasRef}
        className="w-full h-[380px] sm:h-[480px] relative z-10 cursor-grab active:cursor-grabbing"
      />
    </div>
  );
}
