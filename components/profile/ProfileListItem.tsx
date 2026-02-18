"use client";

interface ProfileListItemProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  right?: React.ReactNode;
  onClick?: () => void;
  isLast?: boolean;
  danger?: boolean;
}

export function ProfileListItem({
  icon,
  iconBg,
  iconColor,
  label,
  right,
  onClick,
  isLast = false,
  danger = false,
}: ProfileListItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
        !isLast ? "border-b border-gray-100" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}
        >
          <span
            className={`material-symbols-outlined text-[16px] ${iconColor}`}
          >
            {icon}
          </span>
        </div>
        <span
          className={`text-sm font-medium ${
            danger ? "text-red-500" : "text-gray-800"
          }`}
        >
          {label}
        </span>
      </div>
      {right ?? (
        <span className="material-symbols-outlined text-[18px] text-gray-400">
          chevron_right
        </span>
      )}
    </button>
  );
}
