import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        gold: 'var(--color-gold)',
        brass: 'var(--color-brass)',
        espresso: 'var(--color-espresso)',
        velvet: 'var(--color-velvet)',
        sage: 'var(--color-sage)',
      },
    },
  },
  plugins: [],
};
export default config;
