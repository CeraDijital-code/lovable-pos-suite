import { useMemo } from "react";

const SnowEffect = () => {
  const snowflakes = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 6 + 2,
      delay: Math.random() * 10,
      duration: Math.random() * 8 + 6,
      opacity: Math.random() * 0.6 + 0.2,
      drift: Math.random() * 40 - 20,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Cold fog overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.03] via-transparent to-cyan-500/[0.05]" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-blue-200/[0.06] to-transparent blur-2xl" />

      {/* Snowflakes */}
      {snowflakes.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white/80"
          style={{
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            top: -10,
            filter: s.size > 5 ? "blur(1px)" : "none",
            animation: `snowfall ${s.duration}s linear ${s.delay}s infinite`,
            ["--drift" as string]: `${s.drift}px`,
          }}
        />
      ))}

      <style>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-10px) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: var(--snow-opacity, 0.8);
          }
          90% {
            opacity: var(--snow-opacity, 0.8);
          }
          100% {
            transform: translateY(100vh) translateX(var(--drift, 0px)) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SnowEffect;
