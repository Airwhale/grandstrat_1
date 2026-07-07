// Ability execution engine for tactical combat.
// Pure functions: take units/grid, return updated units/grid + log entries.

import type { TacticalUnit, Tile, CombatLogEntry } from '@/types';
import { ABILITIES } from '@/data/operatives';

export interface AbilityResult {
  units: TacticalUnit[];
  grid: Tile[][];
  log: CombatLogEntry[];
  ok: boolean;
  sound?: 'explosion' | 'heal' | 'cloak' | 'shot' | 'confirm' | 'kill';
}

/** How each ability picks its target. Drives the UI targeting mode. */
export type TargetKind = 'self' | 'ally' | 'enemy' | 'tile';

export const ABILITY_TARGETING: Record<string, TargetKind> = {
  runAndGun: 'self',
  hitAndRun: 'self',
  cloak: 'self',
  hackDefenses: 'self',
  shotgunBlast: 'enemy',
  headshot: 'enemy',
  suppress: 'enemy',
  sabotage: 'enemy',
  hack: 'enemy',
  bribe: 'enemy',
  convertUnit: 'enemy',
  concealedPistol: 'enemy',
  concealedShot: 'enemy',
  heal: 'ally',
  combatStim: 'ally',
  rocketLauncher: 'tile',
  empGrenade: 'tile',
  explosiveBreach: 'tile',
  smokeBomb: 'tile',
};

/** Limited-use abilities: uses per mission. */
export const ABILITY_MAX_USES: Record<string, number> = {
  rocketLauncher: 1,
  heal: 2,
  convertUnit: 1,
};

/** Abilities hidden from the ability bar (covered by core buttons or passive). */
export const HIDDEN_ABILITIES = new Set(['overwatch', 'hunkerDown', 'revive', 'ambush', 'deployDrone', 'setTrap', 'squadsight']);

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function dmgTo(units: TacticalUnit[], targetId: string, amount: number, log: CombatLogEntry[], sourceName: string, turn: number, attackerId?: string): TacticalUnit[] {
  return units.map((u) => {
    if (u.id !== targetId) return u;
    const hp = Math.max(0, u.hp - amount);
    log.push({ turn, message: `${sourceName} hits ${u.name} for ${amount}`, type: 'ability' });
    if (hp <= 0) {
      log.push({ turn, message: `${u.name} eliminated!`, type: 'kill' });
    }
    return { ...u, hp };
  }).map((u) => {
    // credit the kill
    if (attackerId && u.id === attackerId) {
      const victim = units.find((v) => v.id === targetId);
      if (victim && victim.hp - amount <= 0 && victim.hp > 0 && u.isPlayer) {
        return { ...u, kills: (u.kills ?? 0) + 1 };
      }
    }
    return u;
  });
}

function spendAbility(units: TacticalUnit[], unitId: string, abilityId: string, apCost: number, cooldown: number): TacticalUnit[] {
  return units.map((u) => {
    if (u.id !== unitId) return u;
    const uses = { ...(u.abilityUses ?? {}) };
    if (abilityId in (ABILITY_MAX_USES)) {
      uses[abilityId] = Math.max(0, (uses[abilityId] ?? ABILITY_MAX_USES[abilityId]) - 1);
    }
    return {
      ...u,
      actionsRemaining: Math.max(0, u.actionsRemaining - apCost),
      abilityCooldowns: { ...(u.abilityCooldowns ?? {}), [abilityId]: cooldown },
      abilityUses: uses,
    };
  });
}

export function canUseAbility(unit: TacticalUnit, abilityId: string): { ok: boolean; reason?: string } {
  const def = ABILITIES[abilityId];
  if (!def) return { ok: false, reason: 'Unknown ability' };
  if (unit.actionsRemaining < def.apCost) return { ok: false, reason: `Needs ${def.apCost} AP` };
  const cd = unit.abilityCooldowns?.[abilityId] ?? 0;
  if (cd > 0) return { ok: false, reason: `Cooldown: ${cd} turn${cd > 1 ? 's' : ''}` };
  if (abilityId in ABILITY_MAX_USES) {
    const left = unit.abilityUses?.[abilityId] ?? ABILITY_MAX_USES[abilityId];
    if (left <= 0) return { ok: false, reason: 'No uses left' };
  }
  return { ok: true };
}

/**
 * Execute an ability. `target` is a tile coordinate; unit targets are resolved
 * from whatever stands on that tile. Self abilities ignore the target.
 */
