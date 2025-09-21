# Database Administrator Interview - Detailed Questions & Answers
## Drawing App Project

---

## **POSTGRESQL & DATABASE FUNDAMENTALS**

### **Q1: What is PostgreSQL and why did you choose it for this collaborative drawing application?**

**Detailed Answer:**
PostgreSQL is an advanced, open-source object-relational database management system (ORDBMS) that emphasizes extensibility and SQL compliance.

**Why PostgreSQL for this project:**
- **ACID Compliance**: Ensures data integrity for concurrent drawing operations
- **JSON/JSONB Support**: Perfect for storing flexible shape data structures
- **Concurrent Performance**: Excellent MVCC (Multi-Version Concurrency Control) for real-time collaboration
- **Extensibility**: Can add custom data types for geometric shapes if needed
- **Reliability**: Battle-tested in production environments
- **Cost-effective**: Open-source with enterprise features

**Technical Implementation:**
```sql
-- Our database stores shapes as JSON in PostgreSQL
CREATE TABLE Chat (
    id SERIAL PRIMARY KEY,
    roomId INTEGER NOT NULL,
    message JSONB NOT NULL,  -- JSONB for better performance
    userId TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT NOW()
);

-- Example shape storage
INSERT INTO Chat (roomId, message, userId) VALUES (
    1,
    '{"shape": {"id": "shape_123", "type": "circle", "x": 100, "y": 100, "radius": 50}}',
    'user_456'
);
```

---

### **Q2: Explain your database schema design and the relationships between tables.**

**Detailed Answer:**

**Schema Overview:**
```sql
-- Users table for authentication
CREATE TABLE User (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,  -- Should be hashed in production
    name TEXT NOT NULL,
    photo TEXT,
    createdAt TIMESTAMP DEFAULT NOW()
);

-- Rooms table for drawing workspaces
CREATE TABLE Room (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    password TEXT,  -- Optional room password
    createdAt TIMESTAMP DEFAULT NOW(),
    adminId TEXT NOT NULL REFERENCES User(id)
);

-- Chat table stores all drawing operations
CREATE TABLE Chat (
    id SERIAL PRIMARY KEY,
    roomId INTEGER NOT NULL REFERENCES Room(id),
    message JSONB NOT NULL,
    userId TEXT NOT NULL REFERENCES User(id),
    createdAt TIMESTAMP DEFAULT NOW()
);
```

**Relationship Analysis:**
1. **User → Room (One-to-Many)**: One user can create multiple rooms
2. **Room → Chat (One-to-Many)**: One room contains multiple drawing operations
3. **User → Chat (One-to-Many)**: One user can perform multiple drawing operations

**Design Decisions:**
- **UUID for Users**: Better distribution and security
- **SERIAL for Rooms/Chats**: Sequential IDs for ordering
- **JSONB for Messages**: Flexible shape storage with indexing capabilities
- **Foreign Key Constraints**: Maintain referential integrity

---

### **Q3: How do you handle database migrations and schema changes?**

**Detailed Answer:**

**Using Prisma Migration System:**
```bash
# Development migrations
npx prisma migrate dev --name add_room_password

# Production deployment
npx prisma migrate deploy

# Reset for development
npx prisma migrate reset
```

**Migration Strategy:**
1. **Development Phase**: Use `migrate dev` for iterative changes
2. **Staging Testing**: Test migrations on staging environment
3. **Production Deployment**: Use `migrate deploy` with zero-downtime strategies
4. **Rollback Plan**: Always have rollback scripts ready

**Example Migration:**
```sql
-- Migration: 20250112_add_room_password
ALTER TABLE "Room" ADD COLUMN "password" TEXT;

-- Rollback script
ALTER TABLE "Room" DROP COLUMN "password";
```

**Best Practices:**
- Always backup before migrations
- Test migrations on staging first
- Use transactions for complex migrations
- Monitor performance impact
- Document all schema changes

---

## **PRISMA ORM QUESTIONS**

### **Q4: What is Prisma and what are its advantages in your project?**

**Detailed Answer:**

**Prisma Definition:**
Prisma is a next-generation ORM that provides type-safe database access, auto-generated queries, and declarative migrations.

**Key Advantages in Our Project:**

