import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../ui/button'

describe('Button Component', () => {
  test('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  test('renders disabled button', () => {
    render(<Button disabled>Click me</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  test('renders button with outline variant', () => {
    render(<Button variant="outline">Click me</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border')
  })

  test('renders button with small size', () => {
    render(<Button size="sm">Click me</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-8')
  })

  test('handles click events', async () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button')
    await userEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('does not call onClick when disabled', async () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick} disabled>Click me</Button>)
    
    const button = screen.getByRole('button')
    await userEvent.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  test('renders with custom className', () => {
    render(<Button className="custom-class">Click me</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })
})

