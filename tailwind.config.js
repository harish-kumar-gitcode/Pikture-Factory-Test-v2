/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#111111',
        secondary: '#2D2D2D',
        gold: '#C8A45D',
        goldsoft: '#E6D3AC',
        bglight: '#F7F7F7',
        border: '#EAEAEA',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        head: ['var(--font-playfair)', 'serif'],
        body: ['var(--font-poppins)', 'sans-serif'],
      },
      borderRadius: {
        pf: '14px',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(17,17,17,0.06)',
        lift: '0 20px 40px rgba(17,17,17,0.12)',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(24px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        toastIn: { '0%': { opacity: 0, transform: 'translateX(40px)' }, '100%': { opacity: 1, transform: 'translateX(0)' } },
      },
      animation: {
        fadeUp: 'fadeUp .7s cubic-bezier(.22,.61,.36,1) both',
        toastIn: 'toastIn .3s ease both',
      },
    },
  },
  plugins: [],
};
