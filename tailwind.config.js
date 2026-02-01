/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
        // ARES Brand Colors
        ares: {
          red: {
            50: '#FEF2F2',
            100: '#FEE2E2',
            200: '#FECACA',
            300: '#FCA5A5',
            400: '#F87171',
            500: '#EF4444',
            600: '#DC2626',  // Primary Brand Color
            700: '#B91C1C',
            800: '#991B1B',
            900: '#7F1D1D',
            950: '#450A0A',
          },
          dark: {
            950: '#0A0A0A',  // Page background (pure black)
            900: '#0F0F0F',  // Header/navbar
            850: '#171717',  // Card background
            800: '#1F1F1F',  // Elevated surfaces
            750: '#262626',  // Input backgrounds
            700: '#2E2E2E',  // Borders
            600: '#404040',
            500: '#525252',
            400: '#6B6B6B',  // Tertiary text
            300: '#A3A3A3',  // Secondary text
          },
          // Accent colors for agents
          cyan: '#06B6D4',    // AI agent indicators
          gold: '#D4AF37',    // Premium features
        },
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
        // ARES custom animations
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(220, 38, 38, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(220, 38, 38, 0.6)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-status': {
          '0%, 100%': { 
            opacity: '1', 
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.7)'
          },
          '50%': { 
            opacity: '0.8', 
            transform: 'scale(1.1)',
            boxShadow: '0 0 0 8px rgba(34, 197, 94, 0)'
          },
        },
        'pulse-busy': {
          '0%, 100%': { 
            opacity: '1', 
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(249, 115, 22, 0.7)'
          },
          '50%': { 
            opacity: '0.7', 
            transform: 'scale(1.2)',
            boxShadow: '0 0 0 10px rgba(249, 115, 22, 0)'
          },
        },
        'pulse-critical': {
          '0%, 100%': { 
            opacity: '1',
            boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.7)'
          },
          '50%': { 
            opacity: '0.6',
            boxShadow: '0 0 0 12px rgba(220, 38, 38, 0)'
          },
        },
        'blink': {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        'typing': {
          '0%, 60%, 100%': { opacity: '0' },
          '30%': { opacity: '1' },
        },
  		},
   		animation: {
   			'accordion-down': 'accordion-down 0.2s ease-out',
   			'accordion-up': 'accordion-up 0.2s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'pulse-status': 'pulse-status 2s ease-in-out infinite',
        'pulse-busy': 'pulse-busy 1.5s ease-in-out infinite',
        'pulse-critical': 'pulse-critical 1s ease-in-out infinite',
        'blink': 'blink 1s step-end infinite',
        'typing': 'typing 1.4s infinite',
   		},
      boxShadow: {
        'glow-red': '0 0 20px rgba(220, 38, 38, 0.4)',
        'glow-red-sm': '0 0 10px rgba(220, 38, 38, 0.3)',
        'glow-red-lg': '0 0 30px rgba(220, 38, 38, 0.5)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.4)',
        'cli': '0 -4px 20px rgba(220, 38, 38, 0.3)',
        'card': '0 4px 12px rgba(0, 0, 0, 0.3)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
}
