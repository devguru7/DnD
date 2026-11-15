import React, { useState, useMemo } from 'react';
import { REPO_FILES, RepoFileEntry } from '../engine/repoFiles';
import { Copy, Check, Download, FileCode, Terminal, Search, FolderGit2, ShieldCheck } from 'lucide-react';

interface CodeExplorerProps {
  onOpenSimulator: () => void;
}

const ENHANCEMENT_NOTES = [
  {
    title: 'NBT ListTag & CompoundTag Persistence Hardening',
    detail:
      'Added getCombatState() and saveCombatState() with dual JSON/NBT serialization and isTruthyNbt() coercion so server.persistentData.dndCombat survives server restarts without Rhino ListTag prototype issues.',
  },
  {
    title: 'Complete 18 D&D 5e Skills + Class Skill Proficiencies',
    detail:
      'Mapped all 18 canonical 5e skills (Perception, Stealth, Arcana, Athletics, Persuasion, etc.) to their governing ability scores with automatic proficiency bonus calculation via /dnd skill <name> [mode].',
  },
  {
    title: 'Ranged & Spellcaster Raycast Reach + Class Bonus Features',
    detail:
      'Extended /dnd action attack to support 20m reach for bows, crossbows, and spellcasters (Wizard, Bard) alongside 5m melee reach, plus /dnd action feature for Second Wind, Cunning Action, Lay on Hands, and Arcane Ward.',
  },
  {
    title: 'Short Rest & Long Rest Hit Die Mechanics',
    detail:
      'Added /dnd rest short (rolls class Hit Die d6/d8/d10 + CON modifier) and /dnd rest long (restores full HP, Hit Dice, and class features) plus 2 bonus items: kubejs:character_folio and kubejs:healing_draught.',
  },
  {
    title: 'Verified Vanilla 1.20.1 Sound IDs & Attribute Sync',
    detail:
      'Audited all playsound IDs for Minecraft 1.20.1 (totem.use, anvil.land, experience_orb.pickup, villager.work_fletcher, raid.horn) and synced player.modifyAttribute("minecraft:generic.max_health") cleanly.',
  },
];

