import React, { useState } from 'react';
import { GITHUB_PUSH_SCRIPT } from '../engine/repoFiles';
import { Check, Copy, Terminal, BookOpen, Layers, Wrench } from 'lucide-react';

const COMMAND_MATRIX = [
  {
    cmd: '/dnd sheet',
    perm: 'All Players',
    desc: 'Displays interactive color-coded Character Sheet in chat with clickable Check, Adv, Dis, and Save buttons.',
  },
  {
    cmd: '/dnd class <className>',
    perm: 'All Players',
    desc: 'Sets class preset (Fighter, Wizard, Rogue, Cleric, Paladin, Bard) and syncs Vanilla max health.',
  },
  {
    cmd: '/dnd roll <formula>',
    perm: 'All Players',
    desc: 'Parses NdS+M formulas (1d20, 2d6+3, 1d8-1). Highlights Nat 20 (Gold/Totem) and Nat 1 (Crimson/Anvil).',
  },
  {
    cmd: '/dnd check <ability> [mode]',
    perm: 'All Players',
    desc: 'Rolls 1d20 + abilityMod (normal, adv, dis). Automatically consumes Heroic Inspiration if active.',
  },
  {
    cmd: '/dnd skill <skillName> [mode]',
    perm: 'All Players',
    desc: 'Rolls one of the 18 D&D 5e skills (perception, stealth, athletics, arcana, etc.) with proficiency bonus.',
  },
  {
    cmd: '/dnd save <ability> [mode]',
    perm: 'All Players',
    desc: 'Rolls a Saving Throw for the specified ability, adding proficiency bonus if proficient.',
  },
  {
    cmd: '/dnd combat start [radius]',
    perm: 'All / DM',
    desc: 'Scans radius (default 25m), rolls Initiative, sorts descending, freezes mob AI, and starts Round 1.',
  },
  {
    cmd: '/dnd action attack',
    perm: 'Active Turn',
    desc: 'Raytraces target in sight (5m melee / 20m ranged), compares 1d20 + attackMod vs AC, rolls 1d8 + mod damage.',
  },
  {
    cmd: '/dnd action dash',
    perm: 'Active Turn',
    desc: 'Expends Action to double remaining movement allowance for the current turn.',
  },
  {
    cmd: '/dnd action feature',
    perm: 'Active Turn',
    desc: 'Uses class Bonus Action feature (Second Wind, Cunning Action, Lay on Hands, Arcane Ward, Bardic Inspiration).',
  },
  {
    cmd: '/dnd rest <short|long>',
    perm: 'All Players',
    desc: 'Spends a Hit Die to heal (short) or restores full HP, Hit Dice, and class features (long).',
  },
  {
    cmd: '/dnd next',
    perm: 'All / DM',
    desc: 'Advances turn in Initiative Order, resets turn resources, moves Glowing highlight, and prints turn buttons.',
  },
  {
    cmd: '/dnd combat end',
    perm: 'All / DM',
    desc: 'Ends Turn-Based Combat, removes Glowing effects, restores mob AI, and unlocks movement.',
  },
  {
    cmd: '/dnd dm',
    perm: 'Game Master',
    desc: 'Opens the clickable Game Master Control Panel in chat.',
  },
  {
    cmd: '/dnd setstat <player> <stat> <val>',
    perm: 'OP (Level 2)',
    desc: 'Modifies any player stat (str, dex, con, int, wis, cha, ac, hp, maxhp, speed, level) and syncs health.',
  },
];

