# 🗄 Database Design & MongoDB Schema

This document details the database layer, schema architectures, indexing strategies, and model relations implemented in the **URent** ecosystem using **MongoDB** and **Mongoose ODM**.

---

## 1. Database Architecture & Indexing Strategy

To achieve high throughput, fast geospatial query execution, and low read latency, URent leverages MongoDB's rich indexing capabilities:
1. **Geospatial Queries**: The `Product` collection features a `2dsphere` index on the `location` coordinates field. This allows the system to compute distances and locate products near a user via `$nearSphere` or `$geoWithin`.
2. **Compound Indexes**: Unique compound indexes (e.g., `{ conversationId: 1, userId: 1 }` on `ConversationParticipant`) guarantee data integrity at the database layer, preventing duplicate records.
3. **Sparse Indexes**: Fields like `phone` and `username` inside the `User` schema are set to `sparse: true` and `unique: true`. This allows users who sign up via Google (who may initially lack a phone or username) to have null values without violating uniqueness constraints.
4. **Sorted Indexes**: Timestamps (like `lastMessageAt: -1` in `Conversation` and `createdAt: -1` in `Message`) are indexed in descending order to optimize pagination queries and avoid in-memory sorting.

---

## 2. Entity-Relationship Model (ERD)

URent operates on a semi-structured relational design overlaying MongoDB's document-model foundation:

```mermaid
erDiagram
    User ||--|| Settings : "owns"
    User ||--oN Product : "lists"
    User ||--oN Order : "rents / owns"
    User ||--oN Notification : "receives"
    User ||--oN ActivityLog : "triggers"
    User ||--oN FcmToken : "registers"
    User ||--oN ConversationParticipant : "participates in"

    Conversation ||--oN ConversationParticipant : "contains"
    Conversation ||--oN Message : "groups"
    
    Product ||--oN Order : "is rented in"
    Message }|--|| User : "sent by"
    
    Notification ||--|| ActivityLog : "links to"
```

---

## 3. Mongoose Schema Definitions

Below are the formal schema specifications directly mapping URent's active Mongoose models:

### 3.1 User Schema (`users` collection)
Holds the system credentials, OTP state, profile information, trust ratings, and favorites.

- **Indexes**:
  - `email`: 1 (Unique, Case-Insensitive)
  - `username`: 1 (Unique, Sparse)
  - `phone`: 1 (Unique, Sparse)

- **Schema Fields**:
  | Field Name | Type | Constraints | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `_id` | `ObjectId` | Auto | - | Primary Key |
  | `email` | `String` | Required, Unique, Lowercase | - | User login email |
  | `password` | `String` | Optional | - | Bcrypt hashed password (local auth only) |
  | `authProviders` | `Array[String]` | Enum: `['local', 'google']` | - | Enabled login methods |
  | `isEmailVerified`| `Boolean` | Required | `false` | Registration OTP verified status |
  | `otpCode` | `String` | Optional | - | Registration verification email OTP |
  | `otpExpiresAt` | `Date` | Optional | - | Expiration timestamp for signup OTP |
  | `loginOtpCode` | `String` | Optional | - | 2FA multi-factor authentication OTP |
  | `loginOtpExpiresAt`| `Date` | Optional | - | Expiration timestamp for 2FA OTP |
  | `resetToken` | `String` | Optional | - | Forgotten password reset token |
  | `resetTokenExpiresAt`| `Date` | Optional | - | Expiration for password reset token |
  | `displayName` | `String` | Optional, Trimmed | - | Full name for display |
  | `username` | `String` | Unique, Sparse | - | Unique system handle |
  | `bio` | `String` | Max 200 chars | - | Short bio text |
  | `avatarUrl` | `String` | Optional | - | Cloudinary URL to avatar image |
  | `phone` | `String` | Unique, Sparse | - | Primary contact phone |
  | `address` | `String` | Optional | - | Standard user shipping address |
  | `trustScore` | `Number` | Enum: `[100, 60, 40, 10]` | `100` | Account trust rating |
  | `role` | `String` | Enum: `['user', 'admin']` | `'user'` | Security authorization role |
  | `favoriteProducts`| `Array[ObjectId]`| Ref: `Product` | `[]` | List of wishlisted product IDs |
  | `createdAt` | `Date` | Auto | - | Timestamp when created |
  | `updatedAt` | `Date` | Auto | - | Timestamp when updated |

---

### 3.2 Product Schema (`products` collection)
Stores property and equipment listings available for rent.

