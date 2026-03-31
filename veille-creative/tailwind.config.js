export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
      },
      colors: {
        canvas: '#0c0a09',
        ink: {
          DEFAULT: '#f0ebe4',
          muted: '#8a7e74',
          faint: '#3d3530',
        },
        gold: {
          DEFAULT: '#c9963d',
          light: '#e8b86d',
          dark: '#8a6525',
        },
        surface: {
          DEFAULT: '#141110',
          raised: '#1c1916',
          border: 'rgba(240,235,228,0.07)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'reveal': 'reveal 0.6s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        reveal: { '0%': { opacity: '0', transform: 'scale(0.98)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}
