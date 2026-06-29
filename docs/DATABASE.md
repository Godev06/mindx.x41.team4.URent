# Database Guide

## Storage Layer

URent uses MongoDB with Mongoose models for core entities such as users, products, orders, reviews, conversations, and notifications.

## Recommended Practices

- Keep schemas validated and typed
- Add indexes for frequently queried fields
- Separate environment-specific database configuration
- Review geospatial fields for location-based search
