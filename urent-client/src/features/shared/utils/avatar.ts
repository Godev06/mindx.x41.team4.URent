/**
 * Generate initials from a name
 * Example: "Sarah Miller" -> "SM"
 */
export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
};

/**
 * Generate a consistent color based on name (hash-based)
 */
const colors = [
  "bg-blue-500",
  "bg-red-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-orange-500",
];

export const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Get both initials and color for an avatar
 */
export const getAvatarStyle = (name: string) => {
  return {
    initials: getInitials(name),
    colorClass: getAvatarColor(name),
  };
};
