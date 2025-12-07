/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F4F6F8',      // UPDATED: Cleaner, professional background
        beige: '#EFE5D5',
        primary: '#FF6D1F',    // Your Brand Orange
        'primary-hover': '#E55C15',
        dark: '#212B36',       // Professional Dark Text
        secondary: '#637381',  // Muted Text
        success: '#22C55E',
        danger: '#FF5630',
        warning: '#FFAB00',
        info: '#00B8D9',
        surface: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)',
        'dropdown': '0 0 2px 0 rgba(145, 158, 171, 0.24), -20px 20px 40px -4px rgba(145, 158, 171, 0.24)',
      },
      borderRadius: {
        'xl': '16px',
      }
    },
  },
  plugins: [],
}