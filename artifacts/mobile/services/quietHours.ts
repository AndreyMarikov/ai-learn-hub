interface QuietRange {
  start: number;
  end: number;
}

function getQuietRange(quietHours: string): QuietRange | null {
  switch (quietHours) {
    case "evenings":
      return { start: 21, end: 8 };
    case "mornings":
      return { start: 6, end: 9 };
    default:
      return null;
  }
}

function hourInRange(range: QuietRange, hour: number): boolean {
  if (range.start > range.end) {
    return hour >= range.start || hour < range.end;
  }
  return hour >= range.start && hour < range.end;
}

export function isInQuietHours(quietHours: string, date = new Date()): boolean {
  const range = getQuietRange(quietHours);
  if (!range) return false;
  return hourInRange(range, date.getHours());
}

export function adjustSecondsForQuietHours(
  quietHours: string,
  seconds: number,
): number {
  const range = getQuietRange(quietHours);
  if (!range) return seconds;

  const fireTime = new Date(Date.now() + seconds * 1000);
  if (!hourInRange(range, fireTime.getHours())) return seconds;

  const adjusted = new Date(fireTime);
  adjusted.setHours(range.end, 0, 0, 0);
  if (adjusted <= fireTime) {
    adjusted.setDate(adjusted.getDate() + 1);
  }
  return Math.ceil((adjusted.getTime() - Date.now()) / 1000);
}
