# Architecture Documentation

This folder contains technical architecture, database design, and network infrastructure documentation for CatalogIt.

## Files

### Database Design
- **erd-business-rules.md** - Entity Relationship Diagram and business rules
  - Converted from: `CatalogItERDAndBusinessRules (1).docx`
  - Contains: Entity definitions, data integrity rules, system assumptions
  - Format: Markdown (version control friendly)

- **CatalogIt-ERD (1).json** - ERD in structured JSON format
  - Contains: User, List, Item, Feedback, Category entities
  - Use: For automated documentation generation or visualization tools

### Network & Infrastructure
- **network-design.md** - Complete network architecture and security design
  - Converted from: `CatalogItNetworkDesign (1).docx`
  - Contains: AWS architecture, security layers, defense-in-depth strategy
  - Covers: CloudFront, WAF, ALB, VPC, subnet design, database tier

- **CatalogItNetworkDiagram (1).png** - Visual network architecture diagram
  - Shows: Cloud infrastructure layout
  - Size: 365KB
  - Use: Reference for deployment and security discussions

## Key Architectural Decisions

### Database (PostgreSQL - 3NF)
- **Normalization:** Third Normal Form (3NF)
- **Core Entities:**
  - Users (authentication, roles, profiles)
  - Lists (user catalogs, visibility control)
  - Items (catalog entries, ratings, categories)
  - Feedback (user comments on lists)
  - Categories (item classification)

### Security Architecture
- **Defense in Depth:** Multiple security layers
- **Tiers:**
  1. **Edge:** CloudFront CDN + WAF
  2. **Network:** Public/Private subnets, NAT Gateway
  3. **Application:** Auto-scaling EC2, session management
  4. **Database:** Isolated subnet, read replicas, encryption

### Business Rules Highlights
- User status: Active, Suspended, Deleted
- List visibility: Private, Shared, Public
- Item ratings: 1.0 to 5.0 scale
- Cascading deletes: User deletion removes all associated data
- Role-based access: User, BusinessAdmin, SystemAdmin

## Security Requirements

### Authentication & Authorization
- JWT token-based authentication ✅ Implemented
- Password hashing with bcrypt ✅ Implemented
- MFA for admin roles (planned)
- Rate limiting on feedback (planned)

### Data Protection
- Encryption at rest (AES-256)
- SSL/TLS for data in transit
- Input sanitization (XSS prevention)
- Object-level authorization (IDOR prevention)

### Transaction Security
- User creation: Server-side password hashing
- Login: TLS 1.2/1.3 encryption
- List visibility changes: Authorization checks
- Export (future): Re-authentication required

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Complete | Users, Lists, Items tables |
| Backend API | ✅ Complete | CRUD + Authentication |
| Authentication | ✅ Complete | JWT-based auth system |
| Network Design | 📋 Documented | AWS architecture defined |
| WAF/CDN | ⏳ Planned | Phase 8 (Mar 1-7) |
| Database Encryption | ⏳ Planned | Production deployment |
| Read Replicas | ⏳ Planned | Scale optimization |

## Reference Documents

For implementation details:
- **API Documentation:** `/backend/AUTHENTICATION.md`
- **Database Schema:** `/backend/db/schema.rb`
- **Requirements Analysis:** `/docs/requirements/REQUIREMENTS_SUMMARY.md`
- **Project Charter:** `/docs/requirements/project-charter.md`

## Development vs. Production

### Current (Development)
- Local PostgreSQL database
- Single server instance
- No CDN/WAF
- Development SSL certificates

### Planned (Production)
- AWS RDS PostgreSQL
- Multi-AZ deployment
- CloudFront + WAF configured
- Auto-scaling application tier
- Read replicas for public queries
- Full encryption (at rest & in transit)
