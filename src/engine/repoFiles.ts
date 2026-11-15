import startupScriptRaw from '../../kubejs/startup_scripts/dnd_startup.js?raw';
import serverEngineRaw from '../../kubejs/server_scripts/dnd_engine.js?raw';
import enUsLangRaw from '../../kubejs/assets/kubejs/lang/en_us.json?raw';
import readmeRaw from '../../README.md?raw';
import licenseRaw from '../../LICENSE?raw';

export interface RepoFileEntry {
  path: string;
  title: string;
  language: 'javascript' | 'json' | 'markdown' | 'bash';
  description: string;
  content: string;
}

export const GITHUB_PUSH_SCRIPT = `#!/usr/bin/env bash
# ============================================================================
# GitHub Repository Initialization & Push Script
# KubeJS D&D 5e Tabletop RPG Engine (Minecraft 1.20.1 Fabric)
# ============================================================================
set -e

REPO_URL="\${1:-https://github.com/YOUR_USERNAME/kubejs-dnd-5e-engine.git}"

git init
git add kubejs/ README.md LICENSE .gitignore
git commit -m "feat: complete KubeJS 6 D&D 5e Tabletop RPG Engine for MC 1.20.1 Fabric"
git branch -M main
git remote add origin "$REPO_URL"
git push -u origin main
`;

export const REPO_FILES: RepoFileEntry[] = [
  {
    path: 'kubejs/startup_scripts/dnd_startup.js',
    title: 'Startup Script (Custom RPG Items)',
    language: 'javascript',
    description:
      'Registers kubejs:dm_wand, kubejs:dm_orb, kubejs:d20_die, kubejs:inspiration_token, kubejs:character_folio, and kubejs:healing_draught with glowing glint and lore tooltips.',
    content: startupScriptRaw,
  },
  {
    path: 'kubejs/server_scripts/dnd_engine.js',
    title: 'Server Engine (D&D 5e Rules & Combat)',
    language: 'javascript',
    description:
      'Self-contained server engine handling persistent character sheets, 6 classes, 18 skills, dice parser, turn-based combat, movement clamping, and clickable DM/Player UI.',
    content: serverEngineRaw,
  },
  {
    path: 'kubejs/assets/kubejs/lang/en_us.json',
    title: 'Localization Asset (en_us.json)',
    language: 'json',
    description: 'English localization mappings for all registered custom KubeJS RPG items.',
    content: enUsLangRaw,
  },
  {
    path: 'README.md',
    title: 'GitHub Repository Documentation (README.md)',
    language: 'markdown',
    description:
      'Complete documentation with installation guide, item matrix, command reference table, and architecture overview for GitHub.',
    content: readmeRaw,
  },
  {
    path: 'LICENSE',
    title: 'MIT Open-Source License',
    language: 'markdown',
    description: 'Standard MIT License ready for public GitHub distribution and modpack inclusion.',
    content: licenseRaw,
  },
  {
    path: 'scripts/push_to_github.sh',
    title: 'GitHub Quick-Push Script',
    language: 'bash',
    description: 'One-command shell script to initialize git, stage the kubejs/ folder, README.md, and LICENSE, and push to your GitHub remote.',
    content: GITHUB_PUSH_SCRIPT,
  },
];
