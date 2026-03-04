/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        /* ── Existing Loan Debt Tool brand colors (indigo) ── */
        brand: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        /* ── Working-Papers M3 / Countable Design System ── */
        border: {
          DEFAULT:  "hsl(var(--border))",
          lighter:  "hsl(var(--border-lighter))",
          category: "hsl(var(--border-category))",
        },
        "category-accent": "hsl(var(--category-accent))",
        "category-title":  "hsl(var(--category-title))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: {
          DEFAULT:   "hsl(var(--m3-surface))",
          variant:   "hsl(var(--m3-surface-variant))",
          container: {
            lowest:  "hsl(var(--m3-surface-container-lowest))",
            low:     "hsl(var(--m3-surface-container-low))",
            DEFAULT: "hsl(var(--m3-surface-container))",
            high:    "hsl(var(--m3-surface-container-high))",
            highest: "hsl(var(--m3-surface-container-highest))",
          },
        },
        "on-surface": {
          DEFAULT: "hsl(var(--m3-on-surface))",
          variant: "hsl(var(--m3-on-surface-variant))",
        },
        "primary-container":          { DEFAULT: "hsl(var(--m3-primary-container))" },
        "on-primary-container":       { DEFAULT: "hsl(var(--m3-on-primary-container))" },
        "secondary-container":        { DEFAULT: "hsl(var(--m3-secondary-container))" },
        "on-secondary-container":     { DEFAULT: "hsl(var(--m3-on-secondary-container))" },
        error: {
          DEFAULT:   "hsl(var(--m3-error))",
          container: "hsl(var(--m3-error-container))",
        },
        outline: {
          DEFAULT: "hsl(var(--m3-outline))",
          variant: "hsl(var(--m3-outline-variant))",
        },
        sidebar: {
          bg:      "hsl(var(--sidebar-bg))",
          muted:   "hsl(var(--sidebar-muted))",
          accent:  "hsl(var(--sidebar-accent))",
          foreground: "hsl(var(--sidebar-foreground))",
        },
        dropzone: {
          bg:     "hsl(var(--dropzone-bg))",
          border: "hsl(var(--dropzone-border))",
          hover:  "hsl(var(--dropzone-hover))",
        },
        countable: {
          blue:        "hsl(var(--countable-blue))",
          "blue-light":"hsl(var(--countable-blue-light))",
          "blue-dark": "hsl(var(--countable-blue-dark))",
          teal:        "hsl(var(--countable-teal))",
          navy:        "hsl(var(--countable-navy))",
        },
      },
      borderRadius: {
        none:   '0',
        xs:     '6px',
        sm:     '8px',
        md:     '12px',
        lg:     '16px',
        xl:     '20px',
        '2xl':  '24px',
        '3xl':  '32px',
        full:   '9999px',
        button: '0.75rem',
      },
      boxShadow: {
        'elevation-1': 'var(--elevation-1)',
        'elevation-2': 'var(--elevation-2)',
        'elevation-3': 'var(--elevation-3)',
        'elevation-4': 'var(--elevation-4)',
        'elevation-5': 'var(--elevation-5)',
      },
      transitionTimingFunction: {
        'emphasized':             'cubic-bezier(0.2, 0, 0, 1)',
        'emphasized-decelerate':  'cubic-bezier(0.05, 0.7, 0.1, 1)',
        'emphasized-accelerate':  'cubic-bezier(0.3, 0, 0.8, 0.15)',
        'standard':               'cubic-bezier(0.2, 0, 0, 1)',
        'standard-decelerate':    'cubic-bezier(0, 0, 0, 1)',
        'standard-accelerate':    'cubic-bezier(0.3, 0, 1, 1)',
      },
      transitionDuration: {
        'short4':      '200ms',
        'medium2':     '300ms',
        'medium4':     '400ms',
        'long2':       '500ms',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in":  { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "scale-in": { from: { opacity: "0", transform: "scale(0.92)" }, to: { opacity: "1", transform: "scale(1)" } },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px hsl(207 71% 38% / 0.3)" },
          "50%":      { boxShadow: "0 0 20px hsl(207 71% 38% / 0.5)" },
        },
        "swing": {
          "0%":  { transform: "rotate(0deg)" },
          "15%": { transform: "rotate(12deg)" },
          "30%": { transform: "rotate(-10deg)" },
          "45%": { transform: "rotate(6deg)" },
          "60%": { transform: "rotate(-4deg)" },
          "75%": { transform: "rotate(2deg)" },
          "100%":{ transform: "rotate(0deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in":        "fade-in 0.2s ease-out",
        "slide-up":       "slide-up 0.3s ease-out",
        "scale-in":       "scale-in 0.2s ease-out",
        "pulse-glow":     "pulse-glow 2s ease-in-out infinite",
        "swing":          "swing 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
