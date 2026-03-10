# Button Design System

## Overview
All buttons across the application follow a consistent design system with standardized colors, sizes, and interactions. This ensures a professional and cohesive user interface.

## Button Color Scheme

### Primary Button (Blue)
**Used for:** Main actions, Save, Add, Upload, Edit
- **Color:** Linear gradient from `--accent-primary` to `--accent-secondary`
- **Light Mode:** #4361ee → #3f37c9
- **Dark Mode:** #4895ef → #3f37c9
- **Shadow:** rgba(67, 97, 238, 0.3)

```css
background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
```

### Danger Button (Red)
**Used for:** Delete, Close, Cancel
- **Color:** Linear gradient from `--accent-danger` to #c62a36
- **Light Mode:** #e63946 → #c62a36
- **Dark Mode:** #ef476f → #c62a36
- **Shadow:** rgba(230, 57, 70, 0.3)

```css
background: linear-gradient(135deg, var(--accent-danger), #c62a36);
```

### Success Button (Green)
**Used for:** Pay, Confirm, Approve
- **Color:** Linear gradient from `--accent-success` to #20a190
- **Light Mode:** #2ec4b6 → #20a190
- **Dark Mode:** #2ec4b6 → #20a190
- **Shadow:** rgba(46, 196, 182, 0.3)

```css
background: linear-gradient(135deg, var(--accent-success), #20a190);
```

### Warning Button (Orange)
**Used for:** Remind, Alert, Caution
- **Color:** Linear gradient from `--accent-warning` to #e0910f
- **Light Mode:** #fca311 → #e0910f
- **Dark Mode:** #fca311 → #e0910f
- **Shadow:** rgba(252, 163, 17, 0.3)

```css
background: linear-gradient(135deg, var(--accent-warning), #e0910f);
```

## Button Sizes

### Small (sm)
- **Padding:** 8px 16px
- **Font Size:** 12px
- **Border Radius:** 6px
- **Used for:** Table action buttons

### Medium (md)
- **Padding:** 12px 24px
- **Font Size:** 14px
- **Border Radius:** 8px
- **Used for:** Modal buttons, form buttons

### Large (lg)
- **Padding:** 14px 28px
- **Font Size:** 15px
- **Border Radius:** 10px
- **Used for:** Upload, Add Student buttons

## Button States

### Default State
- Normal appearance with shadow
- Cursor pointer
- Ready for interaction

### Hover State
- Transform: translateY(-2px) - Lifts button up
- Enhanced shadow (0 6px 20px)
- Smooth 0.3s transition

### Active State
- Transform: translateY(0) - Returns to normal position
- Reduced shadow (0 2px 8px)
- Immediate feedback

### Disabled State
- Opacity: 0.6
- Cursor: not-allowed
- No transform or shadow changes

## Button Classes

### Primary Buttons
```html
<button class="btn-primary">Primary Action</button>
<button class="upload-btn">Upload File</button>
<button class="add-student-btn">Add Student</button>
<button class="save-btn">Save</button>
<button class="edit-btn">Edit</button>
```

### Danger Buttons
```html
<button class="btn-danger">Delete</button>
<button class="delete-btn">Delete</button>
<button class="close-btn">Close</button>
```

### Success Buttons
```html
<button class="btn-success">Confirm</button>
<button class="pay-btn">Pay</button>
```

### Warning Buttons
```html
<button class="btn-warning">Remind</button>
<button class="remind-btn">Remind</button>
```

### Action Buttons (Table)
```html
<div class="action-buttons">
  <button class="action-btn pay-btn">
    <img src="pay.png" class="btn-icon" />
  </button>
  <button class="action-btn remind-btn">
    <img src="reminder.png" class="btn-icon" />
  </button>
  <button class="action-btn edit-btn">Edit</button>
  <button class="action-btn delete-btn">Delete</button>
</div>
```

## Button Consistency

### All Primary Buttons Use:
- Upload Button
- Add Student Button
- Save Button
- Edit Button
- Pay Button
- Remind Button

**Color:** Blue gradient (#4361ee → #3f37c9)
**Shadow:** 0 4px 15px rgba(67, 97, 238, 0.3)

### All Danger Buttons Use:
- Delete Button
- Close Button

**Color:** Red gradient (#e63946 → #c62a36)
**Shadow:** 0 4px 15px rgba(230, 57, 70, 0.3)

## Responsive Behavior

### Desktop (1024px+)
- Full size buttons with standard padding
- Icons and text visible
- Normal spacing

### Tablet (768px - 1024px)
- Slightly reduced padding
- Smaller font sizes
- Maintained functionality

### Mobile (480px - 768px)
- Compact padding (10px 16px)
- Smaller font sizes (13px)
- Full-width buttons in modals

### Extra Small (<480px)
- Minimal padding (8px 12px)
- Tiny font sizes (12px)
- Optimized for touch

## Icon Styling

### Button Icons
- **Size:** 20px × 20px
- **Object Fit:** contain
- **Filter:** brightness(0) invert(1) for white icons on colored backgrounds

### Action Button Icons
- **Size:** 16px × 16px
- **Object Fit:** contain
- **Responsive:** Scales down on mobile

## Accessibility

- High contrast colors for readability
- Clear visual feedback on hover/active states
- Sufficient padding for touch targets (minimum 44px × 44px)
- Semantic button elements
- Disabled state clearly indicated

## CSS Files

- `button-system.css` - Main button design system
- `buttons.css` - Action button specific styles
- `upload-section.css` - Upload and add buttons
- `forms.css` - Modal buttons (save, close)

## Usage Guidelines

1. **Use Primary (Blue) for:**
   - Main actions users should take
   - Positive confirmations
   - Creating or saving data

2. **Use Danger (Red) for:**
   - Destructive actions
   - Cancellations
   - Closing dialogs

3. **Use Success (Green) for:**
   - Payments
   - Confirmations
   - Approvals

4. **Use Warning (Orange) for:**
   - Reminders
   - Alerts
   - Cautions

## Future Enhancements

- Loading state with spinner
- Tooltip support
- Keyboard shortcuts
- Focus states for accessibility
- Animation variations
- Button groups
