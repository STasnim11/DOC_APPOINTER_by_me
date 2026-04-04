# 🎨 Design Reference - MedFlow Style

## Design Elements to Apply

### 1. Edit/Delete Buttons (from image)
**Current style**: Large colored buttons
**New style**: 
- Small icon buttons on the right
- Edit: Pencil icon, gray text
- Delete: Trash icon, red text
- Minimal, clean look

### 2. Doctor Availability Page Redesign

**Reference**: MedFlow Schedule & Availability interface

**Key Features**:
- Clean card-based layout
- Toggle switches for each day (blue when active)
- Time pickers with AM/PM
- Interval buttons (15m, 30m, 60m)
- "Edit" and "Delete" buttons on right side
- Blue left border for active days
- "Add another interval" link
- "Save Changes" button (blue, top right)
- Stats cards at top (Total Hours, Available Slots)

**Color Scheme**:
- Primary blue: #4F46E5 (indigo)
- Background: White cards on light gray
- Active state: Blue toggle + blue left border
- Inactive: Gray, "Unavailable - Day Off"

**Layout**:
```
┌─────────────────────────────────────────────────┐
│ Schedule & Availability                         │
│ Manage your working hours and appointment slots │
│                                                 │
│ ┌─────────┐  ┌─────────┐  ┌──────────────────┐│
│ │ 38.5hrs │  │ 42 slots│  │ Next Appointment ││
│ └─────────┘  └─────────┘  └──────────────────┘│
│                                                 │
│ Weekly Schedule                  [Save Changes] │
│                                                 │
│ ┌─ Mon ──────────────────────────────────────┐ │
│ │ ● 09:00 AM - 05:00 PM  [15m][30m][60m]    │ │
│ │                              Edit | Delete │ │
│ └────────────────────────────────────────────┘ │
│                                                 │
│ ┌─ Tue ──────────────────────────────────────┐ │
│ │ ● 09:00 AM - 05:00 PM  [15m][30m][60m]    │ │
│ │                              Edit | Delete │ │
│ └────────────────────────────────────────────┘ │
│                                                 │
│ ○ Wed    Unavailable - Day Off                 │
│                                                 │
│ ┌─ Thu ──────────────────────────────────────┐ │
│ │ ● 08:00 AM - 12:00 PM  [15m][30m][60m]    │ │
│ │                              Edit | Delete │ │
│ │ ● 02:00 PM - 06:00 PM  [15m][30m][60m]    │ │
│ │                              Edit | Delete │ │
│ │ + Add another interval                      │ │
│ └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Files to Update

### Admin Dashboard Tables
- `frontend/src/pages/AdminDashboard.jsx`
- Update Edit/Delete button styles

### Doctor Availability
- `frontend/src/pages/DoctorDashboard.jsx` (availability section)
- Complete redesign to match MedFlow style

### CSS Files
- `frontend/src/styles/AdminDashboard.css`
- `frontend/src/styles/DoctorDashboard.css`

## Implementation Priority

1. ✅ Update Edit/Delete buttons in Admin tables (quick win)
2. 🔄 Redesign Doctor Availability page (larger task)

Would you like me to:
A) Start with updating the Edit/Delete buttons first?
B) Redesign the entire Doctor Availability page?
C) Both?
