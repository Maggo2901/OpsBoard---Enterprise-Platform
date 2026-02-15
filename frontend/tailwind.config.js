/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b1220',
        surface: '#142039',
        surfaceHighlight: '#1d2d4a',
        primary: '#5d8ef8',
        primaryHover: '#4b80f3',
        border: '#283a58',
        textPrimary: '#e7edf7', // near-white for strong contrast
        textSecondary: '#c6d2e3', // readable supporting text
        textTertiary: '#9aa9bf', // metadata and subtle text
        textMuted: '#7f8ea3', // helper text
        textPlaceholder: '#6a7890', // placeholder text on dark inputs
      },
      boxShadow: {
        'card': '0 16px 34px -22px rgba(0, 0, 0, 0.78)',
        'card-hover': '0 28px 52px -24px rgba(0, 0, 0, 0.86), 0 0 0 1px rgba(120, 154, 255, 0.08)',
        'modal': '0 34px 80px -34px rgba(0, 0, 0, 0.9)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Assuming Inter is available or fallback
      }
    },
  },
  plugins: [],
}
