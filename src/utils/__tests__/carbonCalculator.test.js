import { describe, it, expect } from 'vitest';
import { calculateFootprint } from '../carbonCalculator';

describe('calculateFootprint', () => {
  it('returns zero totals for empty inputs', () => {
    const result = calculateFootprint({ diet: 'average' });
    expect(result.breakdown.transport).toBe(0);
    expect(result.breakdown.energy).toBe(0);
    expect(result.breakdown.shopping).toBe(0);
    expect(result.breakdown.food).toBe(200); // average diet baseline
    expect(result.total).toBe(200);
  });

  it('calculates transport correctly for car km', () => {
    // 1000 km × 0.15 kg/km = 150 kg
    const result = calculateFootprint({ carKm: '1000', diet: 'vegan' });
    expect(result.breakdown.transport).toBe(150);
  });

  it('calculates transport correctly for flights', () => {
    // 2 flights × 250 kg/flight = 500 kg
    const result = calculateFootprint({ flights: '2', diet: 'vegan' });
    expect(result.breakdown.transport).toBe(500);
  });

  it('calculates combined transport', () => {
    // 500 km × 0.15 = 75, plus 1 flight × 250 = 250 → 325
    const result = calculateFootprint({ carKm: '500', flights: '1', diet: 'vegan' });
    expect(result.breakdown.transport).toBe(325);
  });

  it('applies correct food baseline for each diet type', () => {
    expect(calculateFootprint({ diet: 'meat_heavy' }).breakdown.food).toBe(250);
    expect(calculateFootprint({ diet: 'average' }).breakdown.food).toBe(200);
    expect(calculateFootprint({ diet: 'vegetarian' }).breakdown.food).toBe(150);
    expect(calculateFootprint({ diet: 'vegan' }).breakdown.food).toBe(100);
  });

  it('defaults to average diet when diet is unknown or missing', () => {
    expect(calculateFootprint({}).breakdown.food).toBe(200);
    expect(calculateFootprint({ diet: 'unknown_value' }).breakdown.food).toBe(200); // falls back to average
  });

  it('calculates electricity energy correctly', () => {
    // 300 kWh × 0.82 = 246 kg
    const result = calculateFootprint({ electricityKwh: '300', diet: 'vegan' });
    expect(result.breakdown.energy).toBe(246);
  });

  it('calculates gas bill energy correctly', () => {
    // 1000 ₹ × 0.015 = 15 kg
    const result = calculateFootprint({ gasBillInr: '1000', diet: 'vegan' });
    expect(result.breakdown.energy).toBe(15);
  });

  it('calculates combined energy', () => {
    // 300 kWh × 0.82 + 1000 ₹ × 0.015 = 246 + 15 = 261
    const result = calculateFootprint({ electricityKwh: '300', gasBillInr: '1000', diet: 'vegan' });
    expect(result.breakdown.energy).toBe(261);
  });

  it('calculates shopping emissions correctly', () => {
    // 2000 ₹ × 0.01 = 20 kg
    const result = calculateFootprint({ shoppingSpendInr: '2000', diet: 'vegan' });
    expect(result.breakdown.shopping).toBe(20);
  });

  it('calculates a full realistic footprint correctly', () => {
    const input = {
      carKm: '1000',
      flights: '2',
      diet: 'average',
      electricityKwh: '300',
      gasBillInr: '1000',
      shoppingSpendInr: '2000',
    };
    // transport: 1000×0.15 + 2×250 = 150 + 500 = 650
    // food: 200
    // energy: 300×0.82 + 1000×0.015 = 246 + 15 = 261
    // shopping: 2000×0.01 = 20
    // total: 650 + 200 + 261 + 20 = 1131
    const result = calculateFootprint(input);
    expect(result.breakdown.transport).toBe(650);
    expect(result.breakdown.food).toBe(200);
    expect(result.breakdown.energy).toBe(261);
    expect(result.breakdown.shopping).toBe(20);
    expect(result.total).toBe(1131);
  });

  it('handles string inputs that are numeric (coercion)', () => {
    const result = calculateFootprint({ carKm: '500', diet: 'vegan' });
    expect(result.breakdown.transport).toBe(75);
  });

  it('handles zero values without erroring', () => {
    const result = calculateFootprint({ carKm: '0', flights: '0', diet: 'vegan', electricityKwh: '0' });
    expect(result.total).toBe(100); // vegan food only
  });
});
