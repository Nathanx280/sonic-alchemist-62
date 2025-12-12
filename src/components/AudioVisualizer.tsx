import { motion } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";

interface TextOverlay {
  text: string;
  font: string;
  fontSize: number;
  color: string;
  position: "top" | "center" | "bottom";
  alignment: "left" | "center" | "right";
  shadowColor: string;
  shadowBlur: number;
  visible: boolean;
}

interface AudioVisualizerProps {
  isPlaying: boolean;
  audioData?: number[];
  title?: string;
  artist?: string;
  barStyle?: "classic" | "rounded" | "dots" | "blocks" | "circular" | "radial" | "wave" | "comic";
  showParticles?: boolean;
  showRings?: boolean;
  mirrorBars?: boolean;
  rotatingDisc?: boolean;
  customBackground?: string | null;
  colorScheme?: string[];
  titleOverlay?: TextOverlay;
  artistOverlay?: TextOverlay;
  comicCenterImage?: string | null;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

const AudioVisualizer = ({ 
  isPlaying, 
  audioData, 
  title = "DEEP REWORK", 
  artist = "AI REMIX",
  barStyle = "classic",
  showParticles: showParticlesProp = true,
  showRings: showRingsProp = true,
  mirrorBars = true,
  rotatingDisc = true,
  customBackground,
  colorScheme,
  titleOverlay,
  artistOverlay,
  comicCenterImage,
}: AudioVisualizerProps) => {
  const [bars, setBars] = useState<number[]>(Array(32).fill(20));
  const [particles, setParticles] = useState<Particle[]>([]);
  const [bassIntensity, setBassIntensity] = useState(0);
  const [midIntensity, setMidIntensity] = useState(0);
  const [highIntensity, setHighIntensity] = useState(0);
  const particleIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const defaultColors = [
    "hsl(185, 100%, 50%)",
    "hsl(270, 100%, 65%)",
    "hsl(320, 100%, 60%)",
    "hsl(45, 100%, 60%)",
  ];

  const colors = colorScheme || defaultColors;

  const spawnParticle = useCallback((intensity: number) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    return {
      id: particleIdRef.current++,
      x: Math.random() * 100,
      y: 80 + Math.random() * 20,
      size: 2 + Math.random() * 4 * intensity,
      speedX: (Math.random() - 0.5) * 2,
      speedY: -1 - Math.random() * 3 * intensity,
      opacity: 0.6 + Math.random() * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  }, []);

  useEffect(() => {
    if (audioData && audioData.length > 0 && isPlaying) {
      const bassRange = audioData.slice(0, 8);
      const midRange = audioData.slice(8, 20);
      const highRange = audioData.slice(20);
      
      const bass = bassRange.reduce((a, b) => a + b, 0) / bassRange.length / 100;
      const mid = midRange.reduce((a, b) => a + b, 0) / midRange.length / 100;
      const high = highRange.reduce((a, b) => a + b, 0) / highRange.length / 100;
      
      setBassIntensity(bass);
      setMidIntensity(mid);
      setHighIntensity(high);
      
      setBars(audioData.slice(0, 32).map(v => Math.max(v * 0.8, 5)));
      
      // Spawn particles based on bass hits
      if (bass > 0.5) {
        const newParticles: Particle[] = [];
        for (let i = 0; i < Math.floor(bass * 5); i++) {
          const p = spawnParticle(bass);
          if (p) newParticles.push(p);
        }
        setParticles(prev => [...prev.slice(-50), ...newParticles]);
      }
    } else if (!isPlaying) {
      const interval = setInterval(() => {
        setBars(prev => prev.map((_, i) => 15 + Math.sin(Date.now() / 800 + i * 0.3) * 12));
        setBassIntensity(0.3 + Math.sin(Date.now() / 1000) * 0.1);
        setMidIntensity(0.3 + Math.sin(Date.now() / 800) * 0.1);
        setHighIntensity(0.3 + Math.sin(Date.now() / 600) * 0.1);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isPlaying, audioData, spawnParticle]);

  // Update particles
  useEffect(() => {
    if (particles.length === 0) return;
    
    const interval = setInterval(() => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.speedX,
            y: p.y + p.speedY,
            opacity: p.opacity - 0.02,
          }))
          .filter(p => p.opacity > 0 && p.y > 0)
      );
    }, 30);
    
    return () => clearInterval(interval);
  }, [particles.length]);

  const getBarColor = (index: number, total: number) => {
    const position = index / total;
    if (position < 0.25) return "hsl(185, 100%, 50%)";
    if (position < 0.5) return "hsl(270, 100%, 65%)";
    if (position < 0.75) return "hsl(320, 100%, 60%)";
    return "hsl(45, 100%, 60%)";
  };

  const renderBars = () => {
    switch (barStyle) {
      case "circular":
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="300" height="300" className="absolute">
              {bars.map((height, index) => {
                const angle = (index / bars.length) * Math.PI * 2 - Math.PI / 2;
                const innerRadius = 80;
                const outerRadius = innerRadius + (height / 100) * 60;
                const x1 = 150 + Math.cos(angle) * innerRadius;
                const y1 = 150 + Math.sin(angle) * innerRadius;
                const x2 = 150 + Math.cos(angle) * outerRadius;
                const y2 = 150 + Math.sin(angle) * outerRadius;
                return (
                  <motion.line
                    key={index}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={getBarColor(index, bars.length)}
                    strokeWidth="3"
                    strokeLinecap="round"
                    animate={{ x2, y2 }}
                    transition={{ duration: 0.05 }}
                    style={{
                      filter: isPlaying ? `drop-shadow(0 0 4px ${getBarColor(index, bars.length)})` : undefined,
                    }}
                  />
                );
              })}
            </svg>
          </div>
        );

      case "radial":
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="300" height="300" className="absolute">
              {bars.map((height, index) => {
                const angle = (index / bars.length) * Math.PI * 2;
                const length = 30 + (height / 100) * 80;
                const x2 = 150 + Math.cos(angle) * length;
                const y2 = 150 + Math.sin(angle) * length;
                return (
                  <motion.line
                    key={index}
                    x1={150}
                    y1={150}
                    x2={x2}
                    y2={y2}
                    stroke={getBarColor(index, bars.length)}
                    strokeWidth="4"
                    strokeLinecap="round"
                    animate={{ x2, y2 }}
                    transition={{ duration: 0.05 }}
                    style={{
                      filter: isPlaying ? `drop-shadow(0 0 6px ${getBarColor(index, bars.length)})` : undefined,
                    }}
                  />
                );
              })}
            </svg>
          </div>
        );

      case "wave":
        return (
          <div className="absolute bottom-0 left-0 right-0 h-32 px-8 pb-4">
            <svg width="100%" height="100%" preserveAspectRatio="none">
              <defs>
                <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={colors[0]} />
                  <stop offset="50%" stopColor={colors[1]} />
                  <stop offset="100%" stopColor={colors[2]} />
                </linearGradient>
              </defs>
              <motion.path
                d={`M 0 100 ${bars.map((h, i) => `L ${(i / bars.length) * 100}% ${100 - h}`).join(' ')} L 100% 100 Z`}
                fill="url(#waveGradient)"
                fillOpacity="0.3"
                stroke="url(#waveGradient)"
                strokeWidth="2"
              />
            </svg>
          </div>
        );

      case "dots":
        return (
          <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-center gap-[6px] px-8 pb-4">
            {bars.map((height, index) => {
              const dotCount = Math.floor((height / 100) * 8) + 1;
              return (
                <div key={index} className="flex flex-col-reverse gap-1">
                  {Array.from({ length: dotCount }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: getBarColor(index, bars.length),
                        boxShadow: isPlaying
                          ? `0 0 6px ${getBarColor(index, bars.length)}`
                          : `0 0 3px ${getBarColor(index, bars.length)}`,
                      }}
                      animate={{ opacity: 0.7 + (i / dotCount) * 0.3 }}
                      transition={{ duration: 0.05 }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        );

      case "comic":
        // No bars for comic style - center has comic scroll
        return null;

      case "blocks":
      case "rounded":
      case "classic":
      default:
        return (
          <>
            {/* Spectrum bars at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-center gap-[3px] px-8 pb-4">
              {bars.map((height, index) => (
                <motion.div
                  key={index}
                  className={barStyle === "rounded" ? "w-2 rounded-t-full" : "w-2 rounded-t-sm"}
                  style={{
                    backgroundColor: getBarColor(index, bars.length),
                    boxShadow: isPlaying 
                      ? `0 0 10px ${getBarColor(index, bars.length)}, 0 -${height / 4}px 20px ${getBarColor(index, bars.length)}`
                      : `0 0 5px ${getBarColor(index, bars.length)}`,
                  }}
                  animate={{ 
                    height: height * 1.2,
                    opacity: 0.7 + (height / 100) * 0.3,
                  }}
                  transition={{ duration: 0.05 }}
                />
              ))}
            </div>

            {/* Mirrored bars at top */}
            {mirrorBars && (
              <div className="absolute top-0 left-0 right-0 h-20 flex items-start justify-center gap-[3px] px-8 pt-4 opacity-40">
                {bars.map((height, index) => (
                  <motion.div
                    key={index}
                    className={barStyle === "rounded" ? "w-2 rounded-b-full" : "w-2 rounded-b-sm"}
                    style={{
                      backgroundColor: getBarColor(index, bars.length),
                    }}
                    animate={{ height: height * 0.4 }}
                    transition={{ duration: 0.05 }}
                  />
                ))}
              </div>
            )}
          </>
        );
    }
  };

  // Comic scroll state - smooth beat reactive with interpolation
  const comicOffsetRef = useRef(0);
  const comicRotationRef = useRef(0);
  const targetSpeedRef = useRef(1);
  const currentSpeedRef = useRef(1);
  const [comicOffset, setComicOffset] = useState(0);
  const [comicRotation, setComicRotation] = useState(0);
  
  useEffect(() => {
    if (barStyle === "comic") {
      const interval = setInterval(() => {
        // Smoothly interpolate speed toward target for fluid motion
        targetSpeedRef.current = 1 + bassIntensity * 6;
        currentSpeedRef.current += (targetSpeedRef.current - currentSpeedRef.current) * 0.15;
        
        // Update offset with smooth speed
        comicOffsetRef.current = (comicOffsetRef.current + currentSpeedRef.current) % 2000;
        setComicOffset(comicOffsetRef.current);
        
        // Smooth rotation based on beat - gentle spin that accelerates with bass
        comicRotationRef.current = (comicRotationRef.current + 0.3 + bassIntensity * 1.5) % 360;
        setComicRotation(comicRotationRef.current);
      }, 16); // 60fps for smoother animation
      return () => clearInterval(interval);
    }
  }, [barStyle, bassIntensity]);

  const renderComicCenter = () => {
    if (barStyle !== "comic") return null;
    
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="relative"
          animate={{ scale: 1 + bassIntensity * 0.15 }}
          transition={{ duration: 0.05 }}
        >
          {/* Outer glow rings - pulse on bass */}
          {[0, 1, 2].map(ring => (
            <motion.div
              key={ring}
              className="absolute rounded-full border-2"
              style={{
                width: 200 + ring * 50 + bassIntensity * 20,
                height: 200 + ring * 50 + bassIntensity * 20,
                left: -(100 + ring * 25 + bassIntensity * 10),
                top: -(100 + ring * 25 + bassIntensity * 10),
                borderColor: colors[ring % colors.length],
                boxShadow: `0 0 ${20 + bassIntensity * 30}px ${colors[ring % colors.length]}`,
                opacity: 0.4 - ring * 0.1,
              }}
              animate={{ opacity: (0.4 - ring * 0.1) + bassIntensity * 0.4 }}
              transition={{ duration: 0.1 }}
            />
          ))}
          
          {/* Comic circle with scrolling content */}
          <div 
            className="w-48 h-48 rounded-full overflow-hidden relative"
            style={{
              border: `4px solid ${colors[0]}`,
              boxShadow: `0 0 ${30 + bassIntensity * 40}px ${colors[0]}, inset 0 0 20px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Custom image scrolling or default comic panels */}
            {comicCenterImage ? (
              <motion.div 
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${comicCenterImage})`,
                  backgroundSize: '150% 150%',
                  backgroundPosition: 'center',
                }}
                animate={{
                  rotate: comicRotation,
                  scale: 1 + bassIntensity * 0.1,
                }}
                transition={{ 
                  duration: 0.1,
                  ease: "linear"
                }}
              />
            ) : (
              <svg
              width="100%" 
              height="100%" 
              viewBox="0 0 200 200"
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              <defs>
                <clipPath id="circleClip">
                  <circle cx="100" cy="100" r="96" />
                </clipPath>
              </defs>
              <g clipPath="url(#circleClip)">
                {/* Scrolling comic panel background - 8 different styles */}
                {Array.from({ length: 30 }).map((_, i) => {
                  const y = ((i * 55 - comicOffset) % 1650) - 400;
                  const panelType = i % 8;
                  return (
                    <g key={i} transform={`translate(0, ${y})`}>
                      {/* Panel background */}
                      <rect 
                        x="5" 
                        y="5" 
                        width="190" 
                        height="45" 
                        fill={panelType === 5 ? "#FFE135" : panelType === 6 ? "#FF6B6B" : "#fff"}
                        stroke="#000"
                        strokeWidth="3"
                      />
                      
                      {/* Panel 0: Speed lines radiating */}
                      {panelType === 0 && (
                        <>
                          {Array.from({ length: 14 }).map((_, j) => (
                            <line 
                              key={j}
                              x1={10 + j * 13}
                              y1="8"
                              x2={100}
                              y2="28"
                              stroke="#000"
                              strokeWidth={1 + (j % 2)}
                            />
                          ))}
                        </>
                      )}
                      
                      {/* Panel 1: Burst/explosion pattern */}
                      {panelType === 1 && (
                        <>
                          {Array.from({ length: 12 }).map((_, j) => {
                            const angle = (j / 12) * Math.PI * 2;
                            return (
                              <line 
                                key={j}
                                x1={100}
                                y1="25"
                                x2={100 + Math.cos(angle) * 85}
                                y2={25 + Math.sin(angle) * 18}
                                stroke="#000"
                                strokeWidth={2 + (j % 2)}
                              />
                            );
                          })}
                        </>
                      )}
                      
                      {/* Panel 2: Halftone dots pattern */}
                      {panelType === 2 && (
                        <>
                          {Array.from({ length: 5 }).map((_, row) => (
                            Array.from({ length: 9 }).map((_, col) => (
                              <circle 
                                key={`${row}-${col}`}
                                cx={18 + col * 20}
                                cy={12 + row * 8}
                                r={1.5 + (row % 2) + ((col + row) % 2)}
                                fill="#000"
                              />
                            ))
                          ))}
                        </>
                      )}
                      
                      {/* Panel 3: Dramatic diagonal lines */}
                      {panelType === 3 && (
                        <>
                          {Array.from({ length: 12 }).map((_, j) => (
                            <line 
                              key={j}
                              x1={j * 18}
                              y1="6"
                              x2={j * 18 + 35}
                              y2="48"
                              stroke="#000"
                              strokeWidth={1 + (j % 3)}
                            />
                          ))}
                        </>
                      )}
                      
                      {/* Panel 4: Manga screentone pattern */}
                      {panelType === 4 && (
                        <>
                          {Array.from({ length: 8 }).map((_, row) => (
                            Array.from({ length: 20 }).map((_, col) => (
                              <line
                                key={`${row}-${col}`}
                                x1={10 + col * 9}
                                y1={8 + row * 5}
                                x2={14 + col * 9}
                                y2={8 + row * 5}
                                stroke="#000"
                                strokeWidth="1"
                              />
                            ))
                          ))}
                        </>
                      )}
                      
                      {/* Panel 5: Pop art style (yellow bg with dots) */}
                      {panelType === 5 && (
                        <>
                          {Array.from({ length: 4 }).map((_, row) => (
                            Array.from({ length: 7 }).map((_, col) => (
                              <circle 
                                key={`${row}-${col}`}
                                cx={22 + col * 25}
                                cy={12 + row * 10}
                                r={4}
                                fill="#FF1493"
                              />
                            ))
                          ))}
                        </>
                      )}
                      
                      {/* Panel 6: Superhero action (red bg with white burst) */}
                      {panelType === 6 && (
                        <>
                          {Array.from({ length: 16 }).map((_, j) => {
                            const angle = (j / 16) * Math.PI * 2;
                            const length = 60 + (j % 2) * 30;
                            return (
                              <line 
                                key={j}
                                x1={100}
                                y1="25"
                                x2={100 + Math.cos(angle) * length}
                                y2={25 + Math.sin(angle) * (length * 0.3)}
                                stroke="#fff"
                                strokeWidth={3}
                              />
                            );
                          })}
                        </>
                      )}
                      
                      {/* Panel 7: Cross-hatch pattern */}
                      {panelType === 7 && (
                        <>
                          {Array.from({ length: 10 }).map((_, j) => (
                            <g key={j}>
                              <line 
                                x1={j * 20}
                                y1="6"
                                x2={j * 20 + 30}
                                y2="48"
                                stroke="#000"
                                strokeWidth="1"
                              />
                              <line 
                                x1={j * 20 + 30}
                                y1="6"
                                x2={j * 20}
                                y2="48"
                                stroke="#000"
                                strokeWidth="1"
                              />
                            </g>
                          ))}
                        </>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video rounded-xl overflow-hidden bg-black"
      style={{
        boxShadow: isPlaying 
          ? `0 0 60px hsl(185 100% 50% / ${bassIntensity * 0.5}), 0 0 120px hsl(270 100% 65% / ${midIntensity * 0.3})`
          : "0 0 30px hsl(185 100% 50% / 0.2)",
      }}
    >
      {/* Custom background or animated gradient background */}
      {customBackground ? (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${customBackground})` }}
        />
      ) : (
        <motion.div 
          className="absolute inset-0"
          animate={{
            background: [
              `radial-gradient(ellipse at 30% 70%, hsl(270 100% 15% / ${0.3 + bassIntensity * 0.4}) 0%, transparent 50%), 
               radial-gradient(ellipse at 70% 30%, hsl(185 100% 15% / ${0.3 + midIntensity * 0.4}) 0%, transparent 50%),
               linear-gradient(180deg, hsl(0 0% 5%) 0%, hsl(270 50% 8%) 100%)`,
            ],
          }}
          transition={{ duration: 0.1 }}
        />
      )}

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(hsl(185 100% 50% / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(185 100% 50% / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Particles */}
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full blur-[1px]"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
          }}
        />
      ))}

      {/* Center circle visualization - show comic or regular */}
      {barStyle === "comic" ? (
        renderComicCenter()
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="relative"
            animate={{
              scale: 1 + bassIntensity * 0.15,
            }}
            transition={{ duration: 0.05 }}
          >
            {/* Outer glow rings */}
            {[0, 1, 2].map(ring => (
              <motion.div
                key={ring}
                className="absolute rounded-full border"
                style={{
                  width: 180 + ring * 40,
                  height: 180 + ring * 40,
                  left: -(90 + ring * 20),
                  top: -(90 + ring * 20),
                  borderColor: `hsl(185 100% 50% / ${0.3 - ring * 0.1})`,
                  boxShadow: `0 0 20px hsl(185 100% 50% / ${(0.2 - ring * 0.05) * (1 + bassIntensity)})`,
                }}
                animate={{
                  scale: 1 + (ring * 0.1 * bassIntensity),
                  opacity: 0.5 + bassIntensity * 0.5,
                }}
                transition={{ duration: 0.1 }}
              />
            ))}
            
            {/* Center album art placeholder */}
            <motion.div
              className="w-40 h-40 rounded-full flex items-center justify-center relative overflow-hidden"
              style={{
                background: `conic-gradient(from ${Date.now() / 50}deg, hsl(185 100% 50%), hsl(270 100% 65%), hsl(320 100% 60%), hsl(45 100% 60%), hsl(185 100% 50%))`,
                padding: 3,
              }}
              animate={{
                rotate: isPlaying ? 360 : 0,
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <div className="text-center">
                  <motion.div 
                    className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ♫
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* Spectrum bars at bottom - hide for comic style */}
      {barStyle !== "comic" && (
        <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-center gap-[3px] px-8 pb-4">
          {bars.map((height, index) => (
            <motion.div
              key={index}
              className="w-2 rounded-t-sm"
              style={{
                backgroundColor: getBarColor(index, bars.length),
                boxShadow: isPlaying 
                  ? `0 0 10px ${getBarColor(index, bars.length)}, 0 -${height / 4}px 20px ${getBarColor(index, bars.length)}`
                  : `0 0 5px ${getBarColor(index, bars.length)}`,
              }}
              animate={{ 
                height: height * 1.2,
                opacity: 0.7 + (height / 100) * 0.3,
              }}
              transition={{ duration: 0.05 }}
            />
          ))}
        </div>
      )}

      {/* Mirrored bars at top - hide for comic style */}
      {barStyle !== "comic" && (
        <div className="absolute top-0 left-0 right-0 h-20 flex items-start justify-center gap-[3px] px-8 pt-4 opacity-40">
          {bars.map((height, index) => (
            <motion.div
              key={index}
              className="w-2 rounded-b-sm"
              style={{
                backgroundColor: getBarColor(index, bars.length),
              }}
              animate={{ height: height * 0.4 }}
              transition={{ duration: 0.05 }}
            />
          ))}
        </div>
      )}

      {/* Title overlay */}
      {(!titleOverlay || titleOverlay.visible !== false) && (
        <div 
          className="absolute left-0 right-0 px-4"
          style={{
            top: titleOverlay?.position === 'top' ? '10%' : titleOverlay?.position === 'center' ? '45%' : undefined,
            bottom: titleOverlay?.position === 'bottom' || !titleOverlay?.position ? '20%' : undefined,
            textAlign: titleOverlay?.alignment || 'center',
          }}
        >
          <motion.h3 
            className="font-bold tracking-wider"
            style={{
              fontFamily: titleOverlay?.font ? `${titleOverlay.font}, sans-serif` : 'Orbitron, sans-serif',
              fontSize: titleOverlay?.fontSize ? `${titleOverlay.fontSize * 0.4}px` : '1.25rem',
              color: titleOverlay?.color || "white",
              textShadow: `0 0 ${titleOverlay?.shadowBlur || 20}px ${titleOverlay?.shadowColor || 'hsl(185 100% 50%)'}`,
            }}
            animate={{
              textShadow: isPlaying 
                ? [
                    `0 0 ${titleOverlay?.shadowBlur || 20}px ${titleOverlay?.shadowColor || 'hsl(185 100% 50%)'}`,
                    `0 0 ${(titleOverlay?.shadowBlur || 20) * 1.5}px ${titleOverlay?.shadowColor || 'hsl(185 100% 50%)'}`,
                    `0 0 ${titleOverlay?.shadowBlur || 20}px ${titleOverlay?.shadowColor || 'hsl(185 100% 50%)'}`,
                  ]
                : `0 0 ${(titleOverlay?.shadowBlur || 20) * 0.5}px ${titleOverlay?.shadowColor || 'hsl(185 100% 50% / 0.5)'}`,
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            {title}
          </motion.h3>
          {(!artistOverlay || artistOverlay.visible !== false) && (
            <p 
              className="mt-1 tracking-widest"
              style={{
                fontFamily: artistOverlay?.font ? `${artistOverlay.font}, sans-serif` : 'Inter, sans-serif',
                fontSize: artistOverlay?.fontSize ? `${artistOverlay.fontSize * 0.4}px` : '0.875rem',
                color: artistOverlay?.color || 'rgb(156 163 175)',
              }}
            >
              {artist}
            </p>
          )}
        </div>
      )}

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-cyan-500/50" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-purple-500/50" />
      <div className="absolute bottom-36 left-4 w-8 h-8 border-l-2 border-b-2 border-pink-500/50" />
      <div className="absolute bottom-36 right-4 w-8 h-8 border-r-2 border-b-2 border-yellow-500/50" />

      {/* Playing indicator */}
      {isPlaying && (
        <motion.div 
          className="absolute top-4 right-16 flex items-center gap-2"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs text-red-400 font-mono">LIVE</span>
        </motion.div>
      )}
    </div>
  );
};

export default AudioVisualizer;
