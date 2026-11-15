import { useState } from 'react';
import { CodeExplorer } from './components/CodeExplorer';
import { TabletopSimulator } from './components/TabletopSimulator';
import { DocumentationView } from './components/DocumentationView';
import { REPO_FILES } from './engine/repoFiles';

type ActiveSection = 'repository' | 'simulator' | 'documentation';

export default function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('repository');

  const handleDownloadAllScript = () => {
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
    parts.push('echo "Extracted KubeJS D&D 5e repository files successfully!"');
    const blob = new Blob([parts.join('\n')], { type: 'text/x-sh;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'setup-kubejs-dnd5e-repo.sh';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col">
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800/90 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('repository');
          }}
          className="text-lg font-bold tracking-tight text-slate-100 font-display whitespace-nowrap shrink-0"
        >
          KubeJS D&amp;D 5e Engine
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav aria-label="Primary Navigation" className="flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            type="button"
            onClick={() => setActiveSection('repository')}
            className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeSection === 'repository'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-300'
            }`}
          >
            Repository Code
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('simulator')}
            className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeSection === 'simulator'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-300'
            }`}
          >
            Tabletop Simulator
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('documentation')}
            className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeSection === 'documentation'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-300'
            }`}
          >
            GitHub &amp; Docs
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleDownloadAllScript}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Export GitHub Bundle
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-8">
        {activeSection === 'repository' && (
          <CodeExplorer onOpenSimulator={() => setActiveSection('simulator')} />
        )}
        {activeSection === 'simulator' && <TabletopSimulator />}
        {activeSection === 'documentation' && <DocumentationView />}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-6 text-xs text-slate-400">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            KubeJS D&amp;D 5e Tabletop RPG Engine · Built for Minecraft 1.20.1 Fabric (KubeJS 6)
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveSection('repository')}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Source Scripts
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveSection('simulator')}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Interactive Testbed
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveSection('documentation')}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Command Reference
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
