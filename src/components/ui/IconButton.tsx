import React from "react";

interface IconButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  onClick,
  children,
  className = "",
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-4 rounded-full bg-white shadow-lg active:scale-95
        transition-all duration-150 hover:shadow-xl
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center min-w-[56px] min-h-[56px]
        ${className}
      `}
    >
      {children}
    </button>
  );
};
