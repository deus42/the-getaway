import { useState } from "react";
import { useNavigate } from "react-router-dom";

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const [showCredits, setShowCredits] = useState(false);

  const handleNewGame = () => {
    navigate("/game");
  };

  const handleOptions = () => {
    // TODO: Show options modal
    console.log("Options clicked");
  };

  const toggleCredits = () => {
    setShowCredits(!showCredits);
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

        {/* Menu buttons */}
        <div className="flex flex-col gap-5 w-72">
          <button
            onClick={handleNewGame}
            className="btn-primary py-4 text-xl relative hover:translate-y-[-2px] transition-all duration-300 scanlines"
          >
            New Game
          </button>

          <button
            onClick={handleOptions}
            className="btn-secondary py-3 text-lg relative hover:translate-y-[-2px] transition-all duration-300"
          >
            Options
          </button>

          <button
            onClick={toggleCredits}
            className="btn-secondary py-3 text-lg relative hover:translate-y-[-2px] transition-all duration-300"
          >
            {showCredits ? "Hide Credits" : "Credits"}
          </button>
        </div>

        {/* Credits panel */}
        {showCredits && (
          <div className="card mt-10 max-w-md z-10 bg-surface/90 backdrop-blur-sm border border-primary/30">
            <h3 className="text-center mb-4 text-primary">Credits</h3>
            <p className="text-sm mb-3">
              A dystopian tactical RPG set in a world under authoritarian rule.
              Fight for freedom in a battle against tyranny.
            </p>
            <p className="text-sm mt-2">Created in 2024 by the Resistance.</p>
          </div>
        )}
      </div>

      {/* Version info */}
      <div className="absolute bottom-4 right-4 text-textcolor/30 text-xs z-10">
        v0.1.0-alpha
      </div>
    </div>
  );
};

export default MainMenu;
