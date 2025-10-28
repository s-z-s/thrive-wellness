tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#20df80",
        "background-light": "#f6f8f7",
        "background-dark": "#112119",
        "aegis-bg": "#FAFAF8",
        "aegis-primary": "#78a193",
        "aegis-secondary": "#f2a28c",
        "aegis-text": "#333333"
      },
      fontFamily: {
        "display": ["Epilogue", "sans-serif"],
        "quote": ["Lora", "serif"]
      },
      borderRadius: {"DEFAULT": "0.75rem", "lg": "1rem", "xl": "1.5rem", "full": "9999px"},
      keyframes: {
        happyWiggle: {
          '0%, 100%': { transform: 'rotate(-2deg) scale(1)' },
          '25%': { transform: 'rotate(2deg) scale(1.02)' },
          '50%': { transform: 'rotate(-1deg) scale(1)' },
          '75%': { transform: 'rotate(1deg) scale(1.02)' },
        },
        growAndBounce: {
          '0%': { transform: 'scale(0.8)', opacity: '0.5' },
          '70%': { transform: 'scale(1.05)', opacity: '1' },
          '85%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        blink: {
          '0%, 80%, 100%': { transform: 'scaleY(1)' },
          '82%': { transform: 'scaleY(0.1)' },
        },
      },
      animation: {
        happyWiggle: 'happyWiggle 4s ease-in-out infinite',
        growAndBounce: 'growAndBounce 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        blink: 'blink 5s ease-in-out infinite',
      }
    },
  },
}