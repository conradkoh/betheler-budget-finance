# Presentation Module

A simple React component library for creating slide presentations.

## Components

- **PresentationContainer**: Root component with `totalSlides` and `presentationKey` props
- **PresentationControls**: Navigation UI component
- **Slide**: Individual slide with `index` and optional `className` props

## Basic Usage

```tsx
export default function MyPresentation() {
  const presentationKey = 'unique-presentation-id';

  return (
    <PresentationContainer totalSlides={5} presentationKey={presentationKey}>
      <PresentationControls />
      
      <Slide index={1} className="text-center">
        <h1 className="text-6xl font-bold">Title Slide</h1>
      </Slide>
      
      <Slide index={2}>
        <h2 className="text-4xl font-semibold">Content Slide</h2>
        <p className="text-2xl">Your content here...</p>
      </Slide>
    </PresentationContainer>
  );
}
```
