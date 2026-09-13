// Shared preset catalog for customer appliance picker.
// Names intentionally use letters, numbers, spaces and basic punctuation
// to stay compatible with form validation.
export const CUSTOM_APPLIANCE_VALUE = '__custom__';

export const COMMON_APPLIANCES = [
  { name: 'Air Conditioner 1HP', defaultWatts: 1000, isMotor: true, category: 'Cooling' },
  { name: 'Air Conditioner 1.5HP', defaultWatts: 1500, isMotor: true, category: 'Cooling' },
  { name: 'Air Conditioner Inverter 1HP', defaultWatts: 800, isMotor: true, category: 'Cooling' },
  { name: 'Electric Fan Desk', defaultWatts: 50, isMotor: true, category: 'Cooling' },
  { name: 'Electric Fan Stand', defaultWatts: 75, isMotor: true, category: 'Cooling' },
  { name: 'Ceiling Fan', defaultWatts: 75, isMotor: true, category: 'Cooling' },
  { name: 'Air Purifier', defaultWatts: 50, isMotor: false, category: 'Cooling' },
  { name: 'Refrigerator', defaultWatts: 150, isMotor: true, category: 'Kitchen' },
  { name: 'Refrigerator Inverter', defaultWatts: 100, isMotor: true, category: 'Kitchen' },
  { name: 'Chest Freezer', defaultWatts: 200, isMotor: true, category: 'Kitchen' },
  { name: 'Rice Cooker', defaultWatts: 800, isMotor: false, category: 'Kitchen' },
  { name: 'Electric Kettle', defaultWatts: 1500, isMotor: false, category: 'Kitchen' },
  { name: 'Microwave Oven', defaultWatts: 1200, isMotor: false, category: 'Kitchen' },
  { name: 'Induction Cooker', defaultWatts: 2000, isMotor: false, category: 'Kitchen' },
  { name: 'Electric Stove', defaultWatts: 1500, isMotor: false, category: 'Kitchen' },
  { name: 'Oven Toaster', defaultWatts: 800, isMotor: false, category: 'Kitchen' },
  { name: 'Range Hood', defaultWatts: 200, isMotor: true, category: 'Kitchen' },
  { name: 'Water Dispenser Hot and Cold', defaultWatts: 500, isMotor: false, category: 'Kitchen' },
  { name: 'Washing Machine', defaultWatts: 500, isMotor: true, category: 'Laundry' },
  { name: 'Clothes Dryer', defaultWatts: 2000, isMotor: true, category: 'Laundry' },
  { name: 'Flat Iron', defaultWatts: 1000, isMotor: false, category: 'Laundry' },
  { name: 'LED Bulb', defaultWatts: 10, isMotor: false, category: 'Lighting' },
  { name: 'Fluorescent Lamp', defaultWatts: 20, isMotor: false, category: 'Lighting' },
  { name: 'LED Tube', defaultWatts: 18, isMotor: false, category: 'Lighting' },
  { name: 'Outdoor Flood Light', defaultWatts: 50, isMotor: false, category: 'Lighting' },
  { name: 'TV LED 32 inch', defaultWatts: 60, isMotor: false, category: 'Entertainment' },
  { name: 'TV LED 55 inch', defaultWatts: 150, isMotor: false, category: 'Entertainment' },
  { name: 'Sound System', defaultWatts: 200, isMotor: false, category: 'Entertainment' },
  { name: 'Game Console', defaultWatts: 150, isMotor: false, category: 'Entertainment' },
  { name: 'Laptop', defaultWatts: 65, isMotor: false, category: 'Office' },
  { name: 'Desktop Computer', defaultWatts: 300, isMotor: false, category: 'Office' },
  { name: 'WiFi Router', defaultWatts: 10, isMotor: false, category: 'Office' },
  { name: 'Phone Charger', defaultWatts: 15, isMotor: false, category: 'Office' },
  { name: 'Printer', defaultWatts: 50, isMotor: false, category: 'Office' },
  { name: 'Water Pump', defaultWatts: 1000, isMotor: true, category: 'Utility' },
  { name: 'Water Heater', defaultWatts: 3000, isMotor: false, category: 'Utility' },
  { name: 'Vacuum Cleaner', defaultWatts: 1200, isMotor: true, category: 'Utility' },
  { name: 'Pressure Washer', defaultWatts: 1500, isMotor: true, category: 'Utility' },
  { name: 'Electric Gate Opener', defaultWatts: 300, isMotor: true, category: 'Utility' },
  { name: 'CCTV System', defaultWatts: 50, isMotor: false, category: 'Utility' },
];

export const findAppliancePreset = (name) => {
  if (!name) return null;
  const normalized = String(name).trim().toLowerCase();
  return COMMON_APPLIANCES.find((a) => a.name.toLowerCase() === normalized) || null;
};
