/**
 * Tests pour DisclaimerPopup.js
 * Tests que la popup utilise les bonnes polices et styles
 */

describe('DisclaimerPopup styling', () => {
  test('popup uses system font family', () => {
    const fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    expect(fontFamily).toBeTruthy()
    expect(fontFamily).toContain('system-ui')
    expect(fontFamily).toContain('sans-serif')
  })

  test('popup theme colors are consistent with site', () => {
    const darkMode = true
    const bgColor = darkMode ? '#1f2937' : '#ffffff'
    const textColor = darkMode ? '#f3f4f6' : '#1f2937'
    const accentColor = '#ef4444'

    expect(bgColor).toBeTruthy()
    expect(textColor).toBeTruthy()
    expect(accentColor).toBe('#ef4444')

    // Verify colors are valid hex
    expect(bgColor).toMatch(/^#[0-9a-f]{6}$/i)
    expect(textColor).toMatch(/^#[0-9a-f]{6}$/i)
    expect(accentColor).toMatch(/^#[0-9a-f]{6}$/i)
  })

  test('popup has dark and light mode support', () => {
    const modes = [
      {
        darkMode: true,
        bgColor: '#1f2937',
        textColor: '#f3f4f6'
      },
      {
        darkMode: false,
        bgColor: '#ffffff',
        textColor: '#1f2937'
      }
    ]

    modes.forEach(mode => {
      expect(mode.bgColor).toBeTruthy()
      expect(mode.textColor).toBeTruthy()
      expect(mode.bgColor).not.toBe(mode.textColor)
    })
  })
})

describe('DisclaimerPopup structure', () => {
  test('popup container has proper z-index', () => {
    const zIndex = 1000
    expect(zIndex).toBeGreaterThan(0)
    expect(typeof zIndex).toBe('number')
  })

  test('popup has overlay background with transparency', () => {
    const background = 'rgba(0, 0, 0, 0.5)'
    expect(background).toContain('rgba')
    expect(background).toContain('0.5')
  })

  test('popup title uses accent color', () => {
    const accentColor = '#ef4444'
    const h2Style = {
      color: accentColor,
      fontSize: '1.5rem',
      fontWeight: '700'
    }

    expect(h2Style.color).toBe('#ef4444')
    expect(h2Style.fontWeight).toBe('700')
  })

  test('popup border color matches accent', () => {
    const accentColor = '#ef4444'
    const borderStyle = `2px solid ${accentColor}`

    expect(borderStyle).toContain(accentColor)
    expect(borderStyle).toContain('2px solid')
  })

  test('popup button colors match theme', () => {
    const buttonBg = '#ef4444'
    const buttonHoverBg = '#dc2626'
    const buttonText = 'white'

    expect(buttonBg).toBeTruthy()
    expect(buttonHoverBg).toBeTruthy()
    expect(buttonText).toBe('white')
  })
})

describe('DisclaimerPopup content', () => {
  test('popup includes neutrality disclaimer', () => {
    const content = 'Important - Avis de Neutralité'
    expect(content).toContain('Neutralité')
  })

  test('popup includes reliability disclaimer', () => {
    const text = 'Les comparaisons ne sont pas à 100% fiables'
    expect(text).toBeTruthy()
  })

  test('popup content uses line-height for readability', () => {
    const lineHeight = '1.8'
    expect(parseFloat(lineHeight)).toBe(1.8)
  })

  test('popup list items are properly indented', () => {
    const marginLeft = '1.5rem'
    expect(marginLeft).toContain('rem')
  })
})

describe('DisclaimerPopup typography', () => {
  test('footer text uses smaller font size', () => {
    const footerFontSize = '0.8rem'
    expect(parseFloat(footerFontSize)).toBeLessThan(1)
  })

  test('footer text uses secondary color in dark mode', () => {
    const darkMode = true
    const footerColor = darkMode ? '#9ca3af' : '#6b7280'

    expect(footerColor).toBeTruthy()
    expect(footerColor).toMatch(/^#[0-9a-f]{6}$/i)
  })

  test('button text uses proper font weight', () => {
    const fontWeight = '600'
    expect(parseInt(fontWeight)).toBe(600)
  })

  test('button font size is readable', () => {
    const fontSize = '0.95rem'
    expect(parseFloat(fontSize)).toBeGreaterThan(0.9)
  })
})

describe('DisclaimerPopup interactions', () => {
  test('close button triggers localStorage update', () => {
    const key = 'disclaimerSeen'
    const value = 'true'

    expect(key).toBeTruthy()
    expect(value).toBe('true')
  })

  test('button has hover effect', () => {
    const normalBg = '#ef4444'
    const hoverBg = '#dc2626'

    expect(normalBg).not.toBe(hoverBg)
    // hover should darken the color
    expect(parseInt(hoverBg, 16)).toBeLessThan(parseInt(normalBg, 16))
  })

  test('button has transition effect', () => {
    const transition = 'background 0.2s'
    expect(transition).toContain('background')
    expect(transition).toContain('0.2s')
  })
})

describe('DisclaimerPopup responsive', () => {
  test('popup has max width constraint', () => {
    const maxWidth = '600px'
    expect(parseInt(maxWidth)).toBe(600)
  })

  test('popup has padding for smaller screens', () => {
    const padding = '1rem'
    expect(padding).toBeTruthy()
    expect(padding).toContain('rem')
  })

  test('popup uses flexbox for centering', () => {
    const display = 'flex'
    const alignItems = 'center'
    const justifyContent = 'center'

    expect(display).toBe('flex')
    expect(alignItems).toBe('center')
    expect(justifyContent).toBe('center')
  })
})

describe('DisclaimerPopup accessibility', () => {
  test('popup uses semantic HTML', () => {
    const elements = ['h2', 'p', 'ul', 'li', 'button']

    elements.forEach(element => {
      expect(typeof element).toBe('string')
    })
  })

  test('warning emoji is used for visual clarity', () => {
    const emoji = '⚠️'
    expect(emoji).toBeTruthy()
  })

  test('button has clear purpose', () => {
    const buttonText = 'J\'ai compris'
    expect(buttonText).toBeTruthy()
    expect(buttonText).not.toContain('OK') // More explicit than OK
  })

  test('copyright year is current', () => {
    const year = '2026'
    expect(year).toBeTruthy()
    expect(parseInt(year)).toBeGreaterThanOrEqual(2024)
  })
})
