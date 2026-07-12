export interface Badge {
  key: string;
  label: string;
  achieved: boolean;
}

const STREAK_MILESTONES = [7, 30, 100];
const INPUT_HOUR_MILESTONES = [10, 50, 100, 300];

export function computeBadges(longestStreakDays: number, totalInputHours: number): Badge[] {
  const streakBadges = STREAK_MILESTONES.map((days) => ({
    key: `streak-${days}`,
    label: `${days}-day streak`,
    achieved: longestStreakDays >= days,
  }));

  const inputBadges = INPUT_HOUR_MILESTONES.map((hours) => ({
    key: `input-${hours}`,
    label: `${hours}h input`,
    achieved: totalInputHours >= hours,
  }));

  return [...streakBadges, ...inputBadges];
}
