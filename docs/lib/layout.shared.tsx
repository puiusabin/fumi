import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const gitConfig = {
  user: 'puiusabin',
  repo: 'fumi',
  branch: 'main',
};

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-2 font-semibold">
          <svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="text-fd-primary">
            <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
              fontFamily="Inter, sans-serif" fontSize="22" fontWeight="500" fill="currentColor">文</text>
          </svg>
          <span style={{ fontFamily: 'var(--font-jacques)', fontWeight: 400, fontSize: '20px' }}>fumi</span>
        </span>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
