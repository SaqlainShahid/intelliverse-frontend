# IntelliVerse Dashboards

This directory contains all role-based dashboards organized by user role.

## Directory Structure

```
dashboards/
├── admin/              # Admin dashboard and management
│   ├── AdminStatsEnhanced.jsx
│   ├── HodManagement.jsx
│   └── index.js
├── hod/                # HOD (Head of Department) dashboard
│   ├── HodDashboard.jsx
│   └── index.js
├── faculty/            # Faculty member dashboard
│   ├── FacultyDashboard.jsx
│   └── index.js
├── student/            # Student dashboard
│   ├── StudentDashboard.jsx
│   └── index.js
├── shared/             # Shared UI components
│   ├── StatCard.js
│   ├── FeatureCard.js
│   ├── GlassCard.js
│   └── index.js
└── index.js            # Main export file
```

## Usage

### Importing Dashboards

```javascript
// Option 1: Import specific dashboard
import { AdminDashboard } from '../dashboards/admin';
import { StudentDashboard } from '../dashboards/student';

// Option 2: Import from main index
import { AdminDashboard, StudentDashboard } from '../dashboards';
```

### Importing Shared Components

```javascript
import { StatCard, FeatureCard, GlassCard } from '../dashboards/shared';
```

## Dashboard Features

### Admin Dashboard
- **File**: `admin/AdminStatsEnhanced.jsx`
- **Features**:
  - User management (view, edit, delete all users)
  - Role management (assign/change roles)
  - HOD assignment and management
  - System health monitoring
  - Analytics with charts (Recharts)
  - Glassmorphism UI with confirmation modals
  - Real-time stats overview

### HOD Dashboard
- **File**: `hod/HodDashboard.jsx`
- **Features**:
  - Faculty approval management
  - Department overview
  - Student and faculty statistics
  - Department-specific analytics

### Faculty Dashboard
- **File**: `faculty/FacultyDashboard.jsx`
- **Features**:
  - Class management
  - Student tracking
  - Event participation
  - Profile management

### Student Dashboard
- **File**: `student/StudentDashboard.jsx`
- **Features**:
  - Course overview
  - Event listings
  - Club memberships
  - Profile and activities

## Shared Components

### StatCard
Reusable card component for displaying statistics with icons and metrics.

### FeatureCard
Card component for feature highlights and quick actions.

### GlassCard
Glassmorphism-styled card component for modern UI.

## Adding New Dashboards

1. Create a new folder for the role: `dashboards/new-role/`
2. Add dashboard component: `NewRoleDashboard.jsx`
3. Create index file: `index.js` with exports
4. Update main `dashboards/index.js` to export new role
5. Update `RoleDashboard.jsx` to include new role case

## Best Practices

- Keep role-specific logic within each dashboard folder
- Use shared components from `shared/` folder
- Follow existing naming conventions
- Export components through index files
- Keep dashboards modular and maintainable
