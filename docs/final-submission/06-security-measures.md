# Security Measures (beyond the network diagram)

This section documents security controls and practices that are not fully captured by the Packet Tracer network diagram.

## 1. Transport security (in transit)

- **HTTPS to users**: End users access the application through CloudFront over HTTPS.
- **Origin protocol**: CloudFront communicates with the EC2 origin over HTTP (per configuration). Risk is mitigated by AWS-managed infrastructure boundaries, but end-to-end TLS to origin is recommended for stricter security postures.

## 2. Authentication and authorization

- **JWT authentication**: Protected endpoints require a token in the `Authorization` header.
- **Role/status checks**: User status (active/suspended/deleted) is enforced in authentication logic.
- **Least privilege per endpoint**: Write operations (create/update/delete) require authentication; public reads are restricted based on list visibility.

## 3. Secrets management

- **No secrets in git**: Production secrets are stored in `.env.production` on EC2 and not committed.
- **Rotation**: If secrets are exposed, rotate AWS keys, DB passwords, and `SECRET_KEY_BASE` according to policy.
- **Prefer IAM roles**: For production, prefer EC2 instance roles over long-lived access keys where possible.

## 4. Data protection (at rest)

- **RDS encryption**: Enable storage encryption for the RDS instance (if configured).
- **S3 encryption**: Buckets should use server-side encryption (SSE-S3 or SSE-KMS).
- **Backups**: RDS automated backups/snapshots for recovery (define retention per requirements).

## 5. Input validation and content safety

- **Attachment validation**: File size limits, MIME type allowlist, and link validation (https-only) are enforced server-side.
- **Sanitization**: Item notes are sanitized to remove unsafe HTML/JS.
- **Error handling**: API returns structured errors; avoid leaking sensitive stack traces to clients in production.

## 6. Access control to data stores

- **Database not public**: RDS is reachable only from the application tier (security-group restricted).
- **Object storage access**: S3 access is restricted via bucket policy and CloudFront OAC for the frontend bucket.

## 7. Network-layer controls (AWS)

Even though Packet Tracer uses generic firewall/ACL concepts, in AWS these map to:

- **Security Groups**:
  - EC2 allows inbound web ports (80/443) and SSH restricted to an allowed CIDR.
  - RDS allows inbound 5432 only from the EC2 security group.
- **Outbound restrictions**: Allow only required egress where feasible (baseline often allows all).

## 8. Monitoring and auditing

- **Application logs**: Container logs (`docker logs`) for backend diagnostics.
- **AWS logs** (recommended):
  - CloudFront access logs (optional)
  - CloudTrail for API auditing
  - VPC Flow Logs (optional) for network visibility
  - CloudWatch metrics/alarms (optional)

## 9. Supply chain and dependency security

- **Pinned dependencies**: Ruby gems are pinned via `Gemfile.lock`.
- **Container build**: Production image builds should be reproducible and scanned where possible (ECR scanning / CI scanning).

## 10. Security items to explicitly list as “not shown” in Packet Tracer

Use this exact subsection to satisfy the rubric:

- IAM policies/roles (who can deploy, who can access ECR/RDS/S3)
- Secrets handling and rotation procedures
- JWT token lifecycle (issue, expiry, renewal by login)
- S3 bucket policies and CloudFront OAC
- Application-level validations/sanitization
- Audit logging (CloudTrail) and monitoring (CloudWatch)