1. **Type Safety:**
```typescript
// Auto-generated types
const user: User = await prismaClient.user.create({
    data: {
        email: "user@example.com",
        password: "hashedPassword",
        name: "John Doe"
    }
});
```

2. **Relationship Handling:**
```typescript
// Easy relationship queries
const roomWithChats = await prismaClient.room.findUnique({
    where: { id: roomId },
    include: {
        chats: {
            orderBy: { id: 'asc' },
            take: 1000
        },
        admin: {
            select: { id: true, name: true, email: true }
        }
    }
});
```

3. **Migration Management:**
```prisma
// schema.prisma
model Room {
  id        Int      @id @default(autoincrement())
  slug      String   @unique
  password  String?
  createdAt DateTime @default(now())
  adminId   String
  admin     User     @relation(fields: [adminId], references: [id])
  chats     Chat[]
}
```

**Performance Benefits:**
- Connection pooling built-in
- Query optimization
- Lazy loading capabilities
- Efficient batch operations

---

### **Q5: How do you optimize Prisma queries for better performance?**

**Detailed Answer:**

**Query Optimization Strategies:**

1. **Select Only Required Fields:**
```typescript
// Bad - fetches all fields
const users = await prismaClient.user.findMany();

// Good - select specific fields
const users = await prismaClient.user.findMany({
    select: {
        id: true,
        name: true,
        email: true
    }
});
```

2. **Use Proper Indexing:**
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_chat_room_id ON Chat(roomId);
CREATE INDEX idx_chat_created_at ON Chat(createdAt);
CREATE INDEX idx_room_slug ON Room(slug);
```

3. **Batch Operations:**
```typescript
// Batch insert for multiple shapes
const shapes = await prismaClient.chat.createMany({
    data: shapesArray.map(shape => ({
        roomId: Number(roomId),
        message: JSON.stringify({ shape }),
        userId
    }))
});
```

4. **Connection Pool Configuration:**
```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection pooling
  connection_limit = 20
}
```

---

## **REAL-TIME COLLABORATION & CONCURRENCY**

### **Q6: How does your real-time collaboration system work technically?**

**Detailed Answer:**

**Architecture Overview:**
```
Frontend Canvas → WebSocket Client → WebSocket Server → Database
                                   ↓
Other Users ← WebSocket Broadcast ← Server Processing
```

**Technical Flow:**

1. **User Draws Shape:**
```typescript
// Frontend - Canvas.tsx
const shape = {
    id: generateShapeId(), // unique identifier
    type: "circle",
    x: 100,
    y: 100,
    radius: 50
};

// Send via WebSocket
socket.send(JSON.stringify({
    type: "chat",
    message: JSON.stringify({ shape }),
    roomId: roomId
}));
```

2. **Server Processing:**
```typescript
// WebSocket Server - ws-backend/src/index.ts
ws.on('message', async (data) => {
    const parsedData = JSON.parse(data);
    
    if (parsedData.type === "chat") {
        // Save to database
        await prismaClient.chat.create({
            data: {
                roomId: Number(parsedData.roomId),
                message: parsedData.message,
                userId
            }
        });
        
        // Broadcast to all room users
        const usersInRoom = users.filter(user => 
            user.rooms.includes(parsedData.roomId)
        );
        
        usersInRoom.forEach(user => {
            if (user.ws.readyState === WebSocket.OPEN) {
                user.ws.send(JSON.stringify({
                    type: "chat",
                    message: parsedData.message,
                    roomId: parsedData.roomId
                }));
            }
        });
    }
});
```

3. **Database Storage:**
```sql
-- Each drawing operation stored as separate record
INSERT INTO Chat (roomId, message, userId, createdAt) VALUES (
    1,
    '{"shape": {"id": "shape_123", "type": "circle", "x": 100, "y": 100}}',
    'user_456',
    NOW()
);
```

---

### **Q7: How do you handle two users drawing simultaneously? Explain the concurrency model.**

**Detailed Answer:**

**Concurrency Scenario Analysis:**

**Scenario 1: Two Users Draw Different Shapes**
```
Time: T1
User A: Draws circle at (100, 100) → ID: shape_1641234567_abc
User B: Draws rectangle at (200, 200) → ID: shape_1641234567_def

