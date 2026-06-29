# Architecture Overview

## Overview

URent is a monorepo composed of a React frontend and an Express backend.

## Components

- Frontend: Vite + React + TypeScript
- Backend: Express + TypeScript + Mongoose
- Real-time layer: Socket.IO
- Authentication: Firebase + JWT
- Media: Cloudinary
- AI: Google Gemini API

## High-Level Flow

1. Users interact with the React app.
2. The frontend communicates with the API for listings, auth, bookings, and messaging.
3. The backend stores and retrieves data in MongoDB.
4. Media and AI features are handled through Cloudinary and Gemini.
