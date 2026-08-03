import { useSelector } from "react-redux";
import { RootState } from "../../store";
import EnhancedButton from "./EnhancedButton";

interface Level0RecoveryBoundaryProps {
  onReturnToMenu: () => void;
}

const COPY = {
  en: {
    eyebrow: "Level 0 foundation",
    title: "Tokyo escape is being rebuilt",
    body:
      "The previous prototype mixed retired character packages, automatic routing, and tactical combat into the opening. That run has been archived and will not be loaded as the game.",
    preserved: "Preserved for reimplementation",
    systems:
      "Character creation, the Character screen, George, Paranoia, progression, and the four-lane HUD remain recoverable foundations.",
    next: "Next playable gate",
    nextDetail:
      "A direct-movement outdoor Tokyo runtime replaces this boundary in the next implementation ticket.",
    returnLabel: "Return to menu",
  },
  uk: {
    eyebrow: "Основа Рівня 0",
    title: "Втечу з Токіо перебудовують",
    body:
      "Попередній прототип змішував вилучені набори персонажа, автоматичну маршрутизацію й тактичний бій зі вступом. Цей забіг заархівовано й більше не завантажується як гра.",
    preserved: "Збережено для повторної реалізації",
    systems:
      "Створення персонажа, екран персонажа, George, Paranoia, прогресія та чотирисмуговий HUD залишаються відновлюваною основою.",
    next: "Наступний ігровий етап",
    nextDetail:
      "У наступному квитку цю межу замінить відкритий токійський рівень із прямим керуванням.",
    returnLabel: "Повернутися до меню",
  },
} as const;

const Level0RecoveryBoundary: React.FC<Level0RecoveryBoundaryProps> = ({
  onReturnToMenu,
}) => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const copy = COPY[locale];

  return (
    <main
      data-testid="level0-recovery-boundary"
      data-controller-focus-ignore="true"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0d1014] px-6 py-8 font-body text-[#e8e0cf]"
      style={{
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        padding: "2rem 1.5rem",
        boxSizing: "border-box",
      }}
    >
      <section className="w-full max-w-[760px] border border-[#7b6848] bg-[#151719] p-[clamp(1.5rem,4vw,3rem)] shadow-[0_26px_80px_rgba(0,0,0,0.55)]">
        <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#c99a4a]">
          {copy.eyebrow}
        </p>
        <h1 className="m-0 max-w-[18ch] font-display text-[clamp(2rem,5vw,3.8rem)] font-semibold leading-[0.98] text-[#f3ecdf]">
          {copy.title}
        </h1>
        <p className="mt-7 max-w-[65ch] text-[clamp(0.95rem,1.6vw,1.08rem)] leading-7 text-[#b9b0a1]">
          {copy.body}
        </p>

        <div className="mt-8 grid gap-px border border-[#34302a] bg-[#34302a] md:grid-cols-2">
          <article className="bg-[#111315] p-5" style={{ padding: "1.25rem" }}>
            <h2 className="m-0 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#7fa6a0]">
              {copy.preserved}
            </h2>
            <p className="mb-0 mt-3 text-sm leading-6 text-[#c9c0b1]">{copy.systems}</p>
          </article>
          <article className="bg-[#111315] p-5" style={{ padding: "1.25rem" }}>
            <h2 className="m-0 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#c99a4a]">
              {copy.next}
            </h2>
            <p className="mb-0 mt-3 text-sm leading-6 text-[#c9c0b1]">{copy.nextDetail}</p>
          </article>
        </div>

        <div className="mt-8 max-w-[260px]">
          <EnhancedButton
            data-testid="recovery-return-to-menu"
            onClick={onReturnToMenu}
            variant="secondary"
            size="large"
            fullWidth
          >
            {copy.returnLabel}
          </EnhancedButton>
        </div>
      </section>
    </main>
  );
};

export default Level0RecoveryBoundary;
