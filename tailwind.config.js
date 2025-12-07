/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F4F6F8',      // UPDATED: Standard professional dashboard background (cool gray/white)
        beige: '#EFE5D5',      
        primary: '#FF6D1F',    
        'primary-hover': '#E55C15',
        dark: '#212B36',       // UPDATED: Professional dark text
        surface: '#FFFFFF',
        secondary: '#637381',  // Muted text color
        border: '#E0E0E0',     // Light borders
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)', // Professional "Card" shadow
        'card': '0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)',
      },
      borderRadius: {
        'xl': '16px', // Consistent rounded corners
      }
    },
  },
  plugins: [],
}