export function calculateCrashMultiplier(time: number): number {
  return Math.pow(2, time * 0.09);
}
