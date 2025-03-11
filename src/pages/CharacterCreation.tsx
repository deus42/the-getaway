import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Faction = "resistance" | "nomad" | "corporate";
type Background = "soldier" | "hacker" | "medic" | "engineer";

interface CharacterStats {
  strength: number;
  dexterity: number;
  intelligence: number;
  perception: number;
  charisma: number;
}

const CharacterCreation: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [faction, setFaction] = useState<Faction>("resistance");
  const [background, setBackground] = useState<Background>("soldier");
  const [stats, setStats] = useState<CharacterStats>({
    strength: 5,
    dexterity: 5,
    intelligence: 5,
    perception: 5,
    charisma: 5,
  });
  const [availablePoints, setAvailablePoints] = useState(5);

  const handleStatChange = (stat: keyof CharacterStats, value: number) => {
    const currentValue = stats[stat];
    const diff = value - currentValue;

    if (availablePoints - diff < 0 || value < 3 || value > 10) {
      return;
    }

    setStats({ ...stats, [stat]: value });
    setAvailablePoints(availablePoints - diff);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      // Show error
      return;
    }

    // Create character and save to state/context
    const character = { name, faction, background, stats };
    console.log("Character created:", character);

    // Navigate to game
    navigate("/game");
  };

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen w-full bg-background p-6 scanlines">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-primary text-center mb-6">Character Creation</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column - Basic info */}
          <div className="card">
            <h2 className="mb-4">Identity</h2>

            <div className="mb-4">
              <label className="block text-sm mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input w-full"
                placeholder="Enter your alias"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-2">Faction</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setFaction("resistance")}
                  className={`btn ${
                    faction === "resistance" ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  Resistance
                </button>
                <button
                  onClick={() => setFaction("nomad")}
                  className={`btn ${
                    faction === "nomad" ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  Nomad
                </button>
                <button
                  onClick={() => setFaction("corporate")}
                  className={`btn ${
                    faction === "corporate" ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  Corporate
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-2">Background</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBackground("soldier")}
                  className={`btn ${
                    background === "soldier" ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  Soldier
                </button>
                <button
                  onClick={() => setBackground("hacker")}
                  className={`btn ${
                    background === "hacker" ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  Hacker
                </button>
                <button
                  onClick={() => setBackground("medic")}
                  className={`btn ${
                    background === "medic" ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  Medic
                </button>
                <button
                  onClick={() => setBackground("engineer")}
                  className={`btn ${
                    background === "engineer" ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  Engineer
                </button>
              </div>
            </div>
          </div>

          {/* Right column - Stats */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2>Attributes</h2>
              <div className="text-sm">
                <span className="text-accent">{availablePoints}</span> points
                remaining
              </div>
            </div>

            {Object.entries(stats).map(([statName, value]) => (
              <div key={statName} className="mb-4">
                <div className="flex justify-between mb-1">
                  <label className="text-sm capitalize">{statName}</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleStatChange(
                          statName as keyof CharacterStats,
                          value - 1
                        )
                      }
                      className="w-6 h-6 flex items-center justify-center rounded bg-surface hover:bg-surface-hover"
                      disabled={value <= 3}
                    >
                      -
                    </button>
                    <span className="w-6 text-center">{value}</span>
                    <button
                      onClick={() =>
                        handleStatChange(
                          statName as keyof CharacterStats,
                          value + 1
                        )
                      }
                      className="w-6 h-6 flex items-center justify-center rounded bg-surface hover:bg-surface-hover"
                      disabled={availablePoints <= 0 || value >= 10}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="stat-bar">
                  <div
                    className="stat-bar-fill"
                    style={{ width: `${value * 10}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-8">
          <button onClick={handleCancel} className="btn-secondary px-8">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary px-8"
            disabled={!name.trim()}
          >
            Create Character
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterCreation;
