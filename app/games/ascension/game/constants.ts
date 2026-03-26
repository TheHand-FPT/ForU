export const GAME_CONSTANTS = {
  PLAYER: {
    MAX_HP: 200,
    MAX_STAMINA: 100,
    MAX_HUNGER: 200,
    SPEED: 200, // pixels per second
    SPRINT_MULTIPLIER: 1.5,
  },
  WEAPONS: {
    PISTOL: { damage: 10, fireRate: 0.3, type: 'RANGED', ammoType: 'PISTOL_AMMO' },
    KATANA: { damage: 50, fireRate: 0.5, type: 'MELEE', range: 60 },
    AK47: { damage: 20, fireRate: 0.1, type: 'RANGED', ammoType: 'AK47_AMMO' },
  },
  ITEMS: {
    BREAD: { type: 'CONSUMABLE', hunger: 50, hp: 0, stamina: 0, name: 'Bánh mì' },
    CHICKEN: { type: 'CONSUMABLE', hunger: 100, hp: 0, stamina: 0, name: 'Đùi gà' },
    SYRINGE: { type: 'CONSUMABLE', hunger: 0, hp: 100, stamina: 0, name: 'Ống tiêm' },
    BANDAGE: { type: 'CONSUMABLE', hunger: 0, hp: 20, stamina: 0, name: 'Băng gạc' },
    ENERGY_DRINK: { type: 'CONSUMABLE', hunger: 0, hp: 0, stamina: 50, name: 'Nước tăng lực' },
    PISTOL_AMMO: { type: 'AMMO', amount: 20, name: 'Đạn súng lục' },
    AK47_AMMO: { type: 'AMMO', amount: 30, name: 'Đạn AK-47' },
    SHIP_MACHINE_GUN: { type: 'UPGRADE', name: 'Súng máy tàu' },
    SHIP_ARMOR: { type: 'UPGRADE', name: 'Giáp tàu' },
  },
  SHIP: {
    MAX_HP: 500,
    BASE_ARMOR: 200,
    UPGRADE_ARMOR_BONUS: 500,
    MACHINE_GUN_DAMAGE: 50,
    FLIGHT_DURATION: 60, // 1 minute in seconds
  },
  ENEMIES: {
    GROUND_SMALL: { hp: 50, damage: 10, speed: 100, color: '#ff4d4d', radius: 15 },
    GROUND_ELITE: { hp: 200, damage: 50, speed: 80, color: '#cc0000', radius: 25 },
    GROUND_HIGH: { hp: 100, damage: 30, speed: 120, color: '#ff9933', radius: 20 },
    FLYING_SMALL: { hp: 100, damage: 30, speed: 150, color: '#cc33ff', radius: 15 },
    FLYING_ELITE: { hp: 400, damage: 100, speed: 100, color: '#6600cc', radius: 30 },
    FLYING_HIGH: { hp: 200, damage: 50, speed: 130, color: '#9933ff', radius: 20 },
  },
  MAP_SIZE: 6000,
  WIN_STAGES: 3,
};
