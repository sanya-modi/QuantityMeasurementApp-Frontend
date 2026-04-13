# Quantity Measurement App Frontend

This project is the frontend for the Quantity Measurement App. It provides a clean React interface for comparing, converting, and calculating physical quantities, while also supporting user authentication and saved history for logged-in users.

The app is built with React, TypeScript, Vite, Tailwind CSS, and React Router, and it connects to a Spring Boot backend for authentication, calculations, and history management.

## What This App Does

The frontend lets users work with different measurement types:

- Length
- Weight
- Temperature
- Volume

For each type, the user can perform:

- Comparison
- Conversion
- Arithmetic operations

The arithmetic flow supports:

- Addition
- Subtraction
- Multiplication
- Division

Users can use the calculator in guest mode, but history features are available only after authentication.

## Main Features

- Responsive calculator UI for multiple measurement types
- Dynamic unit selection based on measurement category
- Quantity comparison between two values
- Quantity conversion between supported units
- Arithmetic operations on compatible quantities
- Automatic result rendering from backend responses
- Google OAuth login
- Email/password login and signup
- Guest mode without login
- User history preview on the calculator page
- Dedicated full history page
- Delete single history item
- Clear all history for the logged-in user

## Supported Measurement Units

Current frontend unit configuration includes:

- Length: `Feet`, `Inches`, `Yards`, `Centimeters`
- Weight: `Kilogram`, `Gram`, `Pound`
- Temperature: `Celsius`, `Fahrenheit`, `Kelvin`
- Volume: `Litre`, `Millilitre`, `Gallon`

These are configured in `src/lib/measurement.ts` and mapped to backend enum values.

## Pages and User Flow

### `/measurement`

This is the main calculator page.

It allows the user to:

- Select a measurement type
- Select an action
- Enter values and units
- Send the request to the backend
- View the result
- Preview recent history if logged in

If the user is not logged in:

- The calculator still works
- History is hidden
- The UI prompts the user to log in for saved history

### `/auth`

This page supports:

- Login with email and password
- Signup with name, email, password, and mobile input
- Google login
- Guest access

### `/oauth-callback`

This route is used only for Google OAuth completion.

The page:

- Reads the token or OAuth error from the URL
- Loads the current authenticated user from the backend
- Stores auth data in local storage
- Redirects to `/measurement`

### `/history`

This page is available for logged-in users and shows the user’s complete saved calculation history.

It supports:

- Viewing all history items
- Refreshing history
- Deleting an individual history entry
- Clearing the full history list
- Navigating back to the calculator

If the user is not authenticated, the page shows links to log in or return to the calculator.

## Authentication Modes

The frontend supports four access modes:

- Local login with email/password
- Local signup with email/password
- Google OAuth login
- Guest mode

### Local Authentication

The frontend sends requests to:

- `POST /auth/login`
- `POST /auth/register`

On success, the backend returns a JWT response. The frontend stores:

- Access token in local storage
- User object in local storage

### Google OAuth Flow

The Google login flow used by this frontend is:

1. User clicks `Continue with Google`
2. Frontend redirects to `${VITE_OAUTH_BASE_URL}${VITE_OAUTH_START_PATH}`
3. Backend starts the Spring Security OAuth flow
4. Google authenticates the user
5. Backend redirects back to the frontend callback route
6. Frontend reads the token from `/oauth-callback`
7. Frontend fetches the current user using the returned token
8. Frontend stores auth state and redirects to `/measurement`

Expected backend redirect target:

```text
APP_REDIRECT_URI=http://localhost:3000/oauth-callback
```

## Guest Mode

Guest users can:

- Open the calculator
- Compare quantities
- Convert quantities
- Perform arithmetic calculations

Guest users cannot:

- View saved history
- Manage history items

## Backend Integration

This frontend depends on a backend API for:

- Authentication
- Token-based user lookup
- Quantity calculations
- Quantity conversion
- Quantity history

