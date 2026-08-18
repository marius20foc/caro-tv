/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Culori bazate pe CSS variables -> tema dark/light functioneaza
        // in toate componentele, inclusiv cu modificatori de opacitate (/xx).
        void: 'rgb(var(--c-void) / <alpha-value>)',
        void2: 'rgb(var(--c-void2) / <alpha-value>)',
        void3: 'rgb(var(--c-void3) / <alpha-value>)',
        neon: {
          cyan: 'rgb(var(--c-cyan) / <alpha-value>)',
          violet: 'rgb(var(--c-violet) / <alpha-value>)',
          pink: 'rgb(var(--c-pink) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          muted: 'rgb(var(--c-ink-muted) / <alpha-value>)',
          faint: 'rgb(var(--c-ink-faint) / <alpha-value>)',
        },
      },
      fontFamily: {
        // Chakra Petch: font tehnologic cu suport COMPLET pentru diacriticele
        // limbii romane (ș ț ă â î) – alias pastrat ca „orbitron” pentru
        // compatibilitate cu toate componentele existente.
        orbitron: ['"Chakra Petch"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        space: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 14px rgba(76, 201, 230, 0.22)',
        'neon-violet': '0 0 14px rgba(122, 106, 216, 0.25)',
        'neon-pink': '0 0 14px rgba(217, 106, 165, 0.22)',
        'glow-sm': '0 0 8px rgba(76, 201, 230, 0.15)',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 6px rgba(0,240,255,0.6))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 2px rgba(0,240,255,0.2))' },
        },
        flicker: {
          '0%, 19%, 21%, 23%, 80%, 100%': { opacity: '1' },
          '20%, 22%': { opacity: '0.4' },
        },
        borderFlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        gridScroll: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 40px' },
        },
        glitchShift: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 1px)' },
          '40%': { transform: 'translate(2px, -1px)' },
          '60%': { transform: 'translate(-1px, -2px)' },
          '80%': { transform: 'translate(1px, 2px)' },
          '100%': { transform: 'translate(0)' },
        },
        aurora: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.2)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        revealUp: {
          '0%': { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shine: {
          '0%': { transform: 'translateX(-120%) skewX(-20deg)' },
          '100%': { transform: 'translateX(240%) skewX(-20deg)' },
        },
      },
      animation: {
        scan: 'scan 6s linear infinite',
        floaty: 'floaty 6s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2.4s ease-in-out infinite',
        flicker: 'flicker 4s linear infinite',
        borderFlow: 'borderFlow 3s linear infinite',
        gridScroll: 'gridScroll 12s linear infinite',
        glitchShift: 'glitchShift 0.3s steps(2) infinite',
        aurora: 'aurora 26s linear infinite',
        auroraSlow: 'aurora 40s linear infinite reverse',
        ticker: 'ticker 32s linear infinite',
        blink: 'blink 1.1s step-end infinite',
        orbit: 'orbit 24s linear infinite',
      },
    },
  },
  plugins: [],
};
