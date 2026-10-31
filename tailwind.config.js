/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#052442', 50: '#eef3f9', 100: '#d9e4f0', 200: '#b3c9e0', 300: '#7fa3c7', 400: '#4d7aa8', 500: '#24558A', 600: '#1b4373', 700: '#142D50', 800: '#0a3159', 900: '#052442' },
        gold: { DEFAULT: '#C9962B', 50: '#fdf8ec', 100: '#f9edcc', 200: '#f2da9b', 300: '#e6c164', 400: '#d9aa3e', 500: '#C9962B', 600: '#a97a1f', 700: '#865d1a' },
        brand: { blue: '#0982F9', green: '#088E4C', bg: '#F3F6FA', ink: '#252A28' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(5,36,66,.06), 0 4px 16px rgba(5,36,66,.06)',
        lift: '0 8px 30px rgba(5,36,66,.14)',
      },
    },
  },
  plugins: [],
}
