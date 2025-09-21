# Real-time Collaboration & Concurrency Handling

## How Two Users Drawing Simultaneously Works

### Current Implementation

#### 1. **Shape Creation Flow**
```
User A draws circle → Canvas → WebSocket → Server → Database
                                        ↓
User B's canvas ← WebSocket broadcast ← Server
```

#### 2. **Unique Shape Identification**
```javascript
generateShapeId(): string {
    return `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```
- Each shape gets unique ID with timestamp
- No conflicts between simultaneous drawings
- Both shapes coexist on canvas

#### 3. **Database Storage Pattern**
```sql
-- Chat table stores shapes as JSON messages
INSERT INTO Chat (roomId, message, userId) VALUES (
    1, 
    '{"shape": {"id": "shape_123_abc", "type": "circle", "x": 100, "y": 100}}',
    'user_456'
);
```

### Concurrency Scenarios

#### **Scenario 1: Two Users Draw Different Shapes**
```
Time: T1
User A: Draws circle at (100, 100)
User B: Draws rectangle at (200, 200)

Result: Both shapes appear on all canvases
Database: Two separate records in Chat table
```

#### **Scenario 2: Two Users Draw at Same Location**
```
Time: T1
User A: Draws circle at (100, 100) - ID: shape_T1_A
User B: Draws circle at (100, 100) - ID: shape_T1_B

Result: Two overlapping circles (both visible)
Database: Two separate records
```

#### **Scenario 3: Shape Deletion Conflicts**
```
Time: T1 - User A deletes shape_123
Time: T1 - User B tries to delete same shape_123

Current: Both deletion attempts processed
Improvement needed: Idempotent deletion
```

## Technical Architecture

### **WebSocket Message Flow**
```javascript
// Client sends shape
ws.send(JSON.stringify({
    type: "chat",
    message: JSON.stringify({ shape: shapeData }),
    roomId: roomId
}));

// Server broadcasts to room participants
usersInRoom.forEach(user => {
    user.ws.send(JSON.stringify({
        type: "chat",
        message: message,
        roomId
    }));
});
```

### **Database Operations**
```javascript
// Save to database
await prismaClient.chat.create({
    data: {
        roomId: Number(roomId),
        message: JSON.stringify({ shape }),
        userId
    }
});
```

## Conflict Resolution Strategies

### **Current Approach: Optimistic Concurrency**
- ✅ No locking mechanisms
- ✅ Fast real-time updates
- ✅ Simple implementation
- ❌ No conflict detection
- ❌ Potential data inconsistencies

### **Recommended Improvements**

#### 1. **Operational Transform (OT)**
```javascript
// Transform operations based on concurrent changes
function transformOperation(op1, op2) {
    // Adjust coordinates, handle conflicts
    return transformedOp;
}
```

#### 2. **Conflict-free Replicated Data Types (CRDTs)**
```javascript
// Each operation is commutative and associative
const shape = {
    id: generateUniqueId(),
    operation: 'add',
    timestamp: Date.now(),
    data: shapeData
};
```

#### 3. **Event Sourcing with Snapshots**
```sql
-- Store all operations
CREATE TABLE DrawingEvents (
    id SERIAL PRIMARY KEY,
    roomId INT,
    eventType VARCHAR(50),
    eventData JSONB,
    timestamp TIMESTAMP,
    userId TEXT
);

-- Periodic snapshots
CREATE TABLE RoomSnapshots (
    roomId INT PRIMARY KEY,
    snapshot JSONB,
    lastEventId INT,
    createdAt TIMESTAMP
);
```

## Performance Considerations

### **Current Bottlenecks**
1. **Database writes for every shape**
2. **No message batching**
3. **Full canvas redraw on updates**
4. **No pagination for shape history**

### **Optimization Strategies**
```javascript
// 1. Batch operations
const batchOperations = [];
// Collect operations for 100ms, then batch insert

// 2. Delta updates
const deltaUpdate = {
    added: [newShapes],
    modified: [changedShapes],
    deleted: [removedShapeIds]
};

// 3. Spatial indexing
CREATE INDEX idx_shapes_spatial ON shapes 
USING GIST (ST_MakePoint(x, y));
```

## Interview Talking Points

### **Strengths of Current Implementation**
- Simple and functional
- Real-time synchronization
- Persistent storage
- Room-based isolation

### **Areas for Improvement**
- Add proper conflict resolution
- Implement operation batching
- Add shape versioning
- Optimize database queries
- Add offline support

### **Scalability Considerations**
- Redis for real-time state
- Database sharding by room
- WebSocket clustering
- CDN for static assets