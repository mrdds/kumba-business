/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB', // Blue 600
          dark: '#1E40AF',    // Blue 800
          light: '#60A5FA',   // Blue 400
        },
        secondary: {
          DEFAULT: '#F59E0B', // Amber 500
          dark: '#D97706',    // Amber 600
        },
        success: '#10B981',   // Emerald 500
        danger: '#EF4444',    // Red 500
        background: '#F8FAFC', // Slate 50
        surface: '#FFFFFF',
      },
    },
  },
  plugins: [],
}