Result: Both shapes appear on all canvases
Database: Two separate records in Chat table
```

**Scenario 2: Two Users Draw at Same Location**
```
Time: T1 (same millisecond)
User A: Draws circle at (100, 100) → ID: shape_1641234567_abc
User B: Draws circle at (100, 100) → ID: shape_1641234567_def

Result: Two overlapping circles (both preserved)
Database: Two separate records
```

**Technical Implementation:**

1. **Unique ID Generation:**
```typescript
generateShapeId(): string {
    return `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
// Example: "shape_1641234567_k2j8h3m9"
```

2. **Optimistic Concurrency Control:**
```typescript
// No locking mechanism - both operations succeed
const addShape = async (shape) => {
    // Always succeeds, no conflict checking
    this.existingShapes.push(shape);
    this.clearCanvas(); // Redraw all shapes
    
    // Broadcast to other users
    socket.send(JSON.stringify({
        type: "chat",
        message: JSON.stringify({ shape }),
        roomId: this.roomId
    }));
};
```

3. **Conflict Resolution Strategy:**
```typescript
// Current: Last-Write-Wins + Preservation
// Both shapes coexist, no data loss
// Order determined by database insertion time

// Alternative: Operational Transform (not implemented)
const transformOperation = (op1, op2) => {
    // Adjust coordinates based on concurrent operations
    // More complex but handles conflicts better
};
```

**Advantages of Current Approach:**
- ✅ No data loss
- ✅ Simple implementation
- ✅ Fast real-time updates
- ✅ Natural collaborative behavior

**Limitations:**
- ❌ No conflict detection
- ❌ Potential visual overlaps
- ❌ No operation ordering guarantees

---

### **Q8: How do you handle shape deletion conflicts?**

**Detailed Answer:**

**Current Deletion Implementation:**
```typescript
// Frontend - Game.ts
deleteShape(shapeId: string) {
    // Remove locally
    this.existingShapes = this.existingShapes.filter(
        shape => shape.id !== shapeId
    );
    this.clearCanvas();
    
    // Send delete command
    const message = JSON.stringify({
        type: "delete_shape",
        shapeId: shapeId,
        roomId: this.roomId
    });
    this.socket.send(message);
}
```

**Server-side Deletion:**
```typescript
// WebSocket Server
if (parsedData.type === "delete_shape") {
    const { roomId, shapeId } = parsedData;
    
    // Delete from database
    await prismaClient.chat.deleteMany({
        where: {
            roomId: Number(roomId),
            message: {
                contains: `"id":"${shapeId}"`
            }
        }
    });
    
    // Broadcast deletion
    usersInRoom.forEach(user => {
        user.ws.send(JSON.stringify({
            type: "delete_shape",
            shapeId: shapeId,
            roomId
        }));
    });
}
```

**Conflict Scenarios:**

1. **Simultaneous Deletion:**
```
Time: T1
User A: Deletes shape_123
User B: Deletes shape_123 (same time)

Current Result: Both deletion attempts processed
Database: Shape deleted once (idempotent)
UI: Both users see shape removed
```

2. **Delete vs Modify Conflict:**
```
Time: T1
User A: Deletes shape_123
User B: Modifies shape_123

Current Result: Shape gets deleted, modification lost
Better Approach: Version-based conflict resolution
```

**Improvements Needed:**
```typescript
// Add version-based deletion
const deleteShape = async (shapeId, version) => {
    const result = await prismaClient.chat.deleteMany({
        where: {
            roomId: Number(roomId),
            message: {
                contains: `"id":"${shapeId}"`
            },
            version: version // Add version field
        }
    });
    
    if (result.count === 0) {
        // Shape already deleted or modified
        throw new Error("Shape no longer exists");
    }
};
```

---

## **DATABASE PERFORMANCE & OPTIMIZATION**

### **Q9: How would you optimize database queries for this real-time application?**

**Detailed Answer:**

**Current Performance Bottlenecks:**
1. Every shape creation hits database immediately
2. Full chat history loaded on room join
3. No query result caching
4. Linear search through JSON messages

**Optimization Strategies:**

1. **Indexing Strategy:**
```sql
-- Primary indexes
CREATE INDEX idx_chat_room_id ON Chat(roomId);
CREATE INDEX idx_chat_created_at ON Chat(createdAt);
CREATE INDEX idx_room_slug ON Room(slug);

-- Composite indexes
CREATE INDEX idx_chat_room_user ON Chat(roomId, userId);
CREATE INDEX idx_chat_room_time ON Chat(roomId, createdAt DESC);

-- JSON indexes for shape queries
CREATE INDEX idx_chat_shape_id ON Chat USING GIN ((message->'shape'->>'id'));
CREATE INDEX idx_chat_shape_type ON Chat USING GIN ((message->'shape'->>'type'));
```

2. **Query Optimization:**
```typescript
// Bad - loads all chat history
const messages = await prismaClient.chat.findMany({
    where: { roomId: Number(roomId) }
});

// Good - paginated with limits
const messages = await prismaClient.chat.findMany({
    where: { roomId: Number(roomId) },
    orderBy: { id: 'asc' },
    take: 1000, // Limit results
    skip: offset // Pagination
});

// Better - with caching
const cacheKey = `room_${roomId}_shapes`;
let messages = await redis.get(cacheKey);
if (!messages) {
    messages = await prismaClient.chat.findMany({
        where: { roomId: Number(roomId) },
        orderBy: { id: 'asc' },
        take: 1000
    });
    await redis.setex(cacheKey, 300, JSON.stringify(messages)); // 5min cache
}
```

3. **Batch Operations:**
```typescript
// Batch multiple shape operations
const batchShapes = [];
const BATCH_SIZE = 10;
const BATCH_TIMEOUT = 100; // ms

const processBatch = async () => {
    if (batchShapes.length > 0) {
        await prismaClient.chat.createMany({
            data: batchShapes.map(shape => ({
                roomId: shape.roomId,
                message: JSON.stringify({ shape: shape.data }),
                userId: shape.userId
            }))
        });
        batchShapes.length = 0;
    }
};

// Batch timer
setInterval(processBatch, BATCH_TIMEOUT);
```

4. **Connection Pool Optimization:**
```javascript
// DATABASE_URL with connection pooling
DATABASE_URL="postgresql://user:pass@localhost:5432/db?connection_limit=20&pool_timeout=20"

// Monitor connection usage
const getConnectionStats = async () => {
    const result = await prismaClient.$queryRaw`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
    `;
    return result;
};
```

---

### **Q10: How would you implement caching for better performance?**

**Detailed Answer:**

**Multi-Level Caching Strategy:**

1. **Redis for Real-time State:**
```typescript
// Cache active room states
const cacheRoomState = async (roomId: string, shapes: Shape[]) => {
    const key = `room:${roomId}:shapes`;
    await redis.setex(key, 3600, JSON.stringify(shapes)); // 1 hour
};

// Get cached room state
const getCachedRoomState = async (roomId: string) => {
    const key = `room:${roomId}:shapes`;
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
};
```

2. **Application-Level Caching:**
```typescript
// In-memory cache for frequently accessed rooms
class RoomCache {
    private cache = new Map<string, { shapes: Shape[], lastUpdate: number }>();
    private TTL = 5 * 60 * 1000; // 5 minutes
    
    get(roomId: string): Shape[] | null {
        const entry = this.cache.get(roomId);
        if (!entry || Date.now() - entry.lastUpdate > this.TTL) {
            this.cache.delete(roomId);
            return null;
        }
        return entry.shapes;
    }
    
    set(roomId: string, shapes: Shape[]) {
        this.cache.set(roomId, {
            shapes: [...shapes],
            lastUpdate: Date.now()
        });
    }
}
```

3. **Database Query Result Caching:**
```typescript
// Cache expensive queries
const getRoomWithCache = async (roomSlug: string) => {
    const cacheKey = `room:slug:${roomSlug}`;
    
    // Try cache first
    let room = await redis.get(cacheKey);
    if (room) {
        return JSON.parse(room);
    }
    
    // Fetch from database
    room = await prismaClient.room.findFirst({
        where: { slug: roomSlug },
        include: {
            admin: {
                select: { id: true, name: true, email: true }
            }
        }
    });
    
    // Cache result
    if (room) {
        await redis.setex(cacheKey, 1800, JSON.stringify(room)); // 30 min
    }
    
    return room;
};
```

4. **Cache Invalidation Strategy:**
```typescript
// Invalidate cache on updates
const invalidateRoomCache = async (roomId: string) => {
    const keys = [
        `room:${roomId}:shapes`,
        `room:${roomId}:metadata`,
        `room:slug:*` // Pattern-based invalidation
    ];
    
    await Promise.all(keys.map(key => redis.del(key)));
};

// Smart cache updates
const updateRoomCache = async (roomId: string, newShape: Shape) => {
    const cached = await getCachedRoomState(roomId);
    if (cached) {
        cached.push(newShape);
        await cacheRoomState(roomId, cached);
    }
};
```

---

## **SCALING & ARCHITECTURE**

### **Q11: How would you scale this database system for millions of users?**

**Detailed Answer:**

**Scaling Strategy:**

1. **Database Scaling:**
```sql
-- Horizontal partitioning by room
CREATE TABLE Chat_Partition_1 (
    CHECK (roomId >= 1 AND roomId < 1000000)
) INHERITS (Chat);

CREATE TABLE Chat_Partition_2 (
    CHECK (roomId >= 1000000 AND roomId < 2000000)
) INHERITS (Chat);

-- Partition function
CREATE OR REPLACE FUNCTION chat_insert_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.roomId >= 1 AND NEW.roomId < 1000000) THEN
        INSERT INTO Chat_Partition_1 VALUES (NEW.*);
    ELSIF (NEW.roomId >= 1000000 AND NEW.roomId < 2000000) THEN
        INSERT INTO Chat_Partition_2 VALUES (NEW.*);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

2. **Read Replicas:**
```typescript
// Master-slave configuration
const masterDB = new PrismaClient({
    datasources: {
        db: { url: process.env.MASTER_DATABASE_URL }
    }
});

const replicaDB = new PrismaClient({
    datasources: {
        db: { url: process.env.REPLICA_DATABASE_URL }
    }
});

// Route queries appropriately
const readQuery = async (query) => {
    return await replicaDB.$queryRaw(query);
};

const writeQuery = async (query) => {
    return await masterDB.$queryRaw(query);
};
```

3. **Microservices Architecture:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Service  │    │   Room Service  │    │  Drawing Service│
│                 │    │                 │    │                 │
│ - Authentication│    │ - Room CRUD     │    │ - Shape Storage │
│ - User Profile  │    │ - Room Access   │    │ - Real-time Sync│
│ - Sessions      │    │ - Permissions   │    │ - Collaboration │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Message Queue  │
                    │   (Redis/RabbitMQ)│
                    └─────────────────┘
```

4. **Event Sourcing for Scale:**
```typescript
// Event-driven architecture
interface DrawingEvent {
    id: string;
    roomId: string;
    userId: string;
    eventType: 'SHAPE_ADDED' | 'SHAPE_DELETED' | 'SHAPE_MODIFIED';
    eventData: any;
    timestamp: Date;
    version: number;
}

// Event store
const storeEvent = async (event: DrawingEvent) => {
    await prismaClient.drawingEvent.create({
        data: event
    });
    
    // Publish to message queue
    await messageQueue.publish('drawing.events', event);
};

// Event replay for room state
const replayRoomEvents = async (roomId: string, fromVersion = 0) => {
    const events = await prismaClient.drawingEvent.findMany({
        where: {
            roomId,
            version: { gt: fromVersion }
        },
        orderBy: { version: 'asc' }
    });
    
    return events.reduce((state, event) => {
        return applyEvent(state, event);
    }, initialState);
};
```

---

## **SECURITY & DATA INTEGRITY**

### **Q12: How do you ensure data security and integrity in your database?**

**Detailed Answer:**

**Current Security Measures:**

1. **Connection Security:**
```javascript
// SSL/TLS encryption
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

// Environment-based credentials
const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.NODE_ENV === 'production'
};
```

2. **SQL Injection Prevention:**
```typescript
// Prisma provides automatic SQL injection protection
// Bad (vulnerable to SQL injection)
const query = `SELECT * FROM users WHERE email = '${userEmail}'`;

// Good (Prisma parameterized queries)
const user = await prismaClient.user.findFirst({
    where: { email: userEmail } // Automatically parameterized
});
```

3. **Authentication & Authorization:**
```typescript
// JWT token validation
const verifyToken = (token: string) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        throw new Error('Invalid token');
    }
};

// Room access control
const checkRoomAccess = async (userId: string, roomId: string) => {
    const room = await prismaClient.room.findFirst({
        where: { id: Number(roomId) }
    });
    
    // Check if user is admin or room is public
    if (room.password && room.adminId !== userId) {
        throw new Error('Access denied');
    }
    
    return true;
};
```

**Security Improvements Needed:**

1. **Password Hashing:**
```typescript
import bcrypt from 'bcrypt';

// Hash passwords before storing
const hashPassword = async (password: string) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};

// Verify passwords
const verifyPassword = async (password: string, hash: string) => {
    return await bcrypt.compare(password, hash);
};

// Updated signup endpoint
app.post("/signup", async (req, res) => {
    const { email, password, name } = req.body;
    
    const hashedPassword = await hashPassword(password);
    
    const user = await prismaClient.user.create({
        data: {
            email,
            password: hashedPassword, // Store hashed password
            name
        }
    });
    
    res.json({ userId: user.id, token: generateToken(user.id) });
});
```

2. **Data Validation:**
```typescript
// Input sanitization
const sanitizeInput = (input: string) => {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential XSS characters
        .substring(0, 1000); // Limit length
};

// Validate shape data
const validateShape = (shape: any) => {
    const allowedTypes = ['circle', 'rect', 'pencil', 'text'];
    
    if (!allowedTypes.includes(shape.type)) {
        throw new Error('Invalid shape type');
    }
    
    // Validate coordinates
    if (typeof shape.x !== 'number' || typeof shape.y !== 'number') {
        throw new Error('Invalid coordinates');
    }
    
    return true;
};
```

3. **Rate Limiting:**
```typescript
// Prevent spam/abuse
const rateLimiter = new Map();

const checkRateLimit = (userId: string, action: string) => {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100; // Max 100 shapes per minute
    
    if (!rateLimiter.has(key)) {
        rateLimiter.set(key, { count: 1, resetTime: now + windowMs });
        return true;
    }
    
    const limit = rateLimiter.get(key);
    if (now > limit.resetTime) {
        limit.count = 1;
        limit.resetTime = now + windowMs;
        return true;
    }
    
    if (limit.count >= maxRequests) {
        throw new Error('Rate limit exceeded');
    }
    
    limit.count++;
    return true;
};
```

---

## **MONITORING & TROUBLESHOOTING**

### **Q13: How would you monitor database performance and troubleshoot issues?**

**Detailed Answer:**

**Monitoring Strategy:**

1. **Database Metrics:**
```sql
-- Connection monitoring
SELECT 
    count(*) as total_connections,
    count(*) FILTER (WHERE state = 'active') as active_connections,
    count(*) FILTER (WHERE state = 'idle') as idle_connections
FROM pg_stat_activity;

-- Query performance
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Table statistics
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows
FROM pg_stat_user_tables;
```

2. **Application Monitoring:**
```typescript
// Custom metrics collection
class DatabaseMetrics {
    private metrics = {
        queryCount: 0,
        queryTime: 0,
        connectionCount: 0,
        errorCount: 0
    };
    
    recordQuery(duration: number) {
        this.metrics.queryCount++;
        this.metrics.queryTime += duration;
    }
    
    recordError() {
        this.metrics.errorCount++;
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            avgQueryTime: this.metrics.queryTime / this.metrics.queryCount
        };
    }
}

// Query wrapper with monitoring
const monitoredQuery = async (query: () => Promise<any>) => {
    const start = Date.now();
    try {
        const result = await query();
        metrics.recordQuery(Date.now() - start);
        return result;
    } catch (error) {
        metrics.recordError();
        throw error;
    }
};
```

3. **Alerting System:**
```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Database connectivity check
        await prismaClient.$queryRaw`SELECT 1`;
        
        // Performance checks
        const metrics = await getPerformanceMetrics();
        
        const health = {
            status: 'healthy',
            database: 'connected',
            metrics: {
                avgResponseTime: metrics.avgQueryTime,
                activeConnections: metrics.connectionCount,
                errorRate: metrics.errorCount / metrics.queryCount
            }
        };
        
        // Alert if thresholds exceeded
        if (health.metrics.avgResponseTime > 1000) {
            await sendAlert('High database response time');
        }
        
        res.json(health);
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});
```

**Troubleshooting Approach:**

1. **Slow Query Analysis:**
```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s
SELECT pg_reload_conf();

-- Analyze slow queries
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM Chat 
WHERE roomId = 1 
ORDER BY createdAt DESC 
LIMIT 1000;
```

2. **Index Analysis:**
```sql
-- Find missing indexes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public' 
AND n_distinct > 100;

-- Index usage statistics
SELECT 
    indexrelname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes;
```

---

## **BACKUP & DISASTER RECOVERY**

### **Q14: What backup and disaster recovery strategy would you implement?**

**Detailed Answer:**

**Comprehensive Backup Strategy:**

1. **Automated Backups:**
```bash
#!/bin/bash
# Daily backup script
BACKUP_DIR="/backups/$(date +%Y-%m-%d)"
mkdir -p $BACKUP_DIR

# Full database backup
pg_dump -h localhost -U postgres -d drawing_app \
    --format=custom \
    --compress=9 \
    --file="$BACKUP_DIR/drawing_app_$(date +%H%M%S).backup"

# Backup verification
pg_restore --list "$BACKUP_DIR/drawing_app_$(date +%H%M%S).backup" > /dev/null
if [ $? -eq 0 ]; then
    echo "Backup verified successfully"
else
    echo "Backup verification failed" | mail -s "Backup Alert" admin@company.com
fi

# Cleanup old backups (keep 30 days)
find /backups -type d -mtime +30 -exec rm -rf {} \;
```

2. **Point-in-Time Recovery:**
```sql
-- Enable WAL archiving
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'cp %p /archive/%f';
SELECT pg_reload_conf();

-- Create base backup
SELECT pg_start_backup('base_backup');
-- Copy data directory
SELECT pg_stop_backup();
```

3. **Cross-Region Replication:**
```bash
# Streaming replication setup
# On primary server
ALTER SYSTEM SET max_wal_senders = 3;
ALTER SYSTEM SET wal_keep_segments = 64;

# Create replication user
CREATE USER replicator REPLICATION LOGIN CONNECTION LIMIT 1 ENCRYPTED PASSWORD 'password';

# On replica server
pg_basebackup -h primary_server -D /var/lib/postgresql/data -U replicator -P -W
```

4. **Disaster Recovery Plan:**
```typescript
// Automated failover detection
const checkPrimaryHealth = async () => {
    try {
        await primaryDB.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        console.error('Primary database unreachable:', error);
        return false;
    }
};

const failoverToReplica = async () => {
    console.log('Initiating failover to replica...');
    
    // Update application configuration
    process.env.DATABASE_URL = process.env.REPLICA_DATABASE_URL;
    
    // Reinitialize Prisma client
    await prismaClient.$disconnect();
    const newClient = new PrismaClient();
    
    // Update DNS/load balancer
    await updateLoadBalancer('replica_endpoint');
    
    // Send alerts
    await sendAlert('Database failover completed');
};

// Health monitoring
setInterval(async () => {
    const isHealthy = await checkPrimaryHealth();
    if (!isHealthy) {
        await failoverToReplica();
    }
}, 30000); // Check every 30 seconds
```

**Recovery Testing:**
```bash
# Monthly recovery test
#!/bin/bash
TEST_DB="drawing_app_recovery_test"

# Restore from backup
pg_restore -h localhost -U postgres -d $TEST_DB \
    /backups/latest/drawing_app.backup

# Verify data integrity
psql -d $TEST_DB -c "
    SELECT 
        COUNT(*) as total_users,
        COUNT(DISTINCT id) as unique_users
    FROM User;
    
    SELECT 
        COUNT(*) as total_rooms,
        COUNT(DISTINCT slug) as unique_rooms
    FROM Room;
    
    SELECT 
        COUNT(*) as total_chats,
        MIN(createdAt) as oldest_chat,
        MAX(createdAt) as newest_chat
    FROM Chat;
"

# Cleanup test database
dropdb $TEST_DB
```

---

This comprehensive preparation covers all major aspects of database administration for your drawing app project. Practice explaining these concepts clearly and be ready to dive deeper into any specific area the interviewer focuses on.