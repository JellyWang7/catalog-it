# Network Diagram (Packet Tracer) — topology + justification + screenshots

This project’s real deployment is cloud-based (AWS). Packet Tracer is used here to create a **logical network analogy** that demonstrates devices, connections, and traffic flow.

## Packet Tracer topology (recommended)

### Devices to add

- **PC-User** (end user device)
- **Router-ISP** (internet edge)
- **Switch-LAN** (local switching)
- **Server-Web** (represents CloudFront/S3 “public web” entry point)
- **Server-API** (represents EC2 backend)
- **Server-DB** (represents RDS PostgreSQL)

Optional (if instructor expects security devices):

- **Firewall** (ACLs between internet and servers)

### Connections

- PC-User ↔ Switch-LAN (Ethernet)
- Switch-LAN ↔ Router-ISP (Ethernet)
- Router-ISP ↔ Server-Web (Ethernet)
- Router-ISP ↔ Server-API (Ethernet)
- Server-API ↔ Server-DB (Ethernet)

### Suggested addressing (example)

Use any consistent private IP plan, e.g.:

- LAN: `192.168.10.0/24`
  - PC-User: `192.168.10.10`
  - Router-ISP (LAN): `192.168.10.1`
- “DMZ / servers” networks:
  - Web: `10.0.10.0/24` (Server-Web: `10.0.10.10`)
  - API: `10.0.20.0/24` (Server-API: `10.0.20.10`)
  - DB: `10.0.30.0/24` (Server-DB: `10.0.30.10`)

You may also do a simpler single-subnet design if your instructor prefers.

## What to demonstrate (screenshots)

### Screenshot set (minimum)

Place screenshots in `docs/final-submission/assets/`:

- `packet-tracer-topology.png`: full topology view
- `packet-tracer-ip-config.png`: at least one device IP config (PC + router)
- `packet-tracer-tests.png`: test evidence (ping, traceroute, ACL results)

### Tests to run (suggested)

- From PC-User:
  - Ping Router-ISP (LAN gateway)
  - Ping Server-Web
  - Ping Server-API
  - Ping Server-DB (optional; often blocked in real life)

If you model ACLs/firewall:

- Allow **HTTP/HTTPS** from PC-User to Server-Web and Server-API
- Deny direct PC-User access to Server-DB
- Allow Server-API to reach Server-DB on TCP/5432

## Justification for each component (pasteable)

- **PC-User**: Represents an end-user browser device consuming the SPA and calling the API over HTTPS.
- **Switch-LAN**: Represents local layer-2 connectivity between endpoints and the default gateway.
- **Router-ISP**: Represents the network edge providing connectivity between the user network and the public services.
- **Server-Web**: Represents the public web entry point (CloudFront + S3) serving the SPA and static assets.
- **Server-API**: Represents the backend application server (EC2 running Rails in Docker) serving `/api/*`, `/up`, `/rails/*`, `/api-docs*`.
- **Server-DB**: Represents the managed database (RDS PostgreSQL) storing users/lists/items/etc and not directly exposed to end users.
- **Firewall / ACLs (if used)**: Represents network-level controls similar to AWS Security Groups/NACLs; enforces least-privilege connectivity.

## Notes for aligning Packet Tracer with AWS

- Packet Tracer can’t model CloudFront, S3, or IAM directly; treat them as logical “servers/services.”
- Your written justification should explain that the diagram is a **logical representation** of the deployed AWS network flow.