export function executeAbility(
  units: TacticalUnit[],
  grid: Tile[][],
  casterId: string,
  abilityId: string,
  target: { x: number; y: number } | null,
  turn: number,
): AbilityResult {
  const log: CombatLogEntry[] = [];
  const caster = units.find((u) => u.id === casterId);
  const def = ABILITIES[abilityId];
  const fail: AbilityResult = { units, grid, log, ok: false };
  if (!caster || !def) return fail;
  const check = canUseAbility(caster, abilityId);
  if (!check.ok) return fail;

  const targetUnit = target
    ? units.find((u) => u.hp > 0 && u.position.x === target.x && u.position.y === target.y)
    : undefined;
  const kind = ABILITY_TARGETING[abilityId] ?? 'self';
  const inRange = (pos: { x: number; y: number }) => !def.range || dist(caster.position, pos) <= def.range;

  // Validate target
  if (kind === 'enemy' && (!targetUnit || targetUnit.isPlayer === caster.isPlayer || !inRange(targetUnit.position))) return fail;
  if (kind === 'ally' && (!targetUnit || targetUnit.isPlayer !== caster.isPlayer || targetUnit.id === casterId || !inRange(targetUnit.position))) return fail;
  if (kind === 'tile' && (!target || !inRange(target))) return fail;

  let newUnits = [...units];
  let newGrid = grid;
  let sound: AbilityResult['sound'] = 'confirm';

  switch (abilityId) {
    // ---- self ----
    case 'runAndGun':
    case 'hitAndRun': {
      newUnits = newUnits.map((u) => u.id === casterId ? { ...u, actionsRemaining: u.actionsRemaining + 1 } : u);
      log.push({ turn, message: `${caster.name} surges forward (+1 AP)`, type: 'ability' });
      break;
    }
    case 'cloak': {
      newUnits = newUnits.map((u) => u.id === casterId
        ? { ...u, isCloaked: true, statusEffects: [...u.statusEffects, { type: 'cloak', turnsRemaining: 2, value: 0 }] }
        : u);
      log.push({ turn, message: `${caster.name} vanishes from sight`, type: 'ability' });
      sound = 'cloak';
      break;
    }
    case 'hackDefenses': {
      let cleared = 0;
      newUnits = newUnits.map((u) => {
        if (u.isPlayer !== caster.isPlayer && u.hp > 0 && dist(caster.position, u.position) <= (def.range ?? 6) && u.isInOverwatch) {
          cleared++;
          return { ...u, isInOverwatch: false, statusEffects: [...u.statusEffects, { type: 'stunned', turnsRemaining: 1, value: 0 }] };
        }
        return u;
      });
      log.push({ turn, message: `${caster.name} hacks enemy systems (${cleared} disrupted)`, type: 'ability' });
      break;
    }

    // ---- enemy target ----
    case 'shotgunBlast': {
      newUnits = dmgTo(newUnits, targetUnit!.id, def.damage ?? 5, log, caster.name, turn, casterId);
      // splash to enemies adjacent to the target
      for (const u of newUnits.filter((x) => !x.isPlayer === !targetUnit!.isPlayer && x.hp > 0 && x.id !== targetUnit!.id && dist(x.position, targetUnit!.position) <= 1)) {
        newUnits = dmgTo(newUnits, u.id, Math.ceil((def.damage ?? 5) / 2), log, `${caster.name} (blast)`, turn, casterId);
      }
      sound = 'shot';
      break;
    }
    case 'headshot': {
      // High-risk shot: guaranteed hit, big crit chance
      const crit = Math.random() < 0.4 + 0.05;
      const base = Math.max(1, caster.weaponDamage - targetUnit!.armor);
      const dmg = crit ? Math.floor(base * 1.8) : base;
      newUnits = dmgTo(newUnits, targetUnit!.id, dmg, log, crit ? `${caster.name} (HEADSHOT)` : caster.name, turn, casterId);
      sound = crit ? 'kill' : 'shot';
      break;
    }
    case 'suppress': {
      newUnits = newUnits.map((u) => u.id === targetUnit!.id
        ? { ...u, statusEffects: [...u.statusEffects, { type: 'suppressed', turnsRemaining: 1, value: -50 }] }
        : u);
      log.push({ turn, message: `${caster.name} suppresses ${targetUnit!.name} (-50 aim)`, type: 'ability' });
      sound = 'shot';
      break;
    }
    case 'sabotage':
    case 'hack': {
      const success = abilityId === 'hack' ? Math.random() < 0.6 : true;
      if (success) {
        newUnits = newUnits.map((u) => u.id === targetUnit!.id
          ? { ...u, statusEffects: [...u.statusEffects, { type: 'stunned', turnsRemaining: abilityId === 'hack' ? 2 : 1, value: 0 }] }
          : u);
        log.push({ turn, message: `${caster.name} disables ${targetUnit!.name}`, type: 'ability' });
      } else {
        log.push({ turn, message: `${caster.name}'s hack FAILED`, type: 'miss' });
      }
      break;
    }
    case 'bribe':
    case 'convertUnit': {
      const chance = abilityId === 'convertUnit' ? 1 : 0.5;
      if (Math.random() < chance) {
        newUnits = newUnits.map((u) => u.id === targetUnit!.id
          ? { ...u, isPlayer: caster.isPlayer, name: `${u.name} (turned)`, actionsRemaining: 0 }
          : u);
        log.push({ turn, message: `${targetUnit!.name} switches sides!`, type: 'ability' });
      } else {
        log.push({ turn, message: `${targetUnit!.name} refuses the bribe`, type: 'miss' });
      }
      break;
    }
    case 'concealedPistol': {
      const dmg = Math.max(1, (def.damage ?? 3)); // ignores armor
      newUnits = dmgTo(newUnits, targetUnit!.id, dmg, log, `${caster.name} (concealed pistol)`, turn, casterId);
      sound = 'shot';
      break;
    }
    case 'concealedShot': {
      const bonus = caster.isCloaked ? 1.5 : 1.0;
      const dmg = Math.max(1, Math.floor(caster.weaponDamage * bonus) - targetUnit!.armor);
      newUnits = dmgTo(newUnits, targetUnit!.id, dmg, log, caster.name, turn, casterId);
      sound = 'shot';
      break;
    }

    // ---- ally target ----
    case 'heal': {
      newUnits = newUnits.map((u) => u.id === targetUnit!.id
        ? { ...u, hp: Math.min(u.maxHp, u.hp + 4) }
        : u);
      log.push({ turn, message: `${caster.name} heals ${targetUnit!.name} (+4 HP)`, type: 'ability' });
      sound = 'heal';
      break;
    }
    case 'combatStim': {
      newUnits = newUnits.map((u) => u.id === targetUnit!.id
        ? { ...u, mobility: u.mobility + 2, statusEffects: [...u.statusEffects, { type: 'stim', turnsRemaining: 2, value: 20 }] }
        : u);
      log.push({ turn, message: `${caster.name} stims ${targetUnit!.name} (+20 aim, +2 mobility)`, type: 'ability' });
      sound = 'heal';
      break;
    }

    // ---- tile target (AoE) ----
    case 'rocketLauncher':
    case 'empGrenade':
    case 'explosiveBreach': {
      const radius = def.aoeRadius ?? 1;
      const dmg = def.damage ?? 4;
      // damage every unit in radius (friendly fire is real)
      for (const u of newUnits.filter((x) => x.hp > 0 && dist(x.position, target!) <= radius)) {
        newUnits = dmgTo(newUnits, u.id, Math.max(1, dmg - u.armor), log, `${caster.name} (${def.name})`, turn, casterId);
      }
      // destroy cover in the blast
      newGrid = newGrid.map((row) => row.map((tile) => {
        if (dist({ x: tile.x, y: tile.y }, target!) <= radius && (tile.type === 'halfCover' || tile.type === 'fullCover')) {
          return { ...tile, type: 'floor' as const, destructible: false };
        }
        return tile;
      }));
      log.push({ turn, message: `${def.name} detonates — cover destroyed`, type: 'ability' });
      sound = 'explosion';
      break;
    }
    case 'smokeBomb': {
      const radius = def.aoeRadius ?? 1;
      newUnits = newUnits.map((u) => {
        if (u.hp > 0 && dist(u.position, target!) <= radius) {
          return { ...u, statusEffects: [...u.statusEffects, { type: 'smoke', turnsRemaining: 2, value: -20 }] };
        }
        return u;
      });
      log.push({ turn, message: `${caster.name} deploys smoke cover`, type: 'ability' });
      sound = 'cloak';
      break;
    }

    default:
      return fail;
  }

  newUnits = spendAbility(newUnits, casterId, abilityId, def.apCost, def.cooldown);
  return { units: newUnits, grid: newGrid, log, ok: true, sound };
}
