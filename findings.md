# Findings: EmployeeProfileView

## Current Logic (Post-Rollback)
- **API Actions**: `updateEmployee`, `updateEmployeeHR`, `changePassword`, `uploadEmployeePhoto`, `updateEmployeeStatus`, `getWorkSites`.
- **States**: `passwordData`, `personalData`, `selectedGroups`, `showRoleModal`, `workSites`.
- **Tabs**: `overview`, `settings`.
- **Critical Features**: 
    - Account Status management (Activate/Suspend/Ban).
    - Approval Role management (Modal).
    - Password change.
    - Personal info update with Work Site selection.

## User Constraints
- "le problème se trouve sur le step Identité et Professionnel" -> Use these tabs.
- "champs de saisir son quasiment invisible" -> Increase contrast/borders.
- "décalages" -> Use Grid 12 for alignment.
- "Premium design" -> Glassmorphism, modern gradients.

## Mapping Strategy
- **Identity Tab**: `personalData` (Names, Phone, Address, WorkSite).
- **Professional Tab**: Position, Department, Hire Date, Salary (need to ensure these props are available).
- **Admin Tab**: Account Status (Buttons), Groups (Approval Roles).
- **Security Tab**: Password Change.
- **Documents Tab**: File management (API: `uploadEmployeeDocument`, `deleteEmployeeDocument`).
