# Database Administrator Interview Questions - Drawing App Project

## PostgreSQL Specific Questions

### Basic PostgreSQL Concepts
1. **What is PostgreSQL and why did you choose it for this project?**
   - Open-source RDBMS with ACID compliance
   - Strong JSON support for storing drawing data
   - Excellent concurrency control
   - Robust indexing capabilities

2. **Explain the database schema design for your drawing app**
   - User table: Authentication and user management
   - Room table: Drawing rooms/workspaces
   - Chat table: Stores drawing shapes as JSON messages

3. **How do you handle database connections in your application?**
   - Connection pooling through Prisma
   - Environment-based configuration
   - Connection lifecycle management

### Advanced PostgreSQL Topics
4. **What are ACID properties and how does PostgreSQL implement them?**
   - Atomicity: All-or-nothing transactions
   - Consistency: Data integrity constraints
   - Isolation: Concurrent transaction handling
   - Durability: Persistent storage guarantees

5. **Explain PostgreSQL's MVCC (Multi-Version Concurrency Control)**
   - How it handles concurrent reads/writes
   - Transaction isolation levels
   - Snapshot isolation implementation

6. **What indexing strategies would you use for this application?**
   - Primary keys on id columns
   - Unique indexes on email, room slug
   - Composite indexes for roomId + userId queries
   - JSON indexes for shape data if needed

## Prisma ORM Questions

### Prisma Fundamentals
7. **What is Prisma and what are its advantages?**
   - Type-safe database client
   - Auto-generated types
   - Migration management
   - Query optimization

8. **Explain your Prisma schema design**
   ```prisma
   model User {
     id       String @id @default(uuid())
     email    String @unique
     password String
     name     String
     rooms    Room[]
     chats    Chat[]
   }
   ```

9. **How do you handle database migrations with Prisma?**
   - `prisma migrate dev` for development
   - `prisma migrate deploy` for production
   - Migration rollback strategies

### Advanced Prisma Concepts
10. **What are Prisma relations and how do you optimize them?**
    - One-to-many: User -> Rooms, Room -> Chats
    - Foreign key constraints
    - Eager vs lazy loading strategies

11. **How do you handle database seeding and testing?**
    - Prisma seed scripts
    - Test database isolation
    - Factory patterns for test data

## Real-time Collaboration & Concurrency

### WebSocket Architecture
12. **How does your real-time system work?**
    - WebSocket server for real-time communication
    - HTTP backend for REST operations
    - Database for persistence

13. **Explain the data flow when a user draws a shape**
    ```
    User draws → Canvas → WebSocket → Server → Database
                                   ↓
    Other users ← WebSocket ← Server broadcast
    ```

### Concurrency Control
14. **How do you handle concurrent drawing operations?**
    - Each shape gets unique ID with timestamp
    - Optimistic concurrency (no locking)
    - Last-write-wins for conflicts
    - Real-time synchronization via WebSocket

15. **What happens when two users draw simultaneously?**
    - Both shapes are preserved (no conflicts)
    - Each shape has unique identifier
    - Real-time broadcast to all room participants
    - Database stores all operations

## Database Performance & Optimization

### Query Optimization
16. **How would you optimize database queries for this application?**
    - Index on roomId for chat queries
    - Limit chat history retrieval (pagination)
    - Connection pooling
    - Query result caching

17. **What monitoring would you implement?**
    - Query performance metrics
    - Connection pool monitoring
    - Database size and growth tracking
    - Slow query logging

### Scaling Considerations
18. **How would you scale this database system?**
    - Read replicas for query distribution
    - Horizontal partitioning by room
    - Redis for session management
    - CDN for static assets

## Data Consistency & Backup

### Backup Strategies
19. **What backup strategy would you implement?**
    - Automated daily backups
    - Point-in-time recovery
    - Cross-region backup replication
    - Backup testing procedures

20. **How do you ensure data consistency across services?**
    - Database transactions
    - Event sourcing for critical operations
    - Eventual consistency for real-time updates
    - Conflict resolution strategies

## Security & Access Control

### Database Security
21. **What security measures have you implemented?**
    - Environment-based credentials
    - Connection encryption (SSL/TLS)
    - SQL injection prevention via Prisma
    - Role-based access control

22. **How do you handle user authentication in the database?**
    - JWT token validation
    - Password hashing (should be implemented)
    - Session management
    - User authorization levels

## Troubleshooting & Maintenance

### Common Issues
23. **How would you troubleshoot database performance issues?**
    - Query execution plan analysis
    - Index usage monitoring
    - Connection pool analysis
    - Resource utilization tracking

24. **What maintenance tasks would you schedule?**
    - Regular VACUUM operations
    - Index rebuilding
    - Statistics updates
    - Log rotation

## Project-Specific Technical Questions

### Architecture Decisions
25. **Why did you choose to store shapes as JSON in chat messages?**
    - Flexibility for different shape types
    - Easy serialization/deserialization
    - Maintains drawing operation history
    - Simple WebSocket message format

26. **How do you handle room-based data isolation?**
    - Foreign key relationships
    - Query filtering by roomId
    - User authorization checks
    - Data access patterns

### Real-world Scenarios
27. **What would happen if the WebSocket connection drops?**
    - Client reconnection logic
    - State synchronization on reconnect
    - Missed message recovery
    - Graceful degradation

28. **How would you implement drawing history/undo functionality?**
    - Event sourcing pattern
    - Command pattern for operations
    - Snapshot + delta storage
    - Temporal data modeling