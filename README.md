# QuantityMeasurementAppFrontend

Vanilla HTML, CSS, and JavaScript frontend for the Quantity Measurement App.

## API Integration

- The frontend uses `js/api.js` for all backend calls.
- If the app is opened from `file://`, the default API base URL is `http://localhost:8080`.
- If the app is served from a web server, the frontend uses the same origin by default.
- You can override the API base URL by setting `localStorage.setItem("qm-api-base-url", "http://your-api-host")` in the browser console before loading the pages.

## Configured Endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/google`
- `POST /api/v1/quantities/compare`
- `POST /api/v1/quantities/convert`
- `POST /api/v1/quantities/add`
- `POST /api/v1/quantities/subtract`
- `POST /api/v1/quantities/divide`
- `GET /api/v1/quantities/history/type/{measurementType}`
- `GET /api/v1/quantities/history/operation/{operation}`
- `GET /api/v1/quantities/history/errored`
- `GET /api/v1/quantities/count/{operation}`

## Notes

- The provided API list does not include a multiply endpoint, so multiply stays as a local frontend calculation.
- The Google auth button currently starts the flow at `/api/v1/auth/google`.
