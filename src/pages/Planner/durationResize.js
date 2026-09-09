export function createDurationResize(block, list) {
  const normalizedTitle = block.task.title.trim().toLowerCase();
  const affectedTasks = list.filter(
    (task) =>
      task.title.trim().toLowerCase() === normalizedTitle &&
      task.tag === block.task.tag &&
      task.hour >= block.start &&
      task.hour < block.end,
  );
  const anchor =
    affectedTasks.find((task) => task.hour === block.start) ?? block.task;
  const originalDuration = Math.max(1, block.end - block.start);

  return {
    day: block.task.day,
    start: block.start,
    anchorId: anchor.id,
    affectedIds: affectedTasks.map((task) => task.id),
    originalDuration,
    duration: originalDuration,
    valid: true,
    conflictHour: null,
  };
}

export function planDurationResize(resize, targetHour, list) {
  const duration = Math.max(
    1,
    Math.min(24 - resize.start, targetHour - resize.start + 1),
  );
  const candidateEnd = resize.start + duration;
  const affectedIds = new Set(resize.affectedIds);
  const isExpanding = duration > resize.originalDuration;
  const conflict = isExpanding
    ? list.find((task) => {
        if (affectedIds.has(task.id)) return false;
        const taskStart = task.hour;
        const taskDuration = Math.max(1, Number(task.duration) || 1);
        const taskEnd = Math.min(24, taskStart + taskDuration);
        return resize.start < taskEnd && candidateEnd > taskStart;
      })
    : null;

  return {
    ...resize,
    duration,
    valid: !conflict,
    conflictHour: conflict?.hour ?? null,
  };
}

export function getPlannerBlockSegment({
  hour,
  blockStart,
  covered,
  hourTasks,
  columnCount = 4,
}) {
  const isWrappedContinuation = Boolean(
    !blockStart && covered && hour % columnCount === 0,
  );
  const coveredBySameBlock = Boolean(
    covered &&
      hourTasks.every(
        (task) =>
          task.title.trim().toLowerCase() ===
            covered.task.title.trim().toLowerCase() &&
          task.tag === covered.task.tag,
      ),
  );
  const hidden = coveredBySameBlock && !isWrappedContinuation;
  const displayBlock = blockStart ??
    (isWrappedContinuation ? covered : null);
  const remainingColumns = columnCount - (hour % columnCount);
  const duration = displayBlock
    ? Math.max(1, Math.min(displayBlock.end - hour, remainingColumns))
    : 1;

  return {
    hidden,
    displayBlock,
    duration,
    isWrappedContinuation,
    isMultiHourBlock: Boolean(
      displayBlock && displayBlock.end - displayBlock.start > 1,
    ),
  };
}