export const DocumentationView: React.FC = () => {
  const [copiedGit, setCopiedGit] = useState(false);

  const handleCopyGitCommands = async () => {
    try {
      await navigator.clipboard.writeText(GITHUB_PUSH_SCRIPT);
      setCopiedGit(true);
      setTimeout(() => setCopiedGit(false), 2000);
    } catch {
      setCopiedGit(true);
      setTimeout(() => setCopiedGit(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* GitHub Deployment Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
              <Terminal className="w-4 h-4" />
              <span>01. GitHub Repository Upload Workflow</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              Ready for Direct Git Push or Modpack Inclusion
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              The repository root now contains the exact directory structure required by Minecraft 1.20.1 Fabric and KubeJS 6 (`kubejs/startup_scripts/dnd_startup.js`, `kubejs/server_scripts/dnd_engine.js`, `kubejs/assets/kubejs/lang/en_us.json`, and `README.md`).
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Git Quick-Push Commands</span>
              <button
                type="button"
                onClick={handleCopyGitCommands}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded cursor-pointer"
              >
                {copiedGit ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedGit ? 'Copied' : 'Copy Commands'}
              </button>
            </div>
            <pre className="text-xs font-mono text-amber-300 overflow-x-auto leading-relaxed">
              {`git init
git add kubejs/ README.md .gitignore
git commit -m "feat: KubeJS 6 D&D 5e Tabletop RPG Engine (MC 1.20.1)"
git branch -M main
git remote add origin https://github.com/YOUR_USER/kubejs-dnd5e.git
git push -u origin main`}
            </pre>
          </div>
        </div>

        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <Wrench className="w-4 h-4" />
              <span>02. Server &amp; Client Prerequisites</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              Minecraft 1.20.1 Fabric Dependencies
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Drop the `kubejs/` folder into your server or client instance root alongside these standard dependencies:
            </p>
          </div>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg bg-slate-950 px-4">
            <div className="py-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Minecraft &amp; Loader</span>
              <span className="font-mono text-slate-400">1.20.1 · Fabric Loader &ge; 0.15.x</span>
            </div>
            <div className="py-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">KubeJS 6</span>
              <span className="font-mono text-amber-400">kubejs-fabric-2001.6.5-build.x</span>
            </div>
            <div className="py-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Rhino &amp; Architectury API</span>
              <span className="font-mono text-slate-400">rhino-fabric-2001.2.2 · architectury-9.2.x</span>
            </div>
            <div className="py-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Hot Reload Command</span>
              <span className="font-mono text-emerald-400">/reload (server_scripts) · Restart for startup_scripts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Command Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">
              Complete /dnd Command Registry Reference
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {COMMAND_MATRIX.length} Registered Subcommands
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-3 px-4">Command Syntax</th>
                <th className="py-3 px-4">Permission Scope</th>
                <th className="py-3 px-4">Engine Behavior</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {COMMAND_MATRIX.map((row) => (
                <tr key={row.cmd} className="hover:bg-slate-950/60">
                  <td className="py-3 px-4 font-mono font-semibold text-amber-300 whitespace-nowrap">
                    {row.cmd}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                    {row.perm}
                  </td>
                  <td className="py-3 px-4 text-slate-300 leading-relaxed">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Persistent Data Schema Reference */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <h3 className="text-base font-bold text-slate-100">
            Persistent NBT Schema (player.persistentData.dnd &amp; server.persistentData.dndCombat)
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <div className="text-xs font-mono text-sky-400 mb-2">player.persistentData.dnd</div>
            <pre className="text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`{
  charClass: "Fighter",     // Fighter, Wizard, Rogue, Cleric, Paladin, Bard
  level: 1,                 // 1 to 20 (Proficiency = Math.ceil(level/4) + 1)
  ac: 16,                   // Armor Class
  hp: 24,                   // Current HP (synced to Vanilla health)
  maxHp: 24,                // Max HP (synced via generic.max_health attribute)
  hitDie: 10,               // Hit Die faces for Short Rest recovery
  speed: 6,                 // Movement allowance in blocks per turn
  inspiration: false,       // Auto-consumed for Advantage on next d20 roll
  str: 16, dex: 13, con: 15, int: 10, wis: 12, cha: 8,
  saveProf1: "str",
  saveProf2: "con",
  skillsCsv: "athletics,intimidation,perception"
}`}
            </pre>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <div className="text-xs font-mono text-amber-400 mb-2">server.persistentData.dndCombat</div>
            <pre className="text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`{
  active: true,             // Turn-based combat lock state
  round: 1,                 // Current combat round counter
  turnIndex: 0,             // Active index in Initiative Order
  partyFrozen: false,       // Global DM Party Freeze toggle
  orderJson: "[...]",       // NBT-safe serialized Initiative array
  order: [
    {
      uuid: "...",
      name: "Aldric_Vane",
      isPlayer: true,
      initiative: 18,
      startX: 120.5, startY: 64.0, startZ: -45.5,
      speed: 6, maxMoveThisTurn: 6, remainingMove: 6.0,
      hasAction: true, hasBonusAction: true, ac: 16
    }
  ]
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
