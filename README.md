# 🎲 KubeJS D&D 5e Tabletop RPG Engine (Minecraft 1.20.1 Fabric)

A complete, zero-placeholder **Dungeons & Dragons 5th Edition (5e) Tabletop RPG Engine** built natively for **Minecraft 1.20.1 (Fabric)** using **KubeJS 6**. Turn any Minecraft server into a virtual tabletop (VTT) with persistent character sheets, 6 playable classes, automated initiative & grid movement enforcement, raycast combat resolution, and a clickable Game Master dashboard in chat.

---

## 📂 Repository File Structure

```text
.
├── kubejs/
│   ├── assets/
│   │   └── kubejs/
│   │       └── lang/
│   │           └── en_us.json            # Item localization strings
│   ├── startup_scripts/
│   │   └── dnd_startup.js                # Custom DM & Player RPG items registry
│   └── server_scripts/
│       └── dnd_engine.js                 # Self-contained D&D 5e rules, combat & chat UI engine
└── README.md
```

---

## ✨ Key Features

### 1. Custom RPG Items (`kubejs/startup_scripts/dnd_startup.js`)
| Item ID | Name | Role | Right-Click Action | Sneak + Right-Click Action |
| :--- | :--- | :--- | :--- | :--- |
| `kubejs:dm_wand` | **Master Wand of Encounters** | Game Master | Start or Stop Turn-Based Combat (25m radius) | Freeze or Unfreeze the Party |
| `kubejs:dm_orb` | **Orb of Fate** | Game Master | Open clickable **DM Control Panel** in chat | View Active Initiative Order |
| `kubejs:d20_die` | **Icosahedron of Fate (d20)** | Player / DM | Roll `1d20` publicly in chat with sound & particles | Open Character Sheet (`/dnd sheet`) |
| `kubejs:inspiration_token` | **Token of Heroic Inspiration** | Player | Consume to gain **Advantage** on your next `d20` roll | — |
| `kubejs:character_folio` | **Adventurer's Character Folio** | Player | Open Interactive Character Sheet in chat | Take a Short Rest (Spend Hit Die) |
| `kubejs:healing_draught` | **Potion of Superior Healing** | Player | Consume to roll `2d4+2` and restore HP | — |

---

### 2. Persistent Character Sheet & 6 Class Presets
Stored automatically in `player.persistentData.dnd` on first login and synchronized with Vanilla Minecraft's `minecraft:generic.max_health` attribute:
- **Classes**: `Fighter`, `Wizard`, `Rogue`, `Cleric`, `Paladin`, `Bard`
- **Core Stats**: `str`, `dex`, `con`, `int`, `wis`, `cha`, `ac`, `hp`, `maxHp`, `speed`, `level` (1–20), `inspiration`
- **Calculations**:
  - Ability Modifier: `Math.floor((score - 10) / 2)`
  - Proficiency Bonus: `Math.ceil(level / 4) + 1`
- **18 D&D 5e Skills**: Full proficiency support for `perception`, `stealth`, `athletics`, `arcana`, `persuasion`, `sleight_of_hand`, and more.

---

### 3. Turn-Based Combat & Grid Movement Engine
Stored in `server.persistentData.dndCombat` with full JSON/NBT persistence safety:
- **Initiative Scanner**: Scans all players and living hostile mobs or custom-named NPCs within `25` blocks (or custom radius), rolls `1d20 + dexMod` for players and `1d20 + 1` for mobs/NPCs, sorts descending, and freezes mob AI (`{NoAI:1b}`).
- **Active Turn Highlight**: Highlights the current turn combatant with the **Glowing** effect and displays clickable combat action buttons in chat.
- **Movement Clamping (`PlayerEvents.tick`)**:
  - **Out-of-Turn Lock**: Players who are not active are locked to their block coordinates (teleported back if they move `> 0.3` blocks horizontally) with an Action Bar waiting indicator.
  - **In-Turn Grid Tracking**: Tracks horizontal Euclidean distance moved from turn-start coordinates, updates `remainingMove` in real time on the Action Bar HUD, and clamps movement at `speed` blocks unless the player uses **Dash**.

---

## 💻 Commands Reference

| Command | Permission | Description |
| :--- | :--- | :--- |
| `/dnd sheet` | All Players | Opens interactive Character Sheet with clickable Check, Advantage, Disadvantage & Save buttons |
| `/dnd class <className>` | All Players | Applies class preset (`Fighter`, `Wizard`, `Rogue`, `Cleric`, `Paladin`, `Bard`) & syncs health |
| `/dnd roll <formula>` | All Players | Rolls dice formulas (`1d20`, `2d6+3`, `1d8-1`) with Nat 20 (Totem) & Nat 1 (Anvil) effects |
| `/dnd check <ability> [mode]` | All Players | Rolls `1d20 + abilityMod` (`normal`, `adv`, `dis`), auto-consuming Inspiration if active |
| `/dnd skill <skillName> [mode]` | All Players | Rolls a skill check (`perception`, `stealth`, `arcana`, etc.) with proficiency bonus if applicable |
| `/dnd save <ability> [mode]` | All Players | Rolls a Saving Throw with class proficiency bonus if applicable |
| `/dnd action attack` | All Players | Raytraces target in sight (5m melee / 20m ranged), rolls `1d20 + attackMod` vs AC, deals `1d8 + mod` |
| `/dnd action dash` | All Players | Expends Action to double movement speed allowance for the current turn |
| `/dnd action feature` | All Players | Uses class Bonus Action feature (Second Wind, Cunning Action, Lay on Hands, Arcane Ward, etc.) |
| `/dnd rest <short\|long>` | All Players | Spends a Hit Die to heal (`short`) or restores full HP and class resources (`long`) |
| `/dnd next` | All Players | Ends current turn, advances Initiative Order, resets turn resources, and shifts Glowing highlight |
| `/dnd combat start [radius]` | All / DM | Starts Turn-Based Combat within `radius` blocks (default `25`) |
| `/dnd combat end` | All / DM | Ends Turn-Based Combat, removes Glowing, and restores mob AI and free movement |
| `/dnd dm` | Game Master | Opens the clickable **DM Control Panel** in chat |
| `/dnd setstat <player> <stat> <val>` | OP (Level 2) | Modifies a player's `str`, `dex`, `con`, `int`, `wis`, `cha`, `ac`, `hp`, `maxhp`, `speed`, or `level` |

---

## 🚀 Installation on Minecraft 1.20.1 Fabric

1. Install **Minecraft 1.20.1** with **Fabric Loader**, **Fabric API**, **Rhino**, **Architectury API**, and **KubeJS 6** (`kubejs-fabric-2001.6.x`).
2. Copy the `kubejs/` folder from this repository directly into your Minecraft instance or server root directory.
3. Start the server (or run `/reload` for `server_scripts/dnd_engine.js`; `startup_scripts/dnd_startup.js` requires a game restart to register new items).
4. Give yourself the DM tools in-game:
   ```mcfunction
   /give @s kubejs:dm_wand
   /give @s kubejs:dm_orb
   /give @s kubejs:d20_die
   /give @s kubejs:inspiration_token 5
   ```
