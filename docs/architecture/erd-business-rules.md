![A screenshot of a computer AI-generated content may be incorrect.](media/image1.png){width="6.5in" height="6.554166666666666in"}

**Business Rules and Assumptions**

[Entity and Attribute Rules]{.underline}

1.  Each User must have a unique UserID and Email.

2.  A User's Status must be one of the following: *Active*, *Suspended*, or *Deleted*.

3.  The Role attribute determines access level and must be *User*, *BusinessAdmin*, or *SystemAdmin*.

4.  Every List must be associated with exactly one User.

5.  A List's Visibility can only be *Private*, *Shared*, or *Public*.

6.  Each Item must belong to exactly one List.

7.  Rating in Item must be between 1.0 and 5.0 (inclusive).

8.  DateAdded in Item cannot precede the CreatedAt date of its List.

9.  Each Feedback must reference an existing User and List.

10. Comment in Feedback cannot be null or empty.

11. ActivityLog entries must reference a valid User performing an action.

12. Each BusinessAdmin or SystemAdmin record must correspond to an existing User (1:1 relationship).

13. KnowledgeBase entries must link to a valid BusinessAdmin record.

14. CreatedDate in KnowledgeBase cannot be after LastUpdated.

[Data Integrity and Consistency Rules]{.underline}

1.  All foreign keys (UserID, ListID, etc.) must reference existing primary keys.

2.  Cascading delete behavior: deleting a User removes their Lists, Items, Feedback, and ActivityLog records.

3.  Timestamps (CreatedAt, UpdatedAt, Timestamp) are generated automatically by the system.

4.  UpdatedAt must always be greater than or equal to CreatedAt.

5.  Ratings, comments, and activity entries cannot be edited by unauthorized roles.

6.  PermissionsLevel and AccessLevel values must follow pre-defined ranges in the admin configuration table.

[System and Design Assumptions]{.underline}

1.  The system supports multiple simultaneous users, each managing independent lists.

2.  Business and System Admins inherit all base User permissions with additional administrative capabilities.

3.  All data is stored in a relational database (e.g., PostgreSQL) following 3NF standards.

4.  All textual data fields use UTF-8 encoding for multilingual support.
