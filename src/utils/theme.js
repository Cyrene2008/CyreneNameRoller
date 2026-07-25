const DEFAULT_ACCENT = '#ea5ec1'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function normalizeHex(value, fallback = DEFAULT_ACCENT) {
  const source = String(value || '').trim()
  const rgbMatch = source.match(/^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i)
    || source.match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/)
  if (rgbMatch) {
    const channels = rgbMatch.slice(1).map(Number)
    if (channels.every(channel => channel >= 0 && channel <= 255)) {
      return rgbToHex({ r: channels[0], g: channels[1], b: channels[2] })
    }
    return fallback
  }
  const raw = source.replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw.split('').map(char => char + char).join('').toLowerCase()}`
  }
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw.toLowerCase()}`
  return fallback
}

function hexToRgb(value) {
  const hex = normalizeHex(value).slice(1)
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  }
}

function rgbToHex({ r, g, b }) {
  const channel = value => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0')
  return `#${channel(r)}${channel(g)}${channel(b)}`
}

function rgbToHsl({ r, g, b }) {
  const channels = [r, g, b].map(value => value / 255)
  const max = Math.max(...channels)
  const min = Math.min(...channels)
  const lightness = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: lightness }
  const delta = max - min
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)
  let hue
  if (max === channels[0]) hue = (channels[1] - channels[2]) / delta + (channels[1] < channels[2] ? 6 : 0)
  else if (max === channels[1]) hue = (channels[2] - channels[0]) / delta + 2
  else hue = (channels[0] - channels[1]) / delta + 4
  return { h: hue * 60, s: saturation, l: lightness }
}

function hslToHex({ h, s, l }) {
  const hue = ((h % 360) + 360) % 360
  const saturation = clamp(s, 0, 1)
  const lightness = clamp(l, 0, 1)
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const segment = hue / 60
  const x = chroma * (1 - Math.abs((segment % 2) - 1))
  const values = segment < 1 ? [chroma, x, 0]
    : segment < 2 ? [x, chroma, 0]
      : segment < 3 ? [0, chroma, x]
        : segment < 4 ? [0, x, chroma]
          : segment < 5 ? [x, 0, chroma]
            : [chroma, 0, x]
  const match = lightness - chroma / 2
  return rgbToHex({ r: (values[0] + match) * 255, g: (values[1] + match) * 255, b: (values[2] + match) * 255 })
}

function luminance(value) {
  const { r, g, b } = hexToRgb(value)
  return [r, g, b]
    .map(channel => channel / 255)
    .map(channel => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0)
}

