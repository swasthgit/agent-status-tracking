# M-Swasth Agent Call Management System

A comprehensive call centre management portal for M-Swasth, built with React and Firebase.

## Features

- **Agent Dashboard** - Real-time agent status tracking (Login/Logout/Break)
- **Call Management** - Outbound (Manual Leads, ExoPhones), Inbound call logging with Exotel integration
- **Team Lead Dashboard** - Monitor team performance, call analytics, CSV export
- **Insurance Manager Dashboard** - Cross-team visibility, analytics, and reporting
- **Health Manager Dashboard** - Health department agent management and monitoring
- **DC Agent System** - Offline visits tracking, clinic management, trip tracking with GPS
- **Trip Tracker** - Google Maps road distance calculation, reimbursement tracking
- **Partner Management** - Exophone-to-partner mapping, caller ID management

## Tech Stack

- **Frontend:** React, Material UI
- **Backend:** Firebase (Firestore, Authentication, Hosting)
- **APIs:** Exotel (telephony), Google Maps Routes API
- **Deployment:** Firebase Hosting + Cloud Functions

## Setup

1. Clone the repository
2. Run `npm install`
3. Create `.env` with required Firebase and API credentials
4. Run `npm start` for development
5. Run `npm run build && firebase deploy --only hosting` for production

## Project Structure

```
src/
  components/    # React components (dashboards, forms, trackers)
  config/        # App configuration (API, partners, reimbursement)
  context/       # React context providers
  hooks/         # Custom React hooks
  services/      # External API services (Google Maps)
  styles/        # CSS and animations
  theme/         # Material UI theme configuration
  utils/         # Utility functions (sync service)
firebase-admin/  # Admin scripts (not deployed)
```
