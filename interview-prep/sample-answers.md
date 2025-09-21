# Sample Interview Answers

## "How do you handle concurrent users drawing on the same canvas?"

**Answer:**
"In our drawing application, we handle concurrency through a combination of optimistic concurrency control and real-time synchronization:

1. **Unique Shape Identification**: Each shape gets a unique ID combining timestamp and random string, preventing ID conflicts when users draw simultaneously.

2. **Real-time Broadcasting**: When a user draws, the shape data is sent via WebSocket to our server, stored in PostgreSQL, and immediately broadcast to all other users in the room.

3. **No Locking Strategy**: We use optimistic concurrency - both shapes coexist rather than one overwriting the other. This provides better user experience for collaborative drawing.

4. **Database Design**: We store shapes as JSON messages in a Chat table, which provides flexibility and maintains the complete drawing history.

**Current Limitations & Improvements:**
- We could implement Operational Transform for more sophisticated conflict resolution
- Add event sourcing for better audit trails
- Implement shape versioning for undo/redo functionality"

## "Explain your database schema and why you designed it this way"

**Answer:**
"Our schema follows a simple but effective design:

```sql
User: id, email, password, name
Room: id, slug, password, adminId, createdAt  
Chat: id, roomId, message, userId
```

**Design Rationale:**
1. **User Table**: Standard authentication with UUID primary keys for better distribution
2. **Room Table**: Uses human-readable slugs for URLs, optional passwords for privacy
3. **Chat Table**: Stores drawing operations as JSON messages - this gives us flexibility to store different shape types without schema changes

**Relationships:**
- One-to-many: User → Rooms (admin relationship)
- One-to-many: Room → Chats (drawing history)
- Many-to-one: Chat → User (who drew what)

**Benefits:**
- Simple to understand and maintain
- Flexible shape storage via JSON
- Complete audit trail of all drawing operations
- Easy to query room-specific data"

## "How would you optimize this system for better performance?"

**Answer:**
"Several optimization strategies I would implement:

**Database Level:**
1. **Indexing**: Add composite index on (roomId, createdAt) for efficient chat retrieval
2. **Partitioning**: Partition Chat table by roomId for large-scale deployments
3. **Connection Pooling**: Already using Prisma's connection pooling
4. **Query Optimization**: Limit chat history queries, implement pagination

**Application Level:**
1. **Message Batching**: Batch multiple drawing operations before database writes
2. **Redis Caching**: Cache active room states in Redis for faster access
3. **Delta Updates**: Send only changes rather than full canvas state
4. **Spatial Indexing**: For collision detection and area-based queries

**Infrastructure:**
1. **Read Replicas**: Distribute read queries across replicas
2. **CDN**: Cache static assets and room metadata
3. **WebSocket Clustering**: Scale WebSocket servers horizontally

**Monitoring:**
- Query performance metrics
- Real-time connection monitoring
- Database growth tracking"