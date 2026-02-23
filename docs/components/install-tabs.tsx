'use client';

import { useState } from 'react';

const managers = ['bun', 'npm', 'pnpm', 'yarn'] as const;
type Manager = (typeof managers)[number];

const commands: Record<Manager, string> = {
  bun: 'bun add @puiusabin/fumi',
  npm: 'npm install @puiusabin/fumi',
  pnpm: 'pnpm add @puiusabin/fumi',
  yarn: 'yarn add @puiusabin/fumi',
};

export function InstallTabs() {
  const [active, setActive] = useState<Manager>('bun');

  return (
    <div className="rounded-lg border border-fd-border bg-fd-card overflow-hidden text-sm font-mono w-full max-w-sm">
      <div className="flex border-b border-fd-border">
        {managers.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setActive(m)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              active === m
                ? 'text-fd-primary border-b-2 border-fd-primary -mb-px'
                : 'text-fd-muted-foreground hover:text-fd-foreground'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 px-4 py-3 text-fd-foreground">
        <span className="text-fd-muted-foreground select-none">$</span>
        <span>{commands[active]}</span>
      </div>
    </div>
  );
}
