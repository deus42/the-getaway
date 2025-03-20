import { useNavigate } from "react-router-dom";

const MainMenu: React.FC = () => {
  const navigate = useNavigate();

  const handleOpenGame = () => {
    navigate("/game");
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center relative overflow-hidden scanlines">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0">
        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-black/70"></div>

        {/* Animated background elements */}
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="absolute bg-primary/10 rounded-lg blur-sm"
            style={{
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 30 + 20}s`,
              animationDelay: `${Math.random() * 5}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
              opacity: Math.random() * 0.2 + 0.1,
            }}
          />
        ))}

        {/* Grid overlay for cyberpunk/dystopian feel */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(0deg, transparent 24%, rgba(255, 59, 59, 0.3) 25%, rgba(255, 59, 59, 0.3) 26%, transparent 27%, transparent 74%, rgba(255, 59, 59, 0.3) 75%, rgba(255, 59, 59, 0.3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 59, 59, 0.3) 25%, rgba(255, 59, 59, 0.3) 26%, transparent 27%, transparent 74%, rgba(255, 59, 59, 0.3) 75%, rgba(255, 59, 59, 0.3) 76%, transparent 77%, transparent)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* Main content container to center everything */}
      <div className="z-10 flex flex-col items-center justify-center w-full max-w-3xl p-8">
        {/* Game logo/title */}
        <div className="text-center mb-16">
          <h1 className="text-7xl md:text-8xl font-black text-primary pulse-effect mb-3 tracking-wider border-2 border-primary p-4">
            THE GETAWAY
          </h1>
          <p className="text-2xl text-textcolor/80 italic mb-2">
            Escape from Tyranny
          </p>
          <p className="text-lg mt-2 text-textcolor/60">2036</p>
        </div>

        {/* Single prominent Open Game button */}
        <div className="flex flex-col items-center mb-12">
          <button
            onClick={handleOpenGame}
            className="btn-primary py-5 px-12 text-2xl relative hover:translate-y-[-3px] transition-all duration-300 bg-primary text-black font-bold shadow-[0_0_20px_rgba(255,59,59,0.5)] hover:shadow-[0_0_30px_rgba(255,59,59,0.8)] border-2 border-primary w-64"
          >
            <span className="relative z-10 glitch-text tracking-wider">
              OPEN GAME
            </span>
            <div className="absolute inset-0 bg-primary/20 scanlines"></div>
          </button>

          <div className="text-textcolor/40 mt-4 font-mono text-sm">
            <span className="text-primary/60">[ SYSTEM STATUS: </span>READY
            <span className="text-primary/60"> ]</span>
          </div>
        </div>

        {/* Game description */}
        <div className="mt-4 max-w-md text-center">
          <div className="card bg-surface/30 backdrop-blur-sm border border-primary/20 p-6 shadow-[0_0_15px_rgba(255,59,59,0.1)]">
            <div className="text-xs text-primary/60 font-mono mb-2 tracking-wider">
              TRANSMISSION INCOMING
            </div>
            <p className="mb-3 text-textcolor/70 font-mono">
              <span className="text-primary/90 font-bold">[CLASSIFIED]</span> A
              dystopian tactical RPG set in 2036 under authoritarian rule.
            </p>
            <p className="text-textcolor/70 font-mono mb-4">
              Fight for freedom, navigate through{" "}
              <span className="text-primary">danger</span>, and escape tyranny.
            </p>
            <div className="text-xs text-primary/60 font-mono pt-2 border-t border-primary/20">
              Created in 2036 by the Resistance
            </div>
          </div>
        </div>
      </div>

      {/* Version info */}
      <div className="absolute bottom-4 right-4 text-textcolor/30 text-xs z-10 font-mono">
        v0.1.0-alpha | <span className="text-primary/30">SYSTEM READY</span>
      </div>
    </div>
  );
};

export default MainMenu;
