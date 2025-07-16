# Users API Migration Documentation

## Overview

This document outlines the migration of the users action system to our consolidated API pattern. The migration includes comprehensive user management with authentication, roles, invitations, and avatar handling.

## Migration Components

### 1. API Endpoint
- **File**: `/src/app/api/users/route.ts`
- **Description**: Complete REST API endpoint for user operations
- **Features**:
  - CRUD operations for users
  - User search functionality
  - Role-based access control
  - User invitations (placeholder)
  - Avatar upload (placeholder)
  - Business isolation
  - Authentication
  - Comprehensive error handling

### 2. Client Library
- **File**: `/src/lib/api/users.ts`
- **Description**: Type-safe client library for user operations
- **Components**:
  - `UsersAPI` class with all operations
  - Comprehensive utility functions
  - Type definitions for requests/responses
  - User validation helpers

### 3. React Hooks
- **File**: `/src/hooks/useUsers.ts`
- **Description**: React hooks for user state management
- **Hooks**:
  - `useUsers()` - User listing with filtering
  - `useUser()` - Single user management
  - `useUserByAuthId()` - User by auth ID
  - `useUserSearch()` - User search functionality
  - `useUserMutations()` - User CRUD operations
  - `useUserAvatar()` - Avatar operations
  - `useUserInvitations()` - Invitation management
  - `useFilteredUsers()` - Client-side filtering
  - `useUserStats()` - User statistics
  - `useUserDropdownOptions()` - Dropdown formatting
  - `useUserManager()` - Combined user management

## Key Features

### User Management
- **CRUD Operations**: Create, read, update, delete users
- **Role Management**: admin, manager, member roles
- **Status Tracking**: active, invited, revoked status
- **Search Functionality**: Full-text search across user data
- **Filtering**: Role, status, and text-based filtering
- **Sorting**: By name, role, creation date

### Authentication & Authorization
- **Business Isolation**: Users scoped to specific businesses
- **Auth ID Support**: Support for external auth provider IDs
- **Role-based Access**: Admin-only operations
- **Self-protection**: Prevent users from deleting themselves

### User Invitations
- **Email Invitations**: Send invitations to new users
- **Invitation Management**: Resend, revoke invitations
- **Status Tracking**: Track invitation status
- **Expiration Handling**: Time-limited invitations

### Avatar Management
- **File Upload**: Support for avatar image uploads
- **Auto-generated Avatars**: Fallback to generated avatars
- **Media Integration**: Integration with media management system

## API Usage Examples

### Basic User Operations

```typescript
import { usersAPI } from '@/lib/api/users';

// Get all users
const result = await usersAPI.getUsers();

// Get users with filtering
const filtered = await usersAPI.getUsers({
  role: 'admin',
  status: 'active',
  search: 'john',
  limit: 10,
  offset: 0
});

// Get user by ID
const user = await usersAPI.getUserById('user-123');

// Get user by auth ID
const authUser = await usersAPI.getUserByAuthId('auth-456');

// Search users
const searchResults = await usersAPI.searchUsers('john doe');
```

### User CRUD Operations

```typescript
// Create a new user
const createResult = await usersAPI.createUser({
  user: {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    role: 'member',
    status: 'active'
  }
});

// Update user
const updateResult = await usersAPI.updateUser('user-123', {
  user: {
    first_name: 'Jane',
    last_name: 'Smith'
  }
});

// Update user by auth ID
const authUpdateResult = await usersAPI.updateUserByAuthId('auth-456', {
  user: {
    phone: '+1234567890'
  }
});

// Admin update user
const adminUpdateResult = await usersAPI.updateUserAsAdmin('user-123', {
  updates: {
    role: 'manager',
    status: 'active'
  }
});

// Delete user
const deleteResult = await usersAPI.deleteUser('user-123');
```

### Avatar Operations

```typescript
// Upload avatar
const file = new File(['...'], 'avatar.jpg', { type: 'image/jpeg' });
const avatarResult = await usersAPI.uploadUserAvatar({ file });
```

### Invitation Operations

```typescript
// Send invitation
const inviteResult = await usersAPI.sendUserInvitation({
  email: 'new.user@example.com',
  name: 'New User',
  role: 'member'
});

// Resend invitation
const resendResult = await usersAPI.resendUserInvitation('user-123');

// Revoke invitation
const revokeResult = await usersAPI.revokeUserInvitation('user-123');
```

## Hook Usage Examples

### Basic User Management

```typescript
import { useUsers, useUserMutations } from '@/hooks/useUsers';

function UserList() {
  const { users, loading, error, refetch } = useUsers({ 
    role: 'member',
    status: 'active'
  });
  const { createUser, updateUser, deleteUser } = useUserMutations();
  
  const handleCreateUser = async (userData) => {
    const result = await createUser({ user: userData });
    if (result.success) {
      refetch();
    }
  };
  
  return (
    <div>
      {loading && <div>Loading users...</div>}
      {error && <div>Error: {error}</div>}
      {users.map(user => (
        <UserItem key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### User Search

```typescript
import { useUserSearch } from '@/hooks/useUsers';