- **Indexes**:
  - `location`: `2dsphere` (Geospatial index)
  - `ownerId`: 1 (Query optimization)

- **Schema Fields**:
  | Field Name | Type | Constraints | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `_id` | `ObjectId` | Auto | - | Primary Key |
  | `ownerId` | `ObjectId` | Ref: `User`, Required | - | Listing creator reference |
  | `name` | `String` | Required, Trimmed | - | Item listing name |
  | `category` | `String` | Required, Trimmed | - | Category (e.g. Điện tử & Công nghệ) |
  | `price` | `Number` | Required, Min 0 | - | Daily rental cost in VND |
  | `status` | `String` | Enum: `['Available', 'Active', 'Completed']`| `'Available'` | Core listing availability state |
  | `statusQuantities`| `Object` | Nested | - | Detailed tracking limits |
  | `statusQuantities.available`| `Number`| Min 0 | `1` | Available item stock |
  | `statusQuantities.rented`| `Number` | Min 0 | `0` | Active rented items |
  | `statusQuantities.overdue`| `Number`| Min 0 | `0` | Overdue rental items |
  | `isArchived` | `Boolean` | Required | `false` | If soft-deleted/hidden from searches |
  | `lastUpdated` | `Date` | Required | `Date.now` | Last update check time |
  | `imageUrl` | `String` | Required | `https://placehold.co/150` | Listing photo URL |
  | `description` | `Array[String]`| Required | `[]` | Highlights and key characteristics |
  | `condition` | `String` | Required | `'New'` | Standard condition: New, 99%, 95%, Used |
  | `locationText` | `String` | Required, Trimmed | `'Chưa cập nhật vị trí'`| Human readable location address |
  | `location` | `Object` | Required, GeoJSON | - | GeoJSON Point for maps lookup |
  | `location.type` | `String` | Required, Enum: `['Point']`| `'Point'` | GeoJSON spatial representation |
  | `location.coordinates`| `Array[Number]`| Length 2: `[lng, lat]` | `[105.8342, 21.0278]` | Longitude & Latitude coordinates |
  | `unavailableDates`| `Array[Object]`| Nested | `[]` | Schedule array of reserved blocks |
  | `unavailableDates.startDate`| `Date` | Optional | - | Rental block start |
  | `unavailableDates.endDate`| `Date` | Optional | - | Rental block end |
  | `rating` | `Number` | Min 0, Max 5 | `0` | Average listing star rating |
  | `reviewsCount` | `Number` | Min 0 | `0` | Total review count count |

---

### 3.3 Order Schema (`orders` collection)
Represents rental contracts and order workflows between renters and listing owners.

- **Indexes**:
  - `orderCode`: 1 (Unique)
  - `renterId` / `ownerId`: 1 (Query optimization)

- **Schema Fields**:
  | Field Name | Type | Constraints | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `_id` | `ObjectId` | Auto | - | Primary Key |
  | `orderCode` | `String` | Required, Unique, Trimmed | - | Human readable invoice code (unique) |
  | `productId` | `ObjectId` | Ref: `Product`, Required | - | Target rented item ID |
  | `productName` | `String` | Required | - | Copied product name for history |
  | `ownerId` | `ObjectId` | Ref: `User`, Required | - | Product owner ID |
  | `renterId` | `ObjectId` | Ref: `User`, Required | - | User who rents the product |
  | `startDate` | `Date` | Required | - | Rental start date |
  | `endDate` | `Date` | Required | - | Rental end date |
  | `totalPrice` | `Number` | Required, Min 0 | - | Final pricing total in VND |
  | `status` | `String` | Enum: `['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']`| `'pending'` | Current contract status |
  | `image` | `String` | Optional | - | Product photo snapshot |
  | `paymentStatus` | `String` | Enum: `['unpaid', 'paid']` | `'unpaid'` | Order payment status |

---

### 3.4 Chat Schemas

#### Conversation Schema (`conversations` collection)
Manages individual channels grouping chat sessions.

- **Indexes**:
  - `pairKey`: 1 (Unique, Sparse)
  - `lastMessageAt`: -1 (Descending sort)

- **Schema Fields**:
  | Field Name | Type | Constraints | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `conversationType`| `String` | Enum: `['ONE_TO_ONE']` | `'ONE_TO_ONE'` | Type categorization |
  | `type` | `String` | Enum: `['one_to_one', 'support']`| `'one_to_one'`| Direct or Customer Support chat |
  | `pairKey` | `String` | Unique, Sparse | - | Compound key mapping user pairs (`minId_maxId`) |
  | `lastMessage` | `String` | Optional | - | Preview snippet of last message |
  | `lastMessageAt` | `Date` | Required | `Date.now` | Timestamp of last message |

