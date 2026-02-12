# Backend Planning - Kerala School Holidays Website

## 1) Backend Goal
Create a dynamic backend-driven Kerala school holiday platform where admin can publish live updates for fixed holidays, rain holidays, school strike, and strike notices with district/sub-district scope.

## 2) Admin Login & Roles
- Secure admin login (`/api/admin/login`) with JWT + refresh token.
- Roles:
  - Super Admin (all Kerala)
  - District Admin (single district)
  - Sub-district Operator (limited zone update)
- Force password policy, OTP reset, and login rate limiting.

## 3) Dynamic Display Support
- Frontend uses APIs for holiday cards, totals, and filters.
- Responsive UI for mobile/desktop with card-based rendering.
- Real-time-ready approach: polling every 5 minutes (phase-2 websocket).

## 4) Category + Tag Model
Categories with color tags:
- `rain_holiday` (blue)
- `fixed_holiday` (green)
- `school_strike` (orange)
- `strike` (red)
- `festival_or_seasonal` (purple)

## 5) District and Sub-district Rain Data
Holiday record fields:
- `district_name`
- `sub_district_name`
- `scope_type` (`district`, `sub_district`, `full_district`)
- `warning_level` (`yellow`, `orange`, `red`) for rain updates

## 6) API Plan
- `GET /api/holidays?category=&district=`
- `GET /api/summary`
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `POST /api/admin/holidays`
- `PUT /api/admin/holidays/:id`
- `PATCH /api/admin/holidays/:id/status`
- `GET /api/admin/audit-logs`

## 7) Useful Student/Teacher Features
- Student planner notes (exam prep reminder by holiday window).
- Teacher lesson buffer planning (before expected rain/strike days).
- Parent transport alert block for district closures.

## 8) Suggested Build Order
1. Build login/auth middleware and role guards.
2. Build holiday CRUD API with validation.
3. Build summary and district/sub-district endpoints.
4. Add audit logging and CSV export.
5. Add notification integrations (SMS/WhatsApp in next phase).
