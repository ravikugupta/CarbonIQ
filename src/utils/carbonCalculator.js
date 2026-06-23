// carbonCalculator.js

// Constants for emission factors
const EMISSION_FACTORS = {
  transport: {
    carKm: 0.15, // kg CO2 per km
    flights: 250, // kg CO2 per short/medium flight
  },
  food: {
    meat_heavy: 250, // kg CO2 per month
    average: 200,
    vegetarian: 150,
    vegan: 100,
  },
  energy: {
    electricity_kwh: 0.82, // kg CO2 per kWh (India avg is higher, ~0.82)
    gas_bill_inr: 0.015, // kg CO2 per ₹ spent on LPG/PNG
  },
  shopping: {
    spending_inr: 0.01, // kg CO2 per ₹ spent on new clothes/electronics
  }
};

export const calculateFootprint = (data) => {
  let transport = 0;
  if (data.carKm) transport += Number(data.carKm) * EMISSION_FACTORS.transport.carKm;
  if (data.flights) transport += Number(data.flights) * EMISSION_FACTORS.transport.flights;

  let food = EMISSION_FACTORS.food[data.diet] ?? EMISSION_FACTORS.food['average'];

  let energy = 0;
  if (data.electricityKwh) energy += Number(data.electricityKwh) * EMISSION_FACTORS.energy.electricity_kwh;
  if (data.gasBillInr) energy += Number(data.gasBillInr) * EMISSION_FACTORS.energy.gas_bill_inr;

  let shopping = 0;
  if (data.shoppingSpendInr) shopping += Number(data.shoppingSpendInr) * EMISSION_FACTORS.shopping.spending_inr;

  const total = transport + food + energy + shopping;

  return {
    breakdown: {
      transport: Math.round(transport),
      food: Math.round(food),
      energy: Math.round(energy),
      shopping: Math.round(shopping)
    },
    total: Math.round(total)
  };
};