### Auth Endpoints Used

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/status`
- `GET /auth/user`
- `GET /auth/logout`
- `GET /auth/google`

### OAuth Endpoints Used by the Backend

- `GET /oauth2/authorization/google`
- `GET /login/oauth2/code/google`

### Measurement Endpoints Used

- `POST /api/v1/quantities/compare`
- `POST /api/v1/quantities/convert`
- `POST /api/v1/quantities/add`
- `POST /api/v1/quantities/subtract`
- `POST /api/v1/quantities/multiply`
- `POST /api/v1/quantities/divide`
- `GET /api/v1/quantities/my/history`
- `DELETE /api/v1/quantities/my/history`
- `DELETE /api/v1/quantities/my/history/{id}`

## Frontend Architecture

### Routing

Routing is handled with React Router and defined in `src/App.tsx`.

Main routes:

- `/`
- `/auth`
- `/oauth-callback`
- `/measurement`
- `/history`

### State Handling

The app currently uses React local component state and browser local storage.

Auth state is stored in local storage using:

- `qm_access_token`
- `qm_user`

### API Layer

The API helpers are split by concern:

- `src/lib/auth.ts` for authentication and user session helpers
- `src/lib/measurement.ts` for calculation and history requests

### Components

Reusable UI components include:

- `BalanceLogo`
- `GoogleIcon`
- `HistoryCard`

### Pages

Main pages include:

- `AuthPage.tsx`
- `GoogleOAuthCallback.tsx`
- `MeasurementPage.tsx`
- `HistoryPage.tsx`

## Project Structure

```text
src/
  components/
    BalanceLogo.tsx
    GoogleIcon.tsx
    HistoryCard.tsx
  lib/
    auth.ts
    measurement.ts
  pages/
    AuthPage.tsx
    GoogleOAuthCallback.tsx
    HistoryPage.tsx
    MeasurementPage.tsx
  App.tsx
  config.ts
  index.css
  main.tsx
  types.ts
```

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Lucide React

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a local `.env` file from `.env.example`.

On Windows:

```bash
copy .env.example .env
```

Environment variables used by the frontend:

- `VITE_API_BASE_URL`
- `VITE_PREFER_SAME_ORIGIN_API`
- `VITE_OAUTH_BASE_URL`
- `VITE_OAUTH_START_PATH`
- `VITE_OAUTH_DIRECT_START_PATH`
- `VITE_USE_DIRECT_OAUTH_START`

Recommended local values:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_PREFER_SAME_ORIGIN_API=false
VITE_OAUTH_BASE_URL=http://localhost:8080
VITE_OAUTH_START_PATH=/auth/google
VITE_OAUTH_DIRECT_START_PATH=/oauth2/authorization/google
VITE_USE_DIRECT_OAUTH_START=false
```

For deployed environments behind Nginx where `/api` is proxied to the backend,
leave `VITE_PREFER_SAME_ORIGIN_API=true` (default) so the browser calls same-origin `/api/...`
instead of a cross-origin backend URL.

### 3. Start the Frontend

```bash
npm run dev
```

### 4. Build the Frontend

```bash
npm run build
```

### 5. Preview the Production Build

```bash
npm run preview
```

## Important Implementation Notes

- The frontend uses `/oauth-callback` as the single Google callback route.
- Auth status is checked using `GET /auth/status`.
- Authenticated requests send the JWT in the `Authorization: Bearer <token>` header.
- Requests also use `credentials: include` to support backend session/cookie behavior where needed.
- The measurement page loads recent history only for authenticated users.
- Arithmetic results may be converted again on the frontend if the backend returns a different result unit than the selected target unit.

## Known Dependency on Backend Schema

If Google login reaches the backend but fails with a 500 error during user save, the issue is usually not the frontend route flow. It is typically caused by backend OAuth persistence or database schema limits for OAuth profile fields.

## Summary

This frontend is a full user-facing client for the Quantity Measurement App. It combines a modern calculator workflow with authentication, backend-powered quantity logic, and user-specific history management, while still allowing guest access for core measurement operations.
