// Exigir resumen y TAP completos: un PASS parcial no es suficiente.
export const EXPECTED_ASSERTIONS = 53;
export const isLocalDocker = endpoint => /^(?:npipe:\/{4}\.\/pipe\/[^\s]+|unix:\/\/\/[^\s]+|tcp:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?)$/.test(endpoint);
export function completeSummary(output) {
  const summaries = [...output.matchAll(/Files=(\d+),\s*Tests=(\d+)/g)];
  return summaries.length === 1 && summaries[0][1] === '1'
    && Number(summaries[0][2]) === EXPECTED_ASSERTIONS
    && /Result:\s*PASS\b/.test(output) && !/not ok|Bail out!|\bskip\b|\bTODO\b/i.test(output);
}
export function completeTap(output) {
  const lines = output.split(/\r?\n/).map(line => line.trim());
  const plans = lines.filter(line => /^\d+\.\.\d+/.test(line));
  const assertions = lines.filter(line => /^(?:not )?ok\b/.test(line));
  return plans.length === 1 && plans[0] === `1..${EXPECTED_ASSERTIONS}`
    && assertions.length === EXPECTED_ASSERTIONS
    && assertions.every((line, index) => new RegExp(`^ok ${index + 1}(?:\\s|$)`).test(line))
    && !/not ok|Bail out!|#\s*(?:skip|todo)\b/i.test(output);
}
