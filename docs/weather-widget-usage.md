# Weather Widget Usage Guide

The `WeatherWidget` component has been updated to support location-based weather data. Here's how to use it:

## Props

```typescript
interface WeatherWidgetProps {
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  className?: string;
}
```

## Usage Examples

### 1. Default Usage (User's Location)
```tsx
// Uses user's current location via geolocation API
<WeatherWidget />
```

### 2. Specific Location (Project/Site)
```tsx
// Shows weather for a specific location
<WeatherWidget 
  location={{
    latitude: 40.7128,
    longitude: -74.0060,
    address: "New York, NY"
  }}
/>
```

### 3. With Custom Styling
```tsx
<WeatherWidget 
  location={{
    latitude: 34.0522,
    longitude: -118.2437,
    address: "Los Angeles, CA"
  }}
  className="lg:col-span-1"
/>
```

## Implementation Details

- **Geolocation Optimization**: When a location prop is provided, the widget skips geolocation API calls entirely
- **Cache Management**: Geolocation results are cached for 5 minutes to reduce API calls
- **Fallback Behavior**: If geolocation fails, defaults to Chicago coordinates
- **Visual Context**: Shows the location address when provided for better user context

## Project Integration

The widget automatically detects project location format:
- **Coordinate format**: "Lat: 40.7128, Lon: -74.0060" → Uses these coordinates
- **Address format**: "123 Main St, City, ST" → Falls back to user location (geocoding not yet implemented)

## Performance Benefits

1. **Reduced API Calls**: No geolocation when location is provided
2. **Faster Load Times**: Immediate weather fetch for known locations
3. **Better UX**: Shows relevant weather for the actual work site, not user's home
