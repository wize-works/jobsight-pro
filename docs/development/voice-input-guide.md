# Voice Input Components Guide

This guide covers how to add voice transcription capabilities to any form or input field in JobSight.

## Available Components

### 1. VoiceInputButton
A standalone voice recording button that can be placed anywhere.

```tsx
import { VoiceInputButton } from '@/components/voice-input-button';

<VoiceInputButton
  onTranscriptionComplete={(text) => {
    console.log('Transcribed text:', text);
    // Handle the transcribed text
  }}
  onTranscriptionError={(error) => {
    console.error('Voice error:', error);
  }}
  size="md"
  variant="secondary"
  tooltip="Record voice note"
/>
```

### 2. VoiceInput
An enhanced input field with built-in voice recording capability.

```tsx
import { VoiceInput } from '@/components/voice-input';

<VoiceInput
  label="Task Title"
  placeholder="Enter task title or record voice note"
  value={taskTitle}
  onChange={(e) => setTaskTitle(e.target.value)}
  onVoiceTranscription={(text) => {
    console.log('Voice input added:', text);
  }}
  voiceAppendMode="replace" // 'replace', 'append', or 'prepend'
  helperText="You can type or use voice input"
/>
```

### 3. VoiceTextarea
An enhanced textarea with built-in voice recording capability.

```tsx
import { VoiceTextarea } from '@/components/voice-textarea';

<VoiceTextarea
  label="Description"
  placeholder="Enter description or record voice note"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  onVoiceTranscription={(text) => {
    console.log('Voice input added:', text);
  }}
  voiceAppendMode="append" // 'replace', 'append', or 'prepend'
  rows={4}
  helperText="You can type or record voice notes"
/>
```

## Voice Append Modes

- **replace**: Replaces the entire field content with the transcribed text
- **append**: Adds the transcribed text to the end of existing content
- **prepend**: Adds the transcribed text to the beginning of existing content

## Usage Examples

### Adding Voice to Task Creation Form

```tsx
const [formData, setFormData] = useState({
  title: '',
  description: '',
  notes: ''
});

return (
  <form>
    <VoiceInput
      label="Task Title"
      value={formData.title}
      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
      onVoiceTranscription={(text) => {
        // Optionally enhance the transcription for titles
        const cleanTitle = text.split('.')[0]; // Take first sentence
        setFormData(prev => ({ ...prev, title: cleanTitle }));
      }}
      voiceAppendMode="replace"
    />
    
    <VoiceTextarea
      label="Description"
      value={formData.description}
      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
      voiceAppendMode="append"
      rows={4}
    />
    
    <VoiceTextarea
      label="Additional Notes"
      value={formData.notes}
      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
      voiceAppendMode="append"
      rows={3}
    />
  </form>
);
```

### Adding Voice to Project Forms

```tsx
<VoiceInput
  label="Project Name"
  value={projectName}
  onChange={(e) => setProjectName(e.target.value)}
  voiceAppendMode="replace"
  helperText="Speak the project name clearly"
/>

<VoiceTextarea
  label="Project Description"
  value={projectDescription}
  onChange={(e) => setProjectDescription(e.target.value)}
  voiceAppendMode="append"
  rows={6}
  helperText="Describe the project scope, goals, and requirements"
/>
```

### Adding Voice to Search/Query Fields

```tsx
<VoiceInput
  placeholder="Search projects, tasks, or ask a question..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onVoiceTranscription={(text) => {
    // Automatically trigger search after voice input
    handleSearch(text);
  }}
  voiceAppendMode="replace"
  className="search-input"
/>
```

## Customization Options

### Button Sizes
- `sm`: Small button (good for compact forms)
- `md`: Medium button (default)
- `lg`: Large button (prominent placement)

### Button Variants
- `primary`: Primary button styling
- `secondary`: Secondary button styling (default)
- `outline`: Outlined button
- `ghost`: Ghost button (minimal styling)

### Error Handling

All voice components handle errors gracefully and display them to the user:

```tsx
<VoiceInput
  // ... other props
  onVoiceTranscription={(text) => {
    // Success handling
    console.log('Got text:', text);
  }}
  // Error display is automatic, but you can also handle it
/>
```

## Integration Tips

1. **For Short Fields (titles, names)**: Use `VoiceInput` with `voiceAppendMode="replace"`
2. **For Long Fields (descriptions, notes)**: Use `VoiceTextarea` with `voiceAppendMode="append"`
3. **For Search/Query**: Use `VoiceInput` with automatic search triggering
4. **For Comments/Logs**: Use `VoiceTextarea` with timestamped appends

## Accessibility

- All voice components include proper tooltips
- Recording state is visually indicated with animations
- Error states are clearly communicated
- Keyboard navigation is preserved for all form elements