function UserSearch() {
  const { users, loading, error, searchUsers } = useUserSearch();
  const [query, setQuery] = useState('');
  
  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim()) {
      searchUsers(value);
    }
  };
  
  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder="Search users..."
      />
      {loading && <div>Searching...</div>}
      {error && <div>Error: {error}</div>}
      {users.map(user => (
        <UserItem key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### User Statistics

```typescript
import { useUsers, useUserStats } from '@/hooks/useUsers';

function UserDashboard() {
  const { users } = useUsers();
  const stats = useUserStats(users);
  
  return (
    <div>
      <h2>User Statistics</h2>
      <div>
        <p>Total Users: {stats.total}</p>
        <p>Active Users: {stats.active}</p>
        <p>Invited Users: {stats.invited}</p>
        <p>Admins: {stats.admins}</p>
        <p>Managers: {stats.managers}</p>
        <p>Members: {stats.members}</p>
      </div>
    </div>
  );
}
```

### Comprehensive User Management

```typescript
import { useUserManager } from '@/hooks/useUsers';

function UserManager() {
  const {
    users,
    stats,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    uploadAvatar,
    sendInvitation,
    searchUsers,
    utils
  } = useUserManager();
  
  const handleCreateUser = async (userData) => {
    const result = await createUser({ user: userData });
    if (result.success) {
      console.log('User created successfully');
    }
  };
  
  const handleUploadAvatar = async (userId, file) => {
    const result = await uploadAvatar({ file });
    if (result.success) {
      console.log('Avatar uploaded successfully');
    }
  };
  
  const handleSendInvitation = async (email, name, role) => {
    const result = await sendInvitation({ email, name, role });
    if (result.success) {
      console.log('Invitation sent successfully');
    }
  };
  
  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      
      <div>
        <h2>Users ({stats.total})</h2>
        {users.map(user => (
          <div key={user.id}>
            <img src={utils.getAvatarUrl(user)} alt={utils.getFullName(user)} />
            <span>{utils.getFullName(user)}</span>
            <span>{utils.formatRole(user.role)}</span>
            <span>{utils.formatStatus(user.status)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### User Dropdown

```typescript
import { useUserDropdownOptions } from '@/hooks/useUsers';

function UserSelect({ value, onChange }) {
  const options = useUserDropdownOptions(users, {
    role: 'member',
    status: 'active'
  });
  
  return (
    <select value={value} onChange={onChange}>
      <option value="">Select a user...</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
```

## Utility Functions

The `userUtils` object provides many helpful utility functions:

```typescript
import { userUtils } from '@/lib/api/users';

// User display
const fullName = userUtils.getFullName(user);
const initials = userUtils.getInitials(user);
const avatarUrl = userUtils.getAvatarUrl(user);

// User status checks
const isAdmin = userUtils.isAdmin(user);
const isActive = userUtils.isActive(user);
const isInvited = userUtils.isInvited(user);

// Formatting
const formattedRole = userUtils.formatRole(user.role);
const formattedStatus = userUtils.formatStatus(user.status);

// Data manipulation
const sortedUsers = userUtils.sortByName(users);
const adminUsers = userUtils.filterByRole(users, 'admin');
const activeUsers = userUtils.filterActive(users);
const searchResults = userUtils.searchUsers(users, 'john');

// Validation
const emailValid = userUtils.validateEmail('test@example.com');
const validationResult = userUtils.validateUserData(userData);

// Statistics
const stats = userUtils.getUserStats(users);

// Dropdown formatting
const dropdownOptions = userUtils.getUsersForDropdown(users);
```

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `auth_id` (String, Unique) - External auth provider ID
- `business_id` (UUID, Foreign Key)
- `first_name` (String)
- `last_name` (String)
- `email` (String, Unique within business)
- `phone` (String, Optional)
- `role` (Enum: admin, manager, member)
- `status` (Enum: active, invited, revoked)
- `avatar_url` (String, Optional)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `created_by` (UUID, Foreign Key)
- `updated_by` (UUID, Foreign Key)

## Security Features

### Authentication
- All endpoints require valid authentication
- User session validation on every request
- Business isolation enforced

### Authorization
- Users can only access users within their business
- Admin-only operations for sensitive updates
- Self-protection mechanisms

### Data Validation
- Email format validation
- Required field validation
- Role and status validation
- Duplicate email prevention

## Error Handling

### API Level
- Consistent error response format
- Detailed error messages
- Proper HTTP status codes
- Validation error details

### Client Level
- Automatic error handling in hooks
- Loading states for all operations
- Error propagation to UI components
- User-friendly error messages

## Performance Considerations

### Database Optimization
- Indexed queries for performance
- Efficient filtering and search
- Pagination support for large datasets
- Optimized user lookups

### Caching
- Client-side caching of user data
- Proper cache invalidation on updates
- Background refresh capabilities

### Loading States
- Granular loading states for different operations
- Optimistic updates where appropriate
- Proper error boundaries

## Migration Benefits

### Improved User Management
- Comprehensive user operations
- Better role and permission handling
- Enhanced search and filtering
- Improved invitation system

### Better Developer Experience
- Type-safe operations throughout
- Comprehensive hook library
- Consistent API patterns
- Detailed error handling

### Scalability
- Proper business isolation
- Efficient database queries
- Modular architecture
- Easy testing and maintenance

## Future Enhancements

### Planned Features
- Real-time user updates
- Advanced permission system
- Bulk user operations
- User activity tracking
- Enhanced avatar management
- OAuth integration

### Technical Improvements
- GraphQL support
- Advanced caching strategies
- Performance monitoring
- Enhanced security features
- Audit logging

## Migration Status

### ✅ Completed
- Basic user CRUD operations
- User search and filtering
- Role-based access control
- Business isolation
- Type-safe client library
- Comprehensive React hooks

### 🔄 In Progress
- User invitation system (placeholder implemented)
- Avatar upload functionality (placeholder implemented)
- Advanced permission system

### 📋 Planned
- Real-time updates
- Bulk operations
- Advanced audit logging
- Enhanced security features

This migration provides a solid foundation for comprehensive user management while maintaining the established API patterns and ensuring proper integration with the existing system architecture.
