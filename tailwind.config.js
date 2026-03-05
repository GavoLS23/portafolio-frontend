/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Teal interactivo — CTA, links, estados activos
        accent: {
          300: '#b5e8c3',
          400: '#7ec8b8',
          500: '#65b8a6',
          600: '#4a9a8a',
          700: '#377870',
        },
        // Superficies — púrpura oscuro
        surface: {
          900: '#1f192f',
          800: '#261e3a',
          700: '#2e2748',
          600: '#3a3158',
          500: '#4b3e6e',
        },
        // Azul verdoso — superficies elevadas, bordes, badges
        ocean: {
          900: '#1a3b47',
          800: '#22526a',
          700: '#2d6073',
          600: '#3d7485',
          500: '#4d8898',
        },
        // Crema — texto primario
        cream: {
          900: '#f0f7da',
          800: '#dfebc0',
          700: '#cad9a5',
          600: '#b2c98b',
        },
      },
      fontFamily: {
        // Plus Jakarta Sans: UI/body — reemplaza Syne
        sans:  ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        // Instrument Serif: display/hero — reemplaza Lora
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        // JetBrains Mono: etiquetas técnicas, números de sección
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in':    'fadeIn 0.5s ease-out both',
        'slide-up':   'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-left': 'slideLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'spin-slow':  'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(24px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        slideLeft: {
          '0%':   { transform: 'translateX(24px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',     opacity: '1' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
