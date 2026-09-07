export function getSlotTimeState({ dayPosition, now, start, end }) {
  const currentHour = now.getHours() + now.getMinutes() / 60;
  return {
    isPastHour:
      dayPosition === "past" ||
      (dayPosition === "today" && currentHour >= end),
    isCurrentHour:
      dayPosition === "today" && currentHour >= start && currentHour < end,
  };
}
