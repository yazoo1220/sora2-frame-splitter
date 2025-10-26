import { cn } from '../utils'

describe('cn function', () => {
  test('merges multiple class names', () => {
    const result = cn('text-blue-500', 'font-bold')
    expect(result).toBe('text-blue-500 font-bold')
  })

  test('handles conditional class names', () => {
    const isActive = true
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toContain('base-class')
    expect(result).toContain('active-class')
  })

  test('handles undefined and null values', () => {
    const result = cn('base-class', undefined, null, 'valid-class')
    expect(result).toContain('base-class')
    expect(result).toContain('valid-class')
    expect(result).not.toContain('undefined')
    expect(result).not.toContain('null')
  })

  test('resolves Tailwind conflicts (later value wins)', () => {
    const result = cn('p-4', 'p-8')
    expect(result).toBe('p-8')
  })

  test('handles empty arrays and strings', () => {
    const result = cn('', [], 'valid-class')
    expect(result).toBe('valid-class')
  })

  test('handles arrays of class names', () => {
    const result = cn(['class1', 'class2'], 'class3')
    expect(result).toContain('class1')
    expect(result).toContain('class2')
    expect(result).toContain('class3')
  })

  test('handles objects with conditional classes', () => {
    const result = cn({
      'text-red-500': true,
      'text-blue-500': false,
    })
    expect(result).toBe('text-red-500')
  })

  test('handles complex combinations', () => {
    const isActive = true
    const isDisabled = false
    const result = cn(
      'base-class',
      isActive && 'active-class',
      isDisabled && 'disabled-class',
      'additional-class'
    )
    expect(result).toContain('base-class')
    expect(result).toContain('active-class')
    expect(result).toContain('additional-class')
    expect(result).not.toContain('disabled-class')
  })
})