#### ConversationParticipant Schema (`conversationparticipants` collection)
Decouples conversation membership, read progress, and unread counts.

- **Indexes**:
  - `{ conversationId: 1, userId: 1 }`: (Unique compound index)

- **Schema Fields**:
  | Field Name | Type | Constraints | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `conversationId` | `ObjectId` | Ref: `Conversation`, Required| - | Target chat ID |
  | `userId` | `ObjectId` | Ref: `User`, Required | - | Participant user ID |
  | `role` | `String` | Enum: `['client', 'admin_moderator']`| `'client'`| Support role authority |
  | `unreadCount` | `Number` | Min 0 | `0` | Unread messages count badge |
  | `lastReadAt` | `Date` | Optional | - | Timestamp when user last read the chat |
  | `deletedAt` | `Date` | Optional | `null` | Soft delete timestamp |

#### Message Schema (`messages` collection)
Contains atomic chat entries.

- **Indexes**:
  - `{ conversationId: 1, createdAt: -1 }`: (Compound index for fast scroll reads)

- **Schema Fields**:
  | Field Name | Type | Constraints | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `conversationId` | `ObjectId` | Ref: `Conversation`, Required| - | Owner channel ID |
  | `senderId` | `ObjectId` | Ref: `User`, Required | - | Sender user ID |
  | `messageType` | `String` | Enum: `['TEXT', 'PRODUCT', 'LOCATION']`| - | Message type |
  | `content` | `String` | Max 2000 chars, Trimmed | - | Text body (for TEXT type) |
  | `metadata` | `Mixed` | Optional | - | Metadata payload (PRODUCT snapshot or Geo coordinates) |

---

### 3.5 Operational Schemas

#### Notification Schema (`notifications` collection)
Stores in-app alert entities.

- **Indexes**:
  - `{ userId: 1, createdAt: -1 }`: (Compound index for notifications list)

- **Schema Fields**:
  | Field Name | Type | Constraints | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `userId` | `ObjectId` | Ref: `User`, Required | - | Target recipient user ID |
  | `title` | `String` | Required | - | Alert title header |
  | `description` | `String` | Required | - | Detailed alert body |
  | `type` | `String` | Enum: `['order', 'message', 'promotion', 'system']`| - | Alert type |
  | `read` | `Boolean` | Required | `false` | Viewed status |
  | `readAt` | `Date` | Optional | - | Time when alert was read |
  | `activityLogId` | `ObjectId` | Ref: `ActivityLog`, Optional | - | Triggering activity trace ID |
  | `actionUrl` | `String` | Optional | - | Navigation path target url |

#### ActivityLog Schema (`activitylogs` collection)
Audits security and system events for user history.

- **Indexes**:
  - `{ userId: 1, timestamp: -1 }`: (Compound index for activity logs list)

- **Schema Fields**:
  | Field Name | Type | Constraints | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `userId` | `ObjectId` | Ref: `User`, Optional | - | Associated user ID |
  | `action` | `String` | Required | - | General action keyword (e.g. Login, Profile Update) |
  | `description` | `String` | Required | - | User-friendly logs audit |
  | `timestamp` | `Date` | Required | `Date.now` | Event occurrence timestamp |
  | `type` | `String` | Enum: `['auth', 'update', 'message', 'login', 'logout', 'profile_update', 'password_change', 'settings_change']`| - | Categorization tag |
  | `ip` | `String` | Optional | - | Remote IP Address |
  | `userAgent` | `String` | Optional | - | Device browser user-agent |
  | `riskLevel` | `String` | Enum: `['safe', 'low', 'medium', 'high']`| `'safe'` | Flagged security alert evaluation |

#### FCM Token Schema (`fcmtokens` collection)
Stores Google Firebase Cloud Messaging registration tokens for mobile push notifications.

- **Indexes**:
  - `token`: 1 (Unique)
  - `{ userId: 1, token: 1 }`: (Compound index for target dispatch)

- **Schema Fields**:
  | Field Name | Type | Constraints | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `userId` | `ObjectId` | Ref: `User`, Required | - | Associated user ID |
  | `token` | `String` | Required, Unique | - | Firebase Device Push token |
  | `deviceType` | `String` | Enum: `['desktop', 'mobile', 'tablet']`| `'desktop'`| Device form factor |
