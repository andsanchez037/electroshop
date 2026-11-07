import { describe, expect, it } from 'vitest';
import { completeSummary, completeTap, isLocalDocker } from '../../scripts/db-test-results.mjs';
const tap = ['1..53', ...Array.from({ length: 53 }, (_, i) => `ok ${i + 1} - assertion`)].join('\n');
describe('Evidencia completa de pgTAP local', () => {
  it('solo admite endpoints Docker locales', () => {
    for (const endpoint of ['npipe:////./pipe/dockerDesktopLinuxEngine', 'unix:///var/run/docker.sock', 'tcp://127.0.0.1:2375']) expect(isLocalDocker(endpoint)).toBe(true);
    for (const endpoint of ['ssh://host', 'tcp://example.com:2375', 'tcp://localhost.evil:2375', 'npipe:////server/pipe/docker', '']) expect(isLocalDocker(endpoint)).toBe(false);
  });
  it('acepta exactamente 53 aserciones numeradas y resumen de un archivo', () => {
    expect(completeTap(tap.replaceAll('\n', '\r\n'))).toBe(true);
    expect(completeSummary('Files=1, Tests=53, 1 wallclock secs\nResult: PASS')).toBe(true);
  });
  it('rechaza cero tests, suite parcial, extra, falta de plan y números duplicados', () => {
    for (const value of ['', tap.replace('ok 53 - assertion', ''), `${tap}\nok 54 - extra`, tap.replace('1..53\n', ''), tap.replace('ok 52 ', 'ok 51 ')]) expect(completeTap(value)).toBe(false);
    for (const count of [0, 1, 52, 54, 530]) expect(completeSummary(`Files=1, Tests=${count}\nResult: PASS`)).toBe(false);
  });
  it('rechaza fallo, bailout, SKIP y TODO aunque exista resumen PASS', () => {
    for (const directive of ['# SKIP unavailable', '# TODO pending', '\nBail out! failed']) {
      expect(completeTap(tap + directive)).toBe(false);
      expect(completeSummary(`Files=1, Tests=53\nResult: PASS\n${directive}`)).toBe(false);
    }
    expect(completeTap(tap.replace('ok 20 ', 'not ok 20 '))).toBe(false);
  });
});
