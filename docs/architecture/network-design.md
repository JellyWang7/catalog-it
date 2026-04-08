![A diagram of a cloud computing system AI-generated content may be incorrect.](media/image1.png){width="6.5in" height="4.529166666666667in"}

This architecture is designed around the principle of Defense in Depth. I apply security controls at the Edge, the Network, the Application, and the Database levels.

[A. The Edge (Entry Point)]{.underline}

Component: CloudFront (CDN) & WAF (Web Application Firewall)

- Function: Delivers static assets (CSS, images from your HTML files like logo-image.svg) and acts as the first line of defense.

- Security Justification:

  - DDoS Protection: With 12K active users and 8M items, your public lists are targets for scraping bots or Denial of Service attacks. The CDN absorbs volumetric attacks before they hit your servers.

  - WAF (Web Application Firewall): You must configure rules here specifically to block SQL Injection. Your ERD allows free-text entry in fields like ItemName and Notes. A malicious user could input \' OR 1=1 \-- into the search bar to dump your database. The WAF inspects the HTTP packet and drops this request before it ever reaches your application code.

[B. The Public Subnet (DMZ)]{.underline}

Component: Application Load Balancer (ALB) & NAT Gateway

- Function: The ALB terminates the SSL connection and distributes traffic to the application servers.

- Security Justification:

  - SSL Offloading: We decrypt HTTPS traffic here.

  - Transaction Specific Security: The Login Transaction (User entering Email/PasswordHash) and the Sign-Up Transaction are critical. We enforce TLS 1.2 or 1.3 encryption here. Why? Because if a \"man-in-the-middle\" intercepts the PasswordHash during transit, they can replay it. The ALB ensures no unencrypted HTTP traffic enters the private network.

[C. The Private Subnet (Application Tier)]{.underline}

Component: App Servers (Auto Scaling Group) & Redis Cache

- Function: Runs the logic for creating lists, calculating ratings, and processing feedback.

- Security Justification:

  - Network Isolation: These servers have no public IP addresses. A hacker cannot SSH directly into the server hosting your application logic. They can only receive traffic forwarded by the Load Balancer on a specific port.

  - Session Management (Redis): Your ERD shows a User entity but not a session table. We will use Redis to store session tokens.

  - Specific Transaction Security: When a user toggles a list from \"Private\" to \"Public\" (Updating the Visibility attribute in the List entity), the application layer enforces an Authorization Check. The code must verify CurrentUserID == List.UserID. This logic lives here, isolated from the outside world.

[D. The Data Subnet (Database Tier)]{.underline}

Component: Primary Database (Write) & Read Replica

- Function: Stores the tables defined in your ERD (User, List, Item, Feedback).

- Security Justification:

  - Maximum Isolation: This subnet has the strictest Network Access Control Lists (NACLs). Only traffic from the *Application Tier Security Group* is allowed. Even if a hacker compromises the Web Server, they still have to bypass another firewall to dump the database.

  - Read Replicas: Your HTML mentions \"Explore public lists\" and \"8M items.\" This implies a high volume of READ operations (SELECT queries) vs. WRITE operations (INSERT queries). We route public list viewing to the Read Replica to prevent public browsing from slowing down the \"Create List\" function for logged-in users.

**[Detailed Security Requirements]{.underline}**

**User Level Security**

1.  MFA for Admins (Business & System Admin):

    - Why: My ERD has BusinessAdmin and SystemAdmin entities. If a SystemAdmin account is compromised, the attacker could delete the entire ActivityLog (covering their tracks) or modify the KnowledgeBase to spread phishing links. MFA is mandatory for these roles.

2.  Rate Limiting on \"Feedback\":

    - Why: The Feedback entity links to ListID. A malicious user could script a bot to submit 10,000 negative comments on a competitor\'s list. We must implement rate limiting (e.g., 1 feedback per list per user per hour) at the API level.

**Application Level Security**

1.  Input Sanitization (XSS Prevention):

    - Why: The Item entity contains a Notes field, and List contains Description. These are text blobs. If a user inputs \<script\>stealCookies()\</script\> into a Public List description, any other user viewing that list executes the code. The Application Server must sanitize all HTML tags out of these specific fields before saving to the DB.

2.  Object Level Authorization (IDOR Prevention):

    - Why: In the List table, ListID is an integer (PK). A user might try to access catalogit.com/list/105 (a private list) by changing the URL to catalogit.com/list/106. The application must validate that the requester is the owner OR the Visibility attribute is set to \'Public\' before returning data.

**Database Level Security**

1.  Encryption at Rest (AES-256):

    - Why: The User table contains PII (Email, FullName). If physical drives in the data center are decommissioned or stolen, this data must be unreadable.

2.  Audit Logging (ActivityLog Trigger):

    - Why: Your ERD has an ActivityLog table. While the app writes to this, the Database should *also* have an internal audit trail enabled for the SystemAdmin table. If a hacker gains app access and deletes a user, the app might log it, but if the hacker gains *DB access* and deletes the log, you are blind. DB-level logging protects the integrity of the ActivityLog.

**Transaction-Specific Encryption**

1.  The \"Create User\" Transaction:

    - Specific Requirement: When User data is submitted, the PasswordHash attribute must be hashed server-side using a strong algorithm (e.g., Argon2 or Bcrypt) with a unique salt *before* it touches the database. We never store plain text passwords, and we never transmit the hash over non-SSL links.

2.  The \"Export Lists\" Transaction:

    - Specific Requirement: The FAQ HTML mentions \"Can I export my lists? Not yet, but it\'s coming.\" When this is my non-mvp feature, still the download stream must be encrypted. Furthermore, because this aggregates a massive amount of data into a single file, it requires a Re-authentication step (users must enter their password again) to initiate the download, preventing session hijacking theft.
