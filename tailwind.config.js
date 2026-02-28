/** @type {import('tailwindcss').Config} */
export default {
  // Tell Tailwind which files contain class names so it can remove unused styles in production
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Custom animation for the lower-third sliding in
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(2rem)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(2rem)', opacity: '0' },
        },
      },
      animation: {
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.4s ease-in forwards',
      },
    },
  },
  plugins: [],
}
