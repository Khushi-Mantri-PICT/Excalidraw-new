# Backend Endpoints Guide - Drawing App

## **HTTP Backend Endpoints (Port 3001)**

### **Authentication Endpoints**

#### **POST /signup**
**Purpose**: Create a new user account
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Response (Success - 200)**:
```json
{
  "userId": "uuid-string",
  "token": "jwt-token",
  "message": "Account created successfully"
}
```

**Response (Error - 400)**:
```json
{
  "message": "Validation failed",
  "errors": {
    "email": "Please enter a valid email address",
    "password": "Password must contain at least one uppercase letter"
  }
}
```

**Response (Error - 411)**:
```json
{
  "message": "User already exists with this email"
}
```

**Implementation Details**:
- Validates input using Zod schema
- **Security Issue**: Passwords stored in plain text (should be hashed)
- Returns JWT token immediately after signup
- Creates user in PostgreSQL database

---

#### **POST /signin**
**Purpose**: Authenticate existing user
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (Success - 200)**:
```json
{
  "token": "jwt-token",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Response (Error - 403)**:
```json
{
  "message": "Invalid email or password"
}
```

**Implementation Details**:
- Plain text password comparison (security vulnerability)
- Returns JWT token for session management
- User data stored in localStorage on frontend

---

### **Room Management Endpoints**

#### **POST /room** (Protected)
**Purpose**: Create a new drawing room
**Headers**: `Authorization: Bearer <jwt-token>`
**Request Body**:
```json
{
  "name": "Team Brainstorm",
  "password": "optional-room-password"
}
```

**Response (Success - 200)**:
```json
{
  "roomId": 1,
  "roomSlug": "Team Brainstorm"
}
```

**Response (Error - 411)**:
```json
{
  "message": "Room already exists with this name"
}
```

**Implementation Details**:
- Requires JWT authentication via middleware
- Room slug must be unique
- Optional password for private rooms
- Creator becomes room admin

---

#### **POST /room/join** (Protected)
**Purpose**: Join an existing room
**Headers**: `Authorization: Bearer <jwt-token>`
**Request Body**:
```json
{
  "name": "Team Brainstorm",
  "password": "room-password-if-required"
}
```

**Response (Success - 200)**:
```json
{
  "roomId": 1,
  "roomSlug": "Team Brainstorm"
}
```

**Response (Error - 404)**:
```json
{
  "message": "Room not found"
}
```

**Response (Error - 403)**:
```json
{
  "message": "Incorrect room password"
}
```

**Implementation Details**:
- Validates room password if room is private
- Returns room ID for WebSocket connection

---

### **Data Retrieval Endpoints**

#### **GET /chats/:roomId**
**Purpose**: Get all drawing shapes/messages for a room
**URL Parameters**: `roomId` (integer)
**Response (Success - 200)**:
```json
{
  "messages": [
    {
      "id": 1,
      "roomId": 1,
      "message": "{\"shape\":{\"id\":\"shape_123\",\"type\":\"circle\",\"x\":100,\"y\":100,\"radius\":50}}",
      "userId": "user-uuid",
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ]
}
```

**Implementation Details**:
- No authentication required (potential security issue)
- Returns up to 1000 messages ordered by ID
- Messages contain JSON-encoded shape data
- Used to load existing drawings when joining room

---

#### **GET /room/:roomSlug**
**Purpose**: Get room information by slug
**URL Parameters**: `roomSlug` (string)
**Response (Success - 200)**:
```json
{
  "room": {
    "id": 1,
    "slug": "Team Brainstorm",
    "password": "encrypted-password",
    "createdAt": "2024-01-01T10:00:00Z",
    "adminId": "admin-uuid",
    "admin": {
      "id": "admin-uuid",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Response (Error - 404)**:
```json
{
  "message": "Room not found"
}
```

**Implementation Details**:
- Public endpoint (no authentication)
- Includes admin information
- Used for room preview before joining

---

## **WebSocket Backend (Port 8080)**

### **Connection Setup**
**URL**: `ws://localhost:8080?token=<jwt-token>`
**Authentication**: JWT token in query parameter

**Connection Flow**:
1. Client connects with JWT token
2. Server validates token
3. If valid, connection established
4. If invalid, connection closed immediately

---

### **WebSocket Message Types**

#### **1. JOIN_ROOM**
**Purpose**: Join a specific drawing room
**Client → Server**:
```json
{
  "type": "join_room",
  "roomId": "1"
}
```

**Server Response**: No direct response, but user added to room's user list

**Implementation Details**:
- Adds user to room's participant list
- Required before receiving room updates
- User can join multiple rooms simultaneously

---

#### **2. LEAVE_ROOM**
**Purpose**: Leave a drawing room
**Client → Server**:
```json
{
  "type": "leave_room",
  "roomId": "1"
}
```

**Implementation Details**:
- Removes user from room's participant list
- Stops receiving updates for that room

---

#### **3. CHAT (Drawing Operations)**
**Purpose**: Send drawing shapes to other users
**Client → Server**:
```json
{
  "type": "chat",
  "message": "{\"shape\":{\"id\":\"shape_123\",\"type\":\"circle\",\"x\":100,\"y\":100,\"radius\":50}}",
  "roomId": "1"
}
```

**Server → All Room Users**:
```json
{
  "type": "chat",
  "message": "{\"shape\":{\"id\":\"shape_123\",\"type\":\"circle\",\"x\":100,\"y\":100,\"radius\":50}}",
  "roomId": "1"
}
```

**Implementation Details**:
- Saves shape to database (Chat table)
- Broadcasts to all users in the room
- Real-time synchronization of drawings
- Message contains JSON-encoded shape data

---

#### **4. DELETE_SHAPE**
**Purpose**: Delete a specific shape from canvas
**Client → Server**:
```json
{
  "type": "delete_shape",
  "shapeId": "shape_123",
  "roomId": "1"
}
```

**Server → All Room Users**:
```json
{
  "type": "delete_shape",
  "shapeId": "shape_123",
  "roomId": "1"
}
```

**Implementation Details**:
- Deletes shape from database using LIKE query on message content
- Broadcasts deletion to all room participants
- Used by eraser tool functionality

---

#### **5. CLEAR_CANVAS**
**Purpose**: Clear all shapes from the canvas
**Client → Server**:
```json
{
  "type": "clear_canvas",
  "roomId": "1"
}
```

**Server → All Room Users**:
```json
{
  "type": "clear_canvas",
  "roomId": "1"
}
```

**Implementation Details**:
- Deletes ALL chat records for the room
- Broadcasts clear command to all participants
- Irreversible operation (no undo)

---

## **Data Flow Architecture**

### **Complete User Journey**:

1. **Authentication**:
   ```
   POST /signup or /signin → JWT Token → Store in localStorage
   ```

2. **Room Creation/Joining**:
   ```
   POST /room (create) or POST /room/join → Get roomId
   ```

3. **WebSocket Connection**:
   ```
   Connect to WS with JWT → Send join_room → Start receiving updates
   ```

4. **Drawing Operations**:
   ```
   User draws → Canvas captures → Send via WS → Server saves to DB → Broadcast to all users
   ```

5. **Real-time Updates**:
   ```
   Other users receive WS message → Parse shape data → Update their canvas
   ```

---

## **Database Integration**

### **HTTP Backend Database Operations**:
```typescript
// User creation
await prismaClient.user.create({
    data: { email, password, name }
});

// Room creation
await prismaClient.room.create({
    data: { slug, password, adminId }
});

// Get room messages
await prismaClient.chat.findMany({
    where: { roomId: Number(roomId) },
    orderBy: { id: 'asc' },
    take: 1000
});
```

### **WebSocket Backend Database Operations**:
```typescript
// Save drawing operation
await prismaClient.chat.create({
    data: {
        roomId: Number(roomId),
        message: JSON.stringify({ shape }),
        userId
    }
});

// Delete shape
await prismaClient.chat.deleteMany({
    where: {
        roomId: Number(roomId),
        message: { contains: `"id":"${shapeId}"` }
    }
});

// Clear all shapes
await prismaClient.chat.deleteMany({
    where: { roomId: Number(roomId) }
});
```

---

## **Security Considerations**

### **Current Vulnerabilities**:
1. **Plain text passwords** in database
2. **No rate limiting** on endpoints
3. **Public access** to chat history
4. **No input sanitization** for shape data
5. **CORS enabled for all origins**

### **Recommended Improvements**:
1. **Hash passwords** with bcrypt
2. **Add rate limiting** middleware
3. **Authenticate chat endpoint**
4. **Validate and sanitize** all inputs
5. **Implement proper CORS** policy
6. **Add request logging** and monitoring

---

## **Performance Considerations**

### **Current Bottlenecks**:
1. **No pagination** for chat history (loads all 1000 messages)
2. **No caching** for frequently accessed data
3. **Individual database writes** for each shape
4. **No connection pooling** optimization

### **Optimization Strategies**:
1. **Implement pagination** for chat history
2. **Add Redis caching** for room data
3. **Batch database operations** where possible
4. **Optimize database queries** with proper indexing
5. **Add connection pooling** configuration

This comprehensive guide covers all endpoints and their implementation details, perfect for your database administrator interview preparation!