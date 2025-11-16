import React from "react";

type TacticalPanelVariant = "default" | "frameless";

interface TacticalPanelProps {
  children?: React.ReactNode;
  className?: string;
  variant?: TacticalPanelVariant;
}

const TacticalPanel: React.FC<TacticalPanelProps> = ({
  children,
  className,
  variant = "default",
}) => {
  const baseClasses =
    variant === "frameless"
      ? "flex h-full min-h-0 flex-1 flex-col gap-[0.5rem] px-0 py-0 text-[#f8fafc] font-body"
      : "flex h-full min-h-0 flex-1 flex-col gap-[0.5rem] rounded-[18px] border border-[rgba(59,130,246,0.22)] bg-[linear-gradient(145deg,rgba(8,15,30,0.92),rgba(12,22,42,0.82),rgba(6,12,28,0.92))] px-[0.9rem] py-[0.9rem] text-[#f8fafc] shadow-[0_20px_30px_-20px_rgba(8,12,24,0.5)] backdrop-blur-[14px] font-body";
  const mergedClasses = className ? `${baseClasses} ${className}` : baseClasses;
  return (
    <div className={mergedClasses} data-testid="tactical-panel">
      {children}
    </div>
  );
};

export default React.memo(TacticalPanel);
