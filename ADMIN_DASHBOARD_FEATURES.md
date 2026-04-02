# Admin Dashboard Features

## What's New

### Full-Page Layout ✅
- Admin dashboard now uses 100% of the viewport height
- No wasted space - sidebars and content area fill the entire screen
- Proper scrolling for content that overflows

### Working Forms ✅
Each module now has functional forms in "Add" mode:

#### 1. Departments
- Department Name (required)
- Description (optional)
- Saves to database via API

#### 2. Hospital Branches
- Branch Name (required)
- Address (optional)
- Established Date (optional)
- Saves to database via API

#### 3. Branch Contacts
- Branch ID (required)
- Contact Number (required)
- Contact Type (phone/fax/emergency)
- Saves to database via API

#### 4. Medical Technician
- User ID (required)
- Degrees
- Experience Years
- Department ID
- Branch ID
- Saves to database via API

### Data Tables ✅
Each module displays data in "View" mode:

#### Departments Table
- ID, Name, Description

#### Hospital Branches Table
- ID, Name, Address, Established Date

#### Branch Contacts Table
- ID, Branch Name, Contact Number, Type

#### Medical Technicians Table
- ID, Name, Email, Department, Branch, Experience

### Features

1. **Real-time Data Loading**
   - Data fetches from backend when you select a module
   - Loading indicators while fetching
   - Error messages if fetch fails

2. **Form Validation**
   - Required fields marked with *
   - Client-side validation
   - Server-side validation messages

3. **Success/Error Messages**
   - Green success messages when data is saved
   - Red error messages if something fails
   - Auto-redirect to view after successful save

4. **JWT Authentication**
   - All API calls include JWT token
   - Token stored in localStorage on login
   - Automatic authentication on every request

## How to Use

### Step 1: Login
1. Go to http://localhost:5173/login
2. Login with admin credentials
3. JWT token is automatically stored

### Step 2: Navigate to Admin Dashboard
1. After login, go to http://localhost:5173/admin/dashboard
2. You'll see the full-page layout with sidebar

### Step 3: Select a Module
1. Click any module in the left sidebar (e.g., "Departments")
2. Sub-sidebar appears with "View" and "Add" options

### Step 4: View Data
1. Click "View" to see all records in a table
2. Data loads from the backend automatically

### Step 5: Add New Record
1. Click "Add" to show the form
2. Fill in the required fields
3. Click "Save" button
4. Success message appears
5. Automatically redirects to View mode

## API Integration

All forms connect to the backend:

- **Departments**: `POST /api/admin/departments`
- **Hospital Branches**: `POST /api/admin/hospital-branches`
- **Branch Contacts**: `POST /api/admin/branch-contacts`
- **Medical Technicians**: `POST /api/admin/medical-technicians`

All requests include:
```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

## Styling

- Clean, professional design
- Consistent color scheme (dark sidebar, white content)
- Responsive forms and tables
- Hover effects on interactive elements
- Success/error message styling

## Next Steps

To add more modules:

1. Add form in `renderForm()` function
2. Add table in `renderTable()` function
3. Add endpoint mapping in `fetchData()` and `handleSubmit()`
4. Backend API should already exist

## Testing

1. **Test Department Add:**
   - Click "Departments" → "Add"
   - Enter name: "Cardiology"
   - Enter description: "Heart and cardiovascular care"
   - Click Save
   - Should see success message and redirect to view

2. **Test Branch Add:**
   - Click "Hospital Branches" → "Add"
   - Enter name: "Main Branch"
   - Enter address: "123 Medical Street"
   - Select date
   - Click Save

3. **Test View:**
   - Click any module → "View"
   - Should see table with all records
   - Data loads from backend

## Troubleshooting

### "Failed to fetch data"
- Check backend is running on port 3000
- Check JWT token is stored in localStorage
- Check user role is ADMIN

### "Access denied"
- Make sure you're logged in as admin
- Check token hasn't expired (24 hours)

### Form doesn't submit
- Check all required fields are filled
- Check browser console for errors
- Verify backend API is accessible
