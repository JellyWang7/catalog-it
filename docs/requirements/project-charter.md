CatalogIt Updated Project Charter, Schedule,

          Gantt Chart and Budget
             Prepared by: Jelly Wang (Mengyuan)

            Course: CS 701 Special Projects in CS II

                      Date: Jan 19th, 2026
1. Updated Project Charter

1.1 Project Goal

       The goal of the CatalogIt project is to transition from the design specifications

established in CS 700 (Fall 2025) into a fully functional, secure web application. The objective is

to develop, test, and deploy the platform using the architecture defined in the Final

Documentation.

1.2 Revised Scope (Implementation Phase)

While the core business objectives remain unchanged (creating flexible, user-centered catalogs),

the technical scope has been refined to align with the Spring 2026 implementation timeline:

   •   Infrastructure: Configuration of local development environments using Docker and

       deployment to AWS Free Tier.

   •   Database: Physical implementation of the PostgreSQL schema (3NF) including Users,

       Lists, and Items tables.

   •   Backend: Development of the Ruby on Rails API to handle Authentication (JWT) and

       CRUD operations.

   •   Frontend: Construction of the React.js dashboard, specifically the "My Dashboard" and

       "Public Explorer" views.

1.3 Tools & Resources (Updated)

To optimize development time, the toolset has been updated to include AI-assisted development

environments:

   •   IDE/Editor: Cursor (AI-powered VS Code fork) for accelerated code generation.

   •   Frontend Framework: React.js with Tailwind CSS.

   •   Backend Framework: Ruby on Rails (API Mode).
   •    Version Control: GitHub.



2. Detailed Project Schedule & Gantt Chart

2.1 Schedule Analysis (Original vs. Revised)

The following table outlines the detailed Work Breakdown Structure (WBS). "Original Dates"

refer to the initial estimates made during the CS 700 Design Phase. "Revised Dates" reflect the

confirmed Spring 2026 semester schedule.

                                                Revised          Revised
                                   Original     Start            End              Actual /
  yes      Task Name
                                   Plan         (Spring          (Spring          Status
                                                '26)             '26)

  1.0      Planning & Sync         Jan 11       N/A              Jan 17           Completed

           Project Sync &                                                         Completed
  1.1                              Jan 11       N/A              N/A
           Intro                                                                  (1/17)

           Review CS 700                                                          Completed
  1.2                              Jan 11       N/A              N/A
           Documentation                                                          (1/14)

           Setup &
  2.0                              Jan 18       N/A              Jan 19           Completed
           Configuration

           Environment
                                                                                  Completed
  2.1      Setup                   Jan 18       N/A              N/A
                                                                                  (1/19)
           (Rails/React)

           GitHub Repo                                                            Completed
  2.2                              Jan 18       N/A              N/A
           Initialization                                                         (1/19)

           Detailed                                                               Completed
  3.0                              Jan 19       N/A              N/A
           Planning                                                               1/19

           Update Charter &                                                       Completed
  3.1                              Jan 19       N/A              N/A
           Schedule                                                               1/19
                                     Revised   Revised
                          Original   Start     End       Actual /
yes   Task Name
                          Plan       (Spring   (Spring   Status
                                     '26)      '26)

                                                         Completed
3.2   Revise Budget       Jan 18     Jan 19    N/A
                                                         1/19

      Backend
4.0                       Feb 01     N/A       Feb 07    Planned
      Development

      Database
4.1   Migrations          Feb 01     N/A       Feb 03    Planned
      (Postgres)

      User Auth API
4.2                       Feb 04     N/A       Feb 07    Planned
      (Login/Signup)

      Frontend
5.0                       Feb 08     FN/A      Feb 14    Planned
      Development

      React App Init &
5.1                       Feb 08     N/A       Feb 10    Planned
      Router

      Auth Forms &
5.2                       Feb 11     N/A       Feb 14    Planned
      Navbar

      Core
6.0                       Feb 15     N/A       Feb 21    Planned
      Functionality

      CRUD Operations
6.1                       Feb 15     N/A       Feb 18    Planned
      (Lists/Items)

      Dashboard
6.2                       Feb 19     N/A       Feb 21    Planned
      Integration

7.0   Midterm Review      Feb 22     N/A       Feb 28    Planned

      Midterm
7.1                       Feb 22     N/A       Feb 28    Planned
      Presentation Prep

      Integration &
8.0                       Mar 01     N/A       Mar 07    Planned
      Security
                                           Revised   Revised
                                Original   Start     End       Actual /
  yes    Task Name
                                Plan       (Spring   (Spring   Status
                                           '26)      '26)

         Security
  8.1    Hardening              Mar 01     N/A       Mar 04    Planned
         (XSS/SQLi)

         API Integration
  8.2                           Mar 05     N/A       Mar 07    Planned
         Testing

                                                     Mar 14,
  9.0    Testing & QA           Mar 08     N/A                 Planned
                                                     2026

         Network & App
  9.1                           Mar 08     N/A       Mar 14    Planned
         Check

                                                     Mar 29,
  10.0   Closing                Mar 15     N/A                 Planned
                                                     2026

         Final Presentation
  10.1                          Mar 15     N/A       Mar 21    Planned
         Review

  10.2   Final Presentation     Mar 22     N/A       Mar 28    Planned

         Final
  10.3                          Mar 29     N/A       Mar 29    Planned
         Documentation




2.2 Gantt Chart Visualization
3. Updated Budget Analysis

3.1 Cost Variance Summary

The project budget has been revised to reflect the "Implementation Phase" realities. A significant

strategic shift was made to utilize AI-assisted tooling (Cursor), which has increased software

subscription costs slightly but drastically reduced the estimated labor hours required for coding

and debugging.

3.2 Detailed Budget Table


  Cost                                    Original Est.      Revised Budget         Variance
                   Item Description
  Category                                (CS 700)           (CS 701)               (+/-)

                   Dev Tools &
  Software                                $600.00            $40.00                 +$560.00
                   Licenses

                                                             Cursor Pro
                   Generic software
  Notes:                                                     Subscription (2
                   licenses
                                                             mos)

                   Development
  Labor                                   $5,000.00          $3,000.00              +$2,000.00
                   Hours

                                                             60 hrs @ $50/hr
  Notes:           100 hrs @ $50/hr
                                                             (Efficiency)

                   Cloud
  Hosting                                 *$0.00*            $0.00                  $0.00
                   Infrastructure

                                                             AWS Free Tier /
  Notes:           AWS Free Tier
                                                             Local Docker

                   Workspace &
  Overhead                                $2,300.00          $2,300.00              $0.00
                   Utilities

                   Prorated                                  Fixed Semester
  Notes:
                   Rent/Internet                             Allocation
Cost                          Original Est.   Revised Budget   Variance
           Item Description
Category                      (CS 700)        (CS 701)         (+/-)

TOTAL      PROJECT COST       $7,900.00       $5,340.00        +$2,560.00