export const CodeExplorer: React.FC<CodeExplorerProps> = ({ onOpenSimulator }) => {
  const [selectedPath, setSelectedPath] = useState<string>(REPO_FILES[0].path);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bundleCopied, setBundleCopied] = useState<boolean>(false);

  const activeFile: RepoFileEntry = useMemo(() => {
    return REPO_FILES.find((f) => f.path === selectedPath) || REPO_FILES[0];
  }, [selectedPath]);

  const filteredLines = useMemo(() => {
    const lines = activeFile.content.split('\n');
    if (!searchQuery.trim()) {
      return lines.map((line, index) => ({ lineNumber: index + 1, text: line, matched: false }));
    }
    const q = searchQuery.toLowerCase();
    return lines
      .map((line, index) => ({
        lineNumber: index + 1,
        text: line,
        matched: line.toLowerCase().includes(q),
      }))
      .filter((item) => item.matched);
  }, [activeFile, searchQuery]);

  const handleCopyFile = async (file: RepoFileEntry) => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopiedPath(file.path);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch {
      // Fallback for restricted clipboard environments
      const textarea = document.createElement('textarea');
      textarea.value = file.content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedPath(file.path);
      setTimeout(() => setCopiedPath(null), 2000);
    }
  };

  const handleDownloadFile = (file: RepoFileEntry) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = file.path.split('/').pop() || 'script.js';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateSelfExtractingScript = (): string => {
    const parts: string[] = [
      '#!/usr/bin/env bash',
      '# Self-Extracting GitHub Repository Builder for KubeJS D&D 5e Tabletop RPG Engine',
      'set -e',
      'mkdir -p kubejs/startup_scripts kubejs/server_scripts kubejs/assets/kubejs/lang scripts',
      '',
    ];

    for (const file of REPO_FILES) {
      parts.push(`cat << 'EOF_KUBEJS_FILE' > ${file.path}`);
      parts.push(file.content);
      parts.push('EOF_KUBEJS_FILE');
      parts.push('');
    }

    parts.push('echo "All KubeJS 6 D&D 5e repository files extracted successfully!"');
    return parts.join('\n');
  };

  const handleDownloadRepoInstaller = () => {
    const scriptContent = generateSelfExtractingScript();
    const blob = new Blob([scriptContent], { type: 'text/x-sh;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'setup-kubejs-dnd5e-repo.sh';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyRepoInstaller = async () => {
    const scriptContent = generateSelfExtractingScript();
    try {
      await navigator.clipboard.writeText(scriptContent);
      setBundleCopied(true);
      setTimeout(() => setBundleCopied(false), 2000);
    } catch {
      setBundleCopied(true);
      setTimeout(() => setBundleCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Repository Summary Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Minecraft 1.20.1 Fabric</span>
            <span aria-hidden="true">·</span>
            <span>KubeJS 6</span>
            <span aria-hidden="true">·</span>
            <span>Zero Placeholders</span>
            <span aria-hidden="true">·</span>
            <span>GitHub Ready</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
            Complete KubeJS Repository Tree & Source Files
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Every script has been audited for KubeJS 6 Rhino compatibility, NBT compound persistence, and 1.20.1 vanilla sound/attribute registries. Copy individual files below or export the entire repository tree in one click.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDownloadRepoInstaller}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Repo Bundle (.sh)
          </button>
          <button
            type="button"
            onClick={handleCopyRepoInstaller}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {bundleCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Terminal className="w-4 h-4" />}
            {bundleCopied ? 'Copied Setup Script' : 'Copy One-Command Installer'}
          </button>
          <button
            type="button"
            onClick={onOpenSimulator}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Test in Live Tabletop Simulator
          </button>
        </div>
      </div>

      {/* Main Two-Column Code Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: File Tree + Audit Notes */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-amber-400" />
                Repository Files ({REPO_FILES.length})
              </h3>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {(REPO_FILES.reduce((acc, f) => acc + f.content.length, 0) / 1024).toFixed(1)} KB total
              </span>
            </div>

            <div className="space-y-1.5" role="tablist" aria-label="Repository files">
              {REPO_FILES.map((file) => {
                const isSelected = file.path === selectedPath;
                const lineCount = file.content.split('\n').length;
                return (
                  <button
                    key={file.path}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedPath(file.path)}
                    className={`w-full text-left px-3.5 py-3 rounded-lg transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'text-slate-300 hover:bg-slate-800/70 border border-transparent'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-medium truncate">{file.path}</div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate">{file.title}</div>
                    </div>
                    <span className="text-xs font-mono text-slate-400 tabular-nums shrink-0 mt-0.5">
                      {lineCount}L
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code Audit & Enhancements Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              v2.0 Architecture Enhancements
            </h3>
            <div className="divide-y divide-slate-800/80">
              {ENHANCEMENT_NOTES.map((item, idx) => (
                <div key={idx} className="py-3 first:pt-0 last:pb-0">
                  <div className="text-xs font-semibold text-slate-200">{item.title}</div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active File Source Viewer */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {/* Viewer Toolbar */}
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-950/50">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-sm font-mono font-semibold text-slate-100 truncate">
                  {activeFile.path}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{activeFile.description}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  aria-label="Filter code lines"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter lines..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 w-40"
                />
              </div>

              <button
                type="button"
                onClick={() => handleCopyFile(activeFile)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedPath === activeFile.path ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy File
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDownloadFile(activeFile)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>

          {/* Code Lines Container */}
          <div className="max-h-[680px] overflow-y-auto overflow-x-auto bg-slate-950 p-4 font-mono text-xs leading-relaxed">
            {filteredLines.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                No lines matching "{searchQuery}" in {activeFile.path}.
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </div>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <tbody>
                  {filteredLines.map((line) => (
                    <tr
                      key={line.lineNumber}
                      className={`hover:bg-slate-900/80 ${
                        line.matched ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <td className="select-none pr-4 text-right text-slate-600 tabular-nums w-12 align-top">
                        {line.lineNumber}
                      </td>
                      <td className="text-slate-200 whitespace-pre pr-4">{line.text || ' '}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
