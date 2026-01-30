type TimeRange = {
  start: string;
  end: string;
};

const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const toTimeString = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
};

export const splitBySlots = (
  startTime: string,
  endTime: string,
  slotCount: number
): TimeRange[] => {
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);

  const totalMinutes = endMinutes - startMinutes;
  if (totalMinutes <= 0) {
    throw new Error("終了時刻は開始時刻より後である必要があります");
  }
  if (slotCount <= 0) {
    throw new Error("枠数は1以上である必要があります");
  }

  const slotMinutes = totalMinutes / slotCount;

  const result: TimeRange[] = [];

  for (let i = 0; i < slotCount; i++) {
    const start = startMinutes + slotMinutes * i;
    const end = startMinutes + slotMinutes * (i + 1);

    result.push({
      start: toTimeString(Math.round(start)),
      end: toTimeString(Math.round(end)),
    });
  }

  return result;
};