function rgba(value, alpha) {
  const { r, g, b } = hexToRgb(value)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function tone(base, saturation, lightness) {
  return hslToHex({ h: base.h, s: saturation, l: lightness })
}

export function createThemeVariables(accentValue, dark = false, neutral = false) {
  const input = normalizeHex(accentValue)
  const base = rgbToHsl(hexToRgb(input))
  const accentSaturation = clamp(base.s, 0.48, 0.9)
  const accent = tone(base, accentSaturation, dark ? clamp(base.l, 0.6, 0.72) : clamp(base.l, 0.38, 0.56))
  const quietSaturation = neutral ? 0.015 : clamp(base.s * 0.24, 0.1, 0.26)
  const surfaceHue = { ...base, s: quietSaturation }
  const textOnAccent = luminance(accent) > 0.42 ? '#111111' : '#ffffff'

  if (dark) {
    return {
      '--accent': accent,
      '--accent-light': tone(base, clamp(base.s, 0.42, 0.86), 0.78),
      '--accent-dark': tone(base, clamp(base.s, 0.5, 0.9), 0.46),
      '--accent-hover': tone(base, clamp(base.s, 0.48, 0.88), 0.68),
      '--accent-200': rgba(accent, 0.28),
      '--accent-50': rgba(accent, 0.14),
      '--text-on-accent': textOnAccent,
      '--bg-base': tone(surfaceHue, quietSaturation, neutral ? 0.125 : 0.105),
      '--bg-card': rgba(tone(surfaceHue, quietSaturation, 0.155), 0.84),
      '--bg-card-solid': tone(surfaceHue, quietSaturation, 0.16),
      '--bg-hover': tone(surfaceHue, quietSaturation, 0.205),
      '--bg-acrylic': rgba(tone(surfaceHue, quietSaturation, 0.125), 0.9),
      '--bg-mica': tone(surfaceHue, quietSaturation, neutral ? 0.125 : 0.115),
      '--text-primary': neutral ? '#f5f5f5' : tone(base, clamp(base.s * 0.2, 0.08, 0.2), 0.94),
      '--text-secondary': neutral ? '#d2d2d2' : tone(base, clamp(base.s * 0.24, 0.1, 0.24), 0.76),
      '--text-muted': neutral ? '#9b9b9b' : tone(base, clamp(base.s * 0.2, 0.08, 0.2), 0.58),
      '--border-default': neutral ? 'rgba(255, 255, 255, 0.12)' : rgba(accent, 0.2),
      '--border-subtle': neutral ? 'rgba(255, 255, 255, 0.07)' : rgba(accent, 0.11),
      '--border-strong': neutral ? 'rgba(255, 255, 255, 0.2)' : rgba(accent, 0.34),
      '--shadow-2': '0 1px 2px rgba(0, 0, 0, 0.28)',
      '--shadow-4': `0 2px 4px rgba(0, 0, 0, 0.2), 0 8px 16px ${neutral ? 'rgba(0, 0, 0, 0.22)' : rgba(accent, 0.08)}`,
      '--shadow-8': `0 4px 8px rgba(0, 0, 0, 0.22), 0 12px 24px ${neutral ? 'rgba(0, 0, 0, 0.3)' : rgba(accent, 0.12)}`,
      '--shadow-16': '0 8px 20px rgba(0, 0, 0, 0.38)'
    }
  }

  return {
    '--accent': accent,
    '--accent-light': tone(base, clamp(base.s, 0.38, 0.82), 0.72),
    '--accent-dark': tone(base, clamp(base.s, 0.5, 0.92), 0.34),
    '--accent-hover': tone(base, clamp(base.s, 0.5, 0.9), clamp(base.l - 0.07, 0.3, 0.48)),
    '--accent-200': rgba(accent, 0.22),
    '--accent-50': rgba(accent, 0.09),
    '--text-on-accent': textOnAccent,
    '--bg-base': tone(surfaceHue, quietSaturation, neutral ? 0.97 : 0.965),
    '--bg-card': rgba(tone(surfaceHue, quietSaturation, 0.99), 0.84),
    '--bg-card-solid': tone(surfaceHue, quietSaturation, 0.99),
    '--bg-hover': tone(surfaceHue, quietSaturation, neutral ? 0.94 : 0.925),
    '--bg-acrylic': rgba(tone(surfaceHue, quietSaturation, 0.98), 0.9),
    '--bg-mica': tone(surfaceHue, quietSaturation, neutral ? 0.97 : 0.955),
    '--text-primary': neutral ? '#1b1b1b' : tone(base, clamp(base.s * 0.42, 0.18, 0.42), 0.17),
    '--text-secondary': neutral ? '#454545' : tone(base, clamp(base.s * 0.34, 0.14, 0.34), 0.32),
    '--text-muted': neutral ? '#747474' : tone(base, clamp(base.s * 0.28, 0.12, 0.28), 0.51),
    '--border-default': neutral ? 'rgba(0, 0, 0, 0.14)' : rgba(accent, 0.18),
    '--border-subtle': neutral ? 'rgba(0, 0, 0, 0.08)' : rgba(accent, 0.1),
    '--border-strong': neutral ? 'rgba(0, 0, 0, 0.22)' : rgba(accent, 0.3),
    '--shadow-2': '0 1px 2px rgba(0, 0, 0, 0.08)',
    '--shadow-4': `0 2px 4px rgba(0, 0, 0, 0.05), 0 8px 16px ${neutral ? 'rgba(0, 0, 0, 0.08)' : rgba(accent, 0.08)}`,
    '--shadow-8': `0 4px 8px rgba(0, 0, 0, 0.07), 0 12px 24px ${neutral ? 'rgba(0, 0, 0, 0.12)' : rgba(accent, 0.12)}`,
    '--shadow-16': '0 8px 20px rgba(0, 0, 0, 0.16)'
  }
}

export { DEFAULT_ACCENT }
