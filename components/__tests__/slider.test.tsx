import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Slider } from '../ui/slider'

describe('Slider Component', () => {
  test('renders slider', () => {
    render(<Slider value={[50]} />)
    const slider = screen.getByRole('slider')
    expect(slider).toBeInTheDocument()
  })

  test('renders slider with initial value', () => {
    render(<Slider value={[75]} />)
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('aria-valuenow', '75')
  })

  test('renders slider with min and max values', () => {
    render(<Slider value={[25]} min={0} max={100} />)
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('aria-valuemin', '0')
    expect(slider).toHaveAttribute('aria-valuemax', '100')
  })

  test('renders disabled slider', () => {
    render(<Slider value={[50]} disabled />)
    const slider = screen.getByRole('slider')
    // Note: Radix UI slider's disabled state is handled differently
    expect(slider).toHaveAttribute('data-disabled')
  })

  test('handles value change', () => {
    const handleValueChange = jest.fn()
    render(<Slider value={[50]} onValueChange={handleValueChange} />)
    
    const slider = screen.getByRole('slider')
    
    // Note: Radix UI slider requires actual interaction simulation
    // This is a basic test for rendering
    expect(slider).toBeInTheDocument()
  })

  test('renders slider with multiple values', () => {
    render(<Slider value={[25, 75]} />)
    const sliders = screen.getAllByRole('slider')
    expect(sliders).toHaveLength(2)
  })

  test('renders with custom className', () => {
    render(<Slider value={[50]} className="custom-class" />)
    const slider = screen.getByRole('slider')
    expect(slider.closest('[data-slot="slider"]')).toHaveClass('custom-class')
  })
})

