/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: 'var(--color-brand-red)',
          orange: 'var(--color-brand-orange)',
          yellow: 'var(--color-brand-yellow)',
          green: 'var(--color-brand-green)',
          blue: 'var(--color-brand-blue)',
          indigo: 'var(--color-brand-indigo)',
          violet: 'var(--color-brand-violet)',
          purple: 'var(--color-brand-purple)',
          pink: 'var(--color-brand-pink)',
        },
        surface: {
          glass: {
            heavy: 'var(--surface-glass-heavy)',
            medium: 'var(--surface-glass-medium)',
            light: 'var(--surface-glass-light)',
          }
        },
        border: {
          glass: {
            subtle: 'var(--border-glass-subtle)',
            highlight: 'var(--border-glass-highlight)',
          }
        }
      },
      borderRadius: {
        bento: 'var(--radius-bento)',
        button: 'var(--radius-button)',
      }
    },
  },
  plugins: [],
}
