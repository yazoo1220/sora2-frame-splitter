import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../ui/card'

describe('Card Component', () => {
  test('renders card with content', () => {
    render(
      <Card>
        <div>Card content</div>
      </Card>
    )
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  test('renders card with proper styling', () => {
    render(<Card>Content</Card>)
    const card = screen.getByText('Content').closest('[data-slot="card"]')
    expect(card).toHaveClass('rounded-xl')
  })

  test('renders CardHeader with title', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
      </Card>
    )
    expect(screen.getByText('Title')).toBeInTheDocument()
  })

  test('renders CardHeader with description', () => {
    render(
      <Card>
        <CardHeader>
          <CardDescription>Description</CardDescription>
        </CardHeader>
      </Card>
    )
    expect(screen.getByText('Description')).toBeInTheDocument()
  })

  test('renders CardContent', () => {
    render(
      <Card>
        <CardContent>Content text</CardContent>
      </Card>
    )
    expect(screen.getByText('Content text')).toBeInTheDocument()
  })

  test('renders CardFooter', () => {
    render(
      <Card>
        <CardFooter>Footer text</CardFooter>
      </Card>
    )
    expect(screen.getByText('Footer text')).toBeInTheDocument()
  })

  test('renders complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    )
    
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })
})

