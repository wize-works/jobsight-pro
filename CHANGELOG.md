# [1.38.0](https://github.com/wize-works/jobsight-pro/compare/v1.37.0...v1.38.0) (2025-06-14)


### Features

* Add NEXT_PUBLIC_STRIPE_PUBLIC_KEY environment variable to Dockerfile ([a2df091](https://github.com/wize-works/jobsight-pro/commit/a2df091d53f5f2c83fa0581528875b7fe93d041a))

# [1.37.0](https://github.com/wize-works/jobsight-pro/compare/v1.36.1...v1.37.0) (2025-06-14)


### Features

* Add STRIPE_SECRET_KEY environment variable to Dockerfile ([7eca65f](https://github.com/wize-works/jobsight-pro/commit/7eca65fb59448c990c8db48f8ec17302e53caf88))

## [1.36.1](https://github.com/wize-works/jobsight-pro/compare/v1.36.0...v1.36.1) (2025-06-14)


### Bug Fixes

* Add type definitions for web-push module ([4e967b4](https://github.com/wize-works/jobsight-pro/commit/4e967b4f06377eef0bb3d71db442e60c4c0894fb))

# [1.36.0](https://github.com/wize-works/jobsight-pro/compare/v1.35.0...v1.36.0) (2025-06-14)


### Bug Fixes

* added toast import ([ed12f17](https://github.com/wize-works/jobsight-pro/commit/ed12f176fdad7e063c06aadfb13322c45ed17178))


### Features

* add Stripe secrets to deployment configuration and Docker build arguments ([6ed41c7](https://github.com/wize-works/jobsight-pro/commit/6ed41c75f6b1f2ccbb94880ae423ddbd97688c0c))
* add Stripe types for customers, invoices, subscriptions, and payment events; enhance type safety and integration with Supabase ([ea5cdcc](https://github.com/wize-works/jobsight-pro/commit/ea5cdcc199a5a9884a2a802c36d6bd2e98a4cb4b))
* update pricing JSON with Stripe product IDs and add AI addon pricing; remove obsolete Stripe payment events types ([964e0b2](https://github.com/wize-works/jobsight-pro/commit/964e0b263be8b2dbe9d92464e03791381e444cbb))

# [1.35.0](https://github.com/wize-works/jobsight-pro/compare/v1.34.0...v1.35.0) (2025-06-13)


### Bug Fixes

* correct crew member ID reference and enhance notes textarea styling in CreateDailyLogModal ([f8eafce](https://github.com/wize-works/jobsight-pro/commit/f8eafcefbe7f6f622060dffa9570623d521d5b72))


### Features

* add TaskModal component for creating and editing tasks with form validation and project/crew selection ([3a2cadb](https://github.com/wize-works/jobsight-pro/commit/3a2cadb167b7a9308101dd857a18ab09deefa8e6))

# [1.34.0](https://github.com/wize-works/jobsight-pro/compare/v1.33.0...v1.34.0) (2025-06-11)


### Features

* implement media upload functionality in project detail; add media linking and unlinking actions; enhance media tab with improved filtering and display ([f917e84](https://github.com/wize-works/jobsight-pro/commit/f917e84f582bb07a7abcac4447c5aacd8b009c7d))

# [1.33.0](https://github.com/wize-works/jobsight-pro/compare/v1.32.1...v1.33.0) (2025-06-11)


### Bug Fixes

* correct directory path in Dockerfile and improve loading state handling in DashboardLayout ([34f0dde](https://github.com/wize-works/jobsight-pro/commit/34f0ddeb15f43c90df4590d6f96aa0b350a37b0a))
* improve registration flow for authenticated users and handle business checks ([752dee5](https://github.com/wize-works/jobsight-pro/commit/752dee55a3335215560945a4d7115af50af088cd))
* removed merge remnant ([513ba86](https://github.com/wize-works/jobsight-pro/commit/513ba86f6cdf9eac09ef76eaa49b62f14e392470))
* update AssignmentModal props for better state management; enhance error handling in avatar upload process; improve offline action error handling by ensuring user context is available ([8304c30](https://github.com/wize-works/jobsight-pro/commit/8304c3078e66a2d1117b697b80efb504d1261b96))
* update toast notifications for invitation and business setup handling ([4e49b0e](https://github.com/wize-works/jobsight-pro/commit/4e49b0e7ee4cbf2acf67eae607f955c83408a5e1))
* update toast notifications for invitation handling and add console logs for better debugging ([954ae97](https://github.com/wize-works/jobsight-pro/commit/954ae9792bef6f00c0093d2f1d3697584f416c5b))


### Features

* Enhance business management features ([7511add](https://github.com/wize-works/jobsight-pro/commit/7511add4a90a2d6052b97093e15eb793aede0107))
* enhance task modal with improved form handling and validation ([25840d1](https://github.com/wize-works/jobsight-pro/commit/25840d16963927b33784c388bd75c47f6ebf5847))
* Refactor Equipment Usage Modal: Enhance form handling, loading states, and UI structure; integrate new form data management; improve error handling and toast notifications. Update Equipment Page to remove empty state message. Revise Projects Page to enhance no projects found message layout. Clean up logging in withBusinessServer function. Remove unused id fields from Supabase types. Create new modal design documentation for standardization. Implement new Equipment creation modal with structured form and improved user experience. ([151a600](https://github.com/wize-works/jobsight-pro/commit/151a600835f86284ff3fdeee19b465faeef29021))

## [1.32.1](https://github.com/wize-works/jobsight-pro/compare/v1.32.0...v1.32.1) (2025-06-10)


### Bug Fixes

* correct type assertion for userUpdate and format return statement in uploadUserAvatar function ([b3dc574](https://github.com/wize-works/jobsight-pro/commit/b3dc574d5d47a8eff10bd40705c7861f8fc6eb93))

# [1.32.0](https://github.com/wize-works/jobsight-pro/compare/v1.31.28...v1.32.0) (2025-06-10)


### Features

* enhance subscription management with improved error handling and UI updates ([17455a1](https://github.com/wize-works/jobsight-pro/commit/17455a186fe15a115c1b447d2bf22e405bee4397))
* subscription implementation that is not complete ([dc10f93](https://github.com/wize-works/jobsight-pro/commit/dc10f9315145e43166ec9201a43d669fef9018ab))

## [1.31.28](https://github.com/wize-works/jobsight-pro/compare/v1.31.27...v1.31.28) (2025-06-10)


### Bug Fixes

* Adjust spacing in sidebar menu for improved layout consistency ([e1e28fa](https://github.com/wize-works/jobsight-pro/commit/e1e28faa779715984e08a9204c423aafe3d949dd))
* user profile alignment ([3b99074](https://github.com/wize-works/jobsight-pro/commit/3b990747b4d5bf978963f73bb215d18fdb52ad40))

## [1.31.27](https://github.com/wize-works/jobsight-pro/compare/v1.31.26...v1.31.27) (2025-06-09)


### Bug Fixes

* Correct KINDE_REDIRECT_URL to KINDE_REDIRECT_URI in deployment configuration ([9fcc037](https://github.com/wize-works/jobsight-pro/commit/9fcc03713236f7db0583e688909a0447a199521c))

## [1.31.26](https://github.com/wize-works/jobsight-pro/compare/v1.31.25...v1.31.26) (2025-06-09)


### Bug Fixes

* Correct KIDNE_REDIRECT_URI to KINDE_REDIRECT_URI in deployment workflow ([a97a292](https://github.com/wize-works/jobsight-pro/commit/a97a2922a993ac6ea23fcc8de1568b177a553c1e))

## [1.31.25](https://github.com/wize-works/jobsight-pro/compare/v1.31.24...v1.31.25) (2025-06-09)


### Bug Fixes

* Correct KINDE_LOGOUT_REDIRECT_URL to KINDE_LOGOUT_REDIRECT_URI in deployment configuration ([207f08e](https://github.com/wize-works/jobsight-pro/commit/207f08e5d4963d1017c981ab5de4ed317ef842ad))

## [1.31.24](https://github.com/wize-works/jobsight-pro/compare/v1.31.23...v1.31.24) (2025-06-09)


### Bug Fixes

* Remove Doppler secrets loading from AKS deployment workflow ([b226c3b](https://github.com/wize-works/jobsight-pro/commit/b226c3b8ce855b97ca4446580b774e466116cec5))
* Update AKS deployment workflow to use secrets for environment variables ([ce6de18](https://github.com/wize-works/jobsight-pro/commit/ce6de18bfb52b9134f2c1427dd0b8b5c1531c1d7))

## [1.31.23](https://github.com/wize-works/jobsight-pro/compare/v1.31.22...v1.31.23) (2025-06-09)


### Bug Fixes

* Add environment variables for Kinde and other services in AKS deployment ([bf49b19](https://github.com/wize-works/jobsight-pro/commit/bf49b19e1cb2b00672bbbf77a5e45ce64f7d48bb))

## [1.31.22](https://github.com/wize-works/jobsight-pro/compare/v1.31.21...v1.31.22) (2025-06-09)


### Bug Fixes

* Remove unused build arguments and environment variables from AKS deployment workflow ([b19da5b](https://github.com/wize-works/jobsight-pro/commit/b19da5b68cb958bc304fca586c4d8ca430089092))

## [1.31.21](https://github.com/wize-works/jobsight-pro/compare/v1.31.20...v1.31.21) (2025-06-09)


### Bug Fixes

* Remove redundant environment variables from AKS deployment workflow ([7c29ec8](https://github.com/wize-works/jobsight-pro/commit/7c29ec872b1a174ef16685c197374371d503807f))

## [1.31.20](https://github.com/wize-works/jobsight-pro/compare/v1.31.19...v1.31.20) (2025-06-09)


### Bug Fixes

* Update Docker image tagging to include latest version alongside specific version ([bef4e4a](https://github.com/wize-works/jobsight-pro/commit/bef4e4af67f5bc9fda4838f206729b76d0f91460))

## [1.31.19](https://github.com/wize-works/jobsight-pro/compare/v1.31.18...v1.31.19) (2025-06-09)


### Bug Fixes

* Update deployment configuration to use Kubernetes secrets for sensitive environment variables ([d50f134](https://github.com/wize-works/jobsight-pro/commit/d50f1341f1772442dbf9ef7e81cef9c090743f44))

## [1.31.18](https://github.com/wize-works/jobsight-pro/compare/v1.31.17...v1.31.18) (2025-06-09)


### Bug Fixes

* Move USER appuser command to maintain non-root user context in Dockerfile ([1df9c7b](https://github.com/wize-works/jobsight-pro/commit/1df9c7b5601235836eace6e1f6b0aea46be683ea))

## [1.31.17](https://github.com/wize-works/jobsight-pro/compare/v1.31.16...v1.31.17) (2025-06-09)


### Bug Fixes

* Update Dockerfile to set ownership for image cache directory ([0ae5deb](https://github.com/wize-works/jobsight-pro/commit/0ae5debdd36931b7a21fdac6b744ad5255f8ed03))

## [1.31.16](https://github.com/wize-works/jobsight-pro/compare/v1.31.15...v1.31.16) (2025-06-09)


### Bug Fixes

* Create directory for Next.js image cache in Dockerfile ([11e1c8e](https://github.com/wize-works/jobsight-pro/commit/11e1c8e187e55da8823e443d9876fa809ada4853))

## [1.31.15](https://github.com/wize-works/jobsight-pro/compare/v1.31.14...v1.31.15) (2025-06-09)


### Bug Fixes

* Refactor EquipmentDetailPage to streamline data fetching and improve error handling; update EquipmentDetail props type ([59fc76e](https://github.com/wize-works/jobsight-pro/commit/59fc76e1007b09e37ce36bb8b3fb183c86eada34))

## [1.31.14](https://github.com/wize-works/jobsight-pro/compare/v1.31.13...v1.31.14) (2025-06-09)


### Bug Fixes

* Comment out dashboard routes in service worker and restore EquipmentDetail component rendering ([05742e1](https://github.com/wize-works/jobsight-pro/commit/05742e1076f90096800cfd58103b8bcf671f7e9a))

## [1.31.13](https://github.com/wize-works/jobsight-pro/compare/v1.31.12...v1.31.13) (2025-06-09)


### Bug Fixes

* Refactor code structure for improved readability and maintainability ([995aa2c](https://github.com/wize-works/jobsight-pro/commit/995aa2c055b189fee1b2bb11185250492cf66440))

## [1.31.12](https://github.com/wize-works/jobsight-pro/compare/v1.31.11...v1.31.12) (2025-06-09)


### Bug Fixes

* Implement code changes to enhance functionality and improve performance ([3df8e95](https://github.com/wize-works/jobsight-pro/commit/3df8e95174d1869e073fc1bac44c7bd2134bcdef))

## [1.31.11](https://github.com/wize-works/jobsight-pro/compare/v1.31.10...v1.31.11) (2025-06-09)


### Bug Fixes

* comment out map links in EquipmentDetail component for debugging ([a3b640c](https://github.com/wize-works/jobsight-pro/commit/a3b640cf0b35395c0a3c6a701d9ff6db3d7f7b73))

## [1.31.10](https://github.com/wize-works/jobsight-pro/compare/v1.31.9...v1.31.10) (2025-06-09)


### Bug Fixes

* comment out document rendering logic in EquipmentDetail component for debugging ([991f373](https://github.com/wize-works/jobsight-pro/commit/991f37377600c9c6c5e08eb23df19b760c3413cd))

## [1.31.9](https://github.com/wize-works/jobsight-pro/compare/v1.31.8...v1.31.9) (2025-06-09)


### Bug Fixes

* comment out image rendering logic in EquipmentDetail component for debugging ([e426ee8](https://github.com/wize-works/jobsight-pro/commit/e426ee8f206c7e0961e144f64a0c4c2cdae07cbb))

## [1.31.8](https://github.com/wize-works/jobsight-pro/compare/v1.31.7...v1.31.8) (2025-06-09)


### Bug Fixes

* comment out media mapping in EquipmentDetail component for debugging ([0cb7773](https://github.com/wize-works/jobsight-pro/commit/0cb777361702e03e8f18eb6849f767d7863522ad))
* improve image handling in EquipmentDetail component with fallback UI ([9318257](https://github.com/wize-works/jobsight-pro/commit/9318257f31f7509cef64fff935a09d1dccaaf52a))

## [1.31.7](https://github.com/wize-works/jobsight-pro/compare/v1.31.6...v1.31.7) (2025-06-09)


### Bug Fixes

* correct media type identifiers in file upload component ([9c01fc1](https://github.com/wize-works/jobsight-pro/commit/9c01fc19f9ed0f2b9e63f4dca4fd77be7cf98dbf))

## [1.31.6](https://github.com/wize-works/jobsight-pro/compare/v1.31.5...v1.31.6) (2025-06-07)


### Bug Fixes

* Add placeholder for media download link when URL is unavailable ([bef42dd](https://github.com/wize-works/jobsight-pro/commit/bef42dd3359c2c761e1ca368a7f82bfeb0742108))

## [1.31.5](https://github.com/wize-works/jobsight-pro/compare/v1.31.4...v1.31.5) (2025-06-07)


### Bug Fixes

* Remove loading component and mock projects page implementation ([9049729](https://github.com/wize-works/jobsight-pro/commit/90497299963192bec01479f68ee17e424eee940f))

## [1.31.4](https://github.com/wize-works/jobsight-pro/compare/v1.31.3...v1.31.4) (2025-06-07)


### Bug Fixes

* Update ProjectDetail and MediaTab components to pass projectId and enhance media loading logic ([a14947a](https://github.com/wize-works/jobsight-pro/commit/a14947a971a2b041ee2ae8eb5bbb0aaf5f823589))

## [1.31.3](https://github.com/wize-works/jobsight-pro/compare/v1.31.2...v1.31.3) (2025-06-07)


### Bug Fixes

* Update toast notifications to use success and error variants across multiple components ([0849521](https://github.com/wize-works/jobsight-pro/commit/084952137f02e632066cdb280882937f9ab8804a))

## [1.31.2](https://github.com/wize-works/jobsight-pro/compare/v1.31.1...v1.31.2) (2025-06-07)


### Bug Fixes

* Update email verification logic and streamline email content ([50ee3ca](https://github.com/wize-works/jobsight-pro/commit/50ee3ca6cc0aa3b9659b8a00d40270198f5e0191))

## [1.31.1](https://github.com/wize-works/jobsight-pro/compare/v1.31.0...v1.31.1) (2025-06-07)


### Bug Fixes

* Refactor document actions: mark documents.ts as deprecated and update email notification types ([463fc00](https://github.com/wize-works/jobsight-pro/commit/463fc00f5980f2cb8c0832f4c6d1480215b7af07))

# [1.31.0](https://github.com/wize-works/jobsight-pro/compare/v1.30.0...v1.31.0) (2025-06-07)


### Features

* enhance invoice management with new modals for sending and recording payments, improve invoice status handling, and refactor sync logic ([c1b1ea0](https://github.com/wize-works/jobsight-pro/commit/c1b1ea00b7f92d8ec47d94de799ffaeea23bb92a))

# [1.30.0](https://github.com/wize-works/jobsight-pro/compare/v1.29.0...v1.30.0) (2025-06-07)


### Features

* add Sentry authentication token to Docker build and Kubernetes secret ([3c7de6b](https://github.com/wize-works/jobsight-pro/commit/3c7de6b79119b7b0c771d998de66b5dd25aaaf66))
* integrate ClarityProvider for enhanced user analytics tracking ([42900a6](https://github.com/wize-works/jobsight-pro/commit/42900a6087322d2ff98526c6af368c6b9ed8a585))
* integrate Sentry for error tracking and performance monitoring ([f1e6e25](https://github.com/wize-works/jobsight-pro/commit/f1e6e259b10d9557b9128358f07f215839472bed))

# [1.29.0](https://github.com/wize-works/jobsight-pro/compare/v1.28.4...v1.29.0) (2025-06-07)


### Bug Fixes

* enhance user interface in UsersPermissionsTab and Navbar for improved layout and accessibility ([94b4aba](https://github.com/wize-works/jobsight-pro/commit/94b4abad09a26b7218d25956a7727a96511207d8))


### Features

* enhance task management with new user permissions and kanban board ([193b263](https://github.com/wize-works/jobsight-pro/commit/193b26319affb05a4c63cef1c151f3cabd1325bc))

## [1.28.4](https://github.com/wize-works/jobsight-pro/compare/v1.28.3...v1.28.4) (2025-06-06)


### Bug Fixes

* ensure user object is valid before accessing properties in UsersPermissionsTab and update email type to non-nullable in Supabase schema ([dbd14a9](https://github.com/wize-works/jobsight-pro/commit/dbd14a990b9cdba3213ec2f1922a78b8d5d4c616))

## [1.28.3](https://github.com/wize-works/jobsight-pro/compare/v1.28.2...v1.28.3) (2025-06-06)


### Bug Fixes

* update toast notifications to use error and success variants for better user feedback ([bf4ba5b](https://github.com/wize-works/jobsight-pro/commit/bf4ba5b024d9d793acc6d3850a9386617974d305))

## [1.28.2](https://github.com/wize-works/jobsight-pro/compare/v1.28.1...v1.28.2) (2025-06-06)


### Bug Fixes

* add status field to user type in Supabase schema and improve Supabase client initialization error handling ([6c3655e](https://github.com/wize-works/jobsight-pro/commit/6c3655e701a3f0737a929e18e107a53b25ae1289))

## [1.28.1](https://github.com/wize-works/jobsight-pro/compare/v1.28.0...v1.28.1) (2025-06-06)


### Bug Fixes

* corrected toast implementation ([643eaef](https://github.com/wize-works/jobsight-pro/commit/643eaeff27627e3a8827a0b5a355d239abecd55e))

# [1.28.0](https://github.com/wize-works/jobsight-pro/compare/v1.27.0...v1.28.0) (2025-06-06)


### Features

* Add RESEND_API_KEY environment variable to Dockerfile ([8ef1636](https://github.com/wize-works/jobsight-pro/commit/8ef163610aada662618da3cc9981ff528eb299e5))

# [1.27.0](https://github.com/wize-works/jobsight-pro/compare/v1.26.1...v1.27.0) (2025-06-06)


### Features

* Add RESEND_API_KEY to Docker build arguments and deployment environment ([90bb697](https://github.com/wize-works/jobsight-pro/commit/90bb6978bcfb09c97401d22606035bdcf1950bd2))

## [1.26.1](https://github.com/wize-works/jobsight-pro/compare/v1.26.0...v1.26.1) (2025-06-06)


### Bug Fixes

* Update task detail and list components to use new task status and priority options ([603415d](https://github.com/wize-works/jobsight-pro/commit/603415dd903df8180511f17baa64859832342f7d))

# [1.26.0](https://github.com/wize-works/jobsight-pro/compare/v1.25.3...v1.26.0) (2025-06-06)


### Bug Fixes

* Refactor invoice pages and components for improved structure and readability ([18a1fd6](https://github.com/wize-works/jobsight-pro/commit/18a1fd6ef25cd9ad18522b2a9971ba2d27186846))
* removed settings ([9fcb840](https://github.com/wize-works/jobsight-pro/commit/9fcb8407f9bb9f0c6988126cd4fd1803ba407a14))
* removed unwanted links in navbar. ([3fe3dd7](https://github.com/wize-works/jobsight-pro/commit/3fe3dd7af8e51967ab6ef56850075865fd7b53b6))
* updated task notes and model. ([7df67d1](https://github.com/wize-works/jobsight-pro/commit/7df67d1d72976241f166c1873ef5d039bca39037))


### Features

* Add email templates and components for JobSight Pro ([a233d26](https://github.com/wize-works/jobsight-pro/commit/a233d26241cd931fe48e4b2e8a1cc2c3c4c5caec))
* Enhance invoice management with detailed editing and viewing capabilities ([65861bb](https://github.com/wize-works/jobsight-pro/commit/65861bb34caba5bc5da63e46249dfd4ce69a496a))
* Implement public layout with theme toggle and footer integration ([d43ddab](https://github.com/wize-works/jobsight-pro/commit/d43ddaba7fc188d13aebc688c6ac0bfb94542de1))

## [1.25.3](https://github.com/wize-works/jobsight-pro/compare/v1.25.2...v1.25.3) (2025-06-04)


### Bug Fixes

* Add webpack alias configuration for improved module resolution ([3162226](https://github.com/wize-works/jobsight-pro/commit/316222677a12d8bd2f8aa349d7d1fe1fcf505d28))

## [1.25.2](https://github.com/wize-works/jobsight-pro/compare/v1.25.1...v1.25.2) (2025-06-04)


### Bug Fixes

* Implement code changes to enhance functionality and improve performance ([e26723e](https://github.com/wize-works/jobsight-pro/commit/e26723ef6c9258ece64ab3586515a380bc12b563))

## [1.25.1](https://github.com/wize-works/jobsight-pro/compare/v1.25.0...v1.25.1) (2025-06-04)


### Bug Fixes

* Refactor push notification actions to use userId consistently and improve code readability ([c40f83a](https://github.com/wize-works/jobsight-pro/commit/c40f83a3e37dcc6ebc22e33a3d5cffff5d2c75c5))
* Update push notification actions to use userId consistently and enhance subscription data handling ([4e95a83](https://github.com/wize-works/jobsight-pro/commit/4e95a83c11ec8d57c57a1f7dc97636ebb63b36f0))

# [1.25.0](https://github.com/wize-works/jobsight-pro/compare/v1.24.0...v1.25.0) (2025-06-04)


### Bug Fixes

* Update button style and text in DailyLogsList component for improved clarity ([d856164](https://github.com/wize-works/jobsight-pro/commit/d856164b317b91c318be329b550e5900ff5490fe))


### Features

* Refactor DailyLogs component to use server-side data fetching and separate DailyLogsList component for better organization; remove unused equipment index file; add EditModal component for editing daily logs with materials and equipment management. ([d0c4067](https://github.com/wize-works/jobsight-pro/commit/d0c4067dd9414f9f07b91c29af2f7eca62459427))

# [1.24.0](https://github.com/wize-works/jobsight-pro/compare/v1.23.0...v1.24.0) (2025-06-03)


### Features

* add client, crew, equipment, and project statistics to respective pages ([76150f0](https://github.com/wize-works/jobsight-pro/commit/76150f02fa8da99203f49eec4fb373922e6c6290))

# [1.23.0](https://github.com/wize-works/jobsight-pro/compare/v1.22.0...v1.23.0) (2025-06-03)


### Features

* add onClose prop to ClientEditForm and update cancel button functionality ([27173be](https://github.com/wize-works/jobsight-pro/commit/27173becfe8436046ad63e897d8975d01d94c84a))
* refactor client edit form and update import paths for consistency ([35c5672](https://github.com/wize-works/jobsight-pro/commit/35c567213f74f7d3b2d05afaf09594f6a652680f))

# [1.22.0](https://github.com/wize-works/jobsight-pro/compare/v1.21.0...v1.22.0) (2025-06-03)


### Features

* add loading states and new daily log page ([842d4b7](https://github.com/wize-works/jobsight-pro/commit/842d4b78ff78c02f3a28414524d30739f85d9c90))
* enhance project detail page with task editing functionality and milestone form reset ([5f7e41e](https://github.com/wize-works/jobsight-pro/commit/5f7e41e911fc1fe7734917e6e183cefef8979994))
* implement daily log detail page and enhance daily logs component with tabs ([249b0a3](https://github.com/wize-works/jobsight-pro/commit/249b0a3a9fea3945785004035ec4ab6a81a7cd4f))

# [1.21.0](https://github.com/wize-works/jobsight-pro/compare/v1.20.0...v1.21.0) (2025-06-02)


### Features

* enhance project editing modal with location and type selection ([680edfb](https://github.com/wize-works/jobsight-pro/commit/680edfbe5238797f91527d25aca5112b04ab0331))

# [1.20.0](https://github.com/wize-works/jobsight-pro/compare/v1.19.0...v1.20.0) (2025-06-02)


### Features

* add Azure storage environment variables to Dockerfile ([0d2fff2](https://github.com/wize-works/jobsight-pro/commit/0d2fff27f5ee75dc8fd725066b546dd3306e6c0c))

# [1.19.0](https://github.com/wize-works/jobsight-pro/compare/v1.18.0...v1.19.0) (2025-06-01)


### Features

* Implement project and issue management modals with CRUD functionality ([a236242](https://github.com/wize-works/jobsight-pro/commit/a236242714807b9201a7a9361d4cffe68012b249))

# [1.18.0](https://github.com/wize-works/jobsight-pro/compare/v1.17.0...v1.18.0) (2025-05-31)


### Features

* update sidebar styles and improve accessibility ([6374757](https://github.com/wize-works/jobsight-pro/commit/63747570fea3daae57eb6a3f0fed26a375f8f3d0)), closes [#5C95](https://github.com/wize-works/jobsight-pro/issues/5C95) [#983486](https://github.com/wize-works/jobsight-pro/issues/983486) [#983486](https://github.com/wize-works/jobsight-pro/issues/983486) [#5C95](https://github.com/wize-works/jobsight-pro/issues/5C95)

# [1.17.0](https://github.com/wize-works/jobsight-pro/compare/v1.16.0...v1.17.0) (2025-05-29)


### Features

* Implement project media, members, and tasks fetching ([5b7aff5](https://github.com/wize-works/jobsight-pro/commit/5b7aff53d49f173b9fd75c427cf5e4831b48e24d))

# [1.16.0](https://github.com/wize-works/jobsight-pro/compare/v1.15.1...v1.16.0) (2025-05-29)


### Features

* add GitHub deployment creation step in AKS deployment workflow ([f25fce9](https://github.com/wize-works/jobsight-pro/commit/f25fce9ea051597704dc717f182af38c61357462))
* add GitHub deployment details to AKS deployment workflow ([06aed1c](https://github.com/wize-works/jobsight-pro/commit/06aed1c9e06540463273571e40267e24db00bb19))

## [1.15.1](https://github.com/wize-works/jobsight-pro/compare/v1.15.0...v1.15.1) (2025-05-29)


### Bug Fixes

* streamline Docker login and build steps in deployment workflow ([a725afa](https://github.com/wize-works/jobsight-pro/commit/a725afad5493bd16d978ab6a1090854c970ea766))

# [1.15.0](https://github.com/wize-works/jobsight-pro/compare/v1.14.0...v1.15.0) (2025-05-29)


### Features

* add Kubernetes secret creation step in deployment workflow ([ce7db46](https://github.com/wize-works/jobsight-pro/commit/ce7db46273993da9b3608c1c7cccd3ede30b6d1b))

# [1.14.0](https://github.com/wize-works/jobsight-pro/compare/v1.13.1...v1.14.0) (2025-05-29)


### Bug Fixes

* remove PushManager component from DashboardLayout ([b545659](https://github.com/wize-works/jobsight-pro/commit/b545659ac90d95f32bb9653ad3b90f175744b2f6))


### Features

* add notification and push subscription management ([bfc72f9](https://github.com/wize-works/jobsight-pro/commit/bfc72f9884d66bccd1d2a58bc054402b9aebc61c))

## [1.13.1](https://github.com/wize-works/jobsight-pro/compare/v1.13.0...v1.13.1) (2025-05-28)


### Bug Fixes

* Correct import path for dynamic map component and ensure newline at end of manifest file ([9a70106](https://github.com/wize-works/jobsight-pro/commit/9a701065e790ffb372f3b7cabca547c963b94e03))

# [1.13.0](https://github.com/wize-works/jobsight-pro/compare/v1.12.0...v1.13.0) (2025-05-28)


### Bug Fixes

* Add 'use client' directive to landing page for client-side rendering ([8bbc3e0](https://github.com/wize-works/jobsight-pro/commit/8bbc3e036671f301e5f38841cf27e187417bb005))


### Features

* Add map functionality with equipment markers and location tracking ([66ecaa1](https://github.com/wize-works/jobsight-pro/commit/66ecaa175834c3109e1073b590a6892ef053244b))

# [1.12.0](https://github.com/wize-works/jobsight-pro/compare/v1.11.0...v1.12.0) (2025-05-28)


### Features

* Implement theme-based logo display on landing page ([7ed3782](https://github.com/wize-works/jobsight-pro/commit/7ed37821bf8ebf78aaf9b77fe43aee9520494a42))

# [1.11.0](https://github.com/wize-works/jobsight-pro/compare/v1.10.15...v1.11.0) (2025-05-28)


### Bug Fixes

* Refactor code structure for improved navigation ([76103e1](https://github.com/wize-works/jobsight-pro/commit/76103e1a6e3de8efbd9124caff286382d8b5ac2a))
* update sidebar menu styles for improved layout ([3a295aa](https://github.com/wize-works/jobsight-pro/commit/3a295aafd8bedf50340e6c40ce2b3b7598f442aa))


### Features

* Enhance type definitions and add options for documents, equipment, invoices, media, projects, and users ([d98e6d6](https://github.com/wize-works/jobsight-pro/commit/d98e6d61e30defb6c359b03b322a8182cc449eb9))

## [1.10.15](https://github.com/wize-works/jobsight-pro/compare/v1.10.14...v1.10.15) (2025-05-28)


### Bug Fixes

* add logging for user authentication and business data retrieval processes ([02ffb4d](https://github.com/wize-works/jobsight-pro/commit/02ffb4d9d8ec90b14e150e7b61a6f3100b06868c))

## [1.10.14](https://github.com/wize-works/jobsight-pro/compare/v1.10.13...v1.10.14) (2025-05-27)


### Bug Fixes

* add button styles to login link and comment out unused links ([50290ce](https://github.com/wize-works/jobsight-pro/commit/50290cedd97735988ab343a35e792bb20a75ee02))

## [1.10.13](https://github.com/wize-works/jobsight-pro/compare/v1.10.12...v1.10.13) (2025-05-27)


### Bug Fixes

* update tailwindcss and daisyui dependencies to specific versions ([cdbd7b4](https://github.com/wize-works/jobsight-pro/commit/cdbd7b4fd255edd7f0e6eb55cee93681aca7746a))

## [1.10.12](https://github.com/wize-works/jobsight-pro/compare/v1.10.11...v1.10.12) (2025-05-27)


### Bug Fixes

* update user creation command in Dockerfile for clarity ([8b8f8a2](https://github.com/wize-works/jobsight-pro/commit/8b8f8a2290bec056cbd60a19e5811401700de193))

## [1.10.11](https://github.com/wize-works/jobsight-pro/compare/v1.10.10...v1.10.11) (2025-05-27)


### Bug Fixes

* switch from alpine to slim variant for Node.js in Dockerfile ([a63cc85](https://github.com/wize-works/jobsight-pro/commit/a63cc850e7ad2e45164ffde0f046eb98c3889bda))

## [1.10.10](https://github.com/wize-works/jobsight-pro/compare/v1.10.9...v1.10.10) (2025-05-27)


### Bug Fixes

* remove duplicate @tailwindcss/postcss dependency from package.json ([f393b92](https://github.com/wize-works/jobsight-pro/commit/f393b92cea9f0cd906d0ec17f1ffdcfa60e9fc0d))

## [1.10.9](https://github.com/wize-works/jobsight-pro/compare/v1.10.8...v1.10.9) (2025-05-27)


### Bug Fixes

* simplify Dockerfile by consolidating COPY commands and removing unnecessary lines ([c4050dc](https://github.com/wize-works/jobsight-pro/commit/c4050dc83ebd2df4757f78e496f196f0ab2cb904))

## [1.10.8](https://github.com/wize-works/jobsight-pro/compare/v1.10.7...v1.10.8) (2025-05-27)


### Bug Fixes

* update dependencies for daisyui and tailwindcss in package.json ([ce6c7f7](https://github.com/wize-works/jobsight-pro/commit/ce6c7f76ec875352b2a2af9a29e80dac5bee4a0e))

## [1.10.7](https://github.com/wize-works/jobsight-pro/compare/v1.10.6...v1.10.7) (2025-05-27)


### Bug Fixes

* update PostCSS configuration and include next.config.js in TypeScript compilation ([bd7c358](https://github.com/wize-works/jobsight-pro/commit/bd7c3581e7330acd05de8f1fff8e056e91102a15))

## [1.10.6](https://github.com/wize-works/jobsight-pro/compare/v1.10.5...v1.10.6) (2025-05-27)


### Bug Fixes

* update CMD in Dockerfile to use npx for starting the application ([dcf9f7b](https://github.com/wize-works/jobsight-pro/commit/dcf9f7bfd8d0b1d6012ecbea6f6eab93b5e53726))

## [1.10.5](https://github.com/wize-works/jobsight-pro/compare/v1.10.4...v1.10.5) (2025-05-27)


### Bug Fixes

* correct path for copying static files in Dockerfile ([76221e4](https://github.com/wize-works/jobsight-pro/commit/76221e45354e917fb4a3c9a338aa6488a3d923ba))

## [1.10.4](https://github.com/wize-works/jobsight-pro/compare/v1.10.3...v1.10.4) (2025-05-27)


### Bug Fixes

* correct typo in Dockerfile for static files path ([a5f178b](https://github.com/wize-works/jobsight-pro/commit/a5f178b91919773da5b035161b141a1fb41e0396))

## [1.10.3](https://github.com/wize-works/jobsight-pro/compare/v1.10.2...v1.10.3) (2025-05-27)


### Bug Fixes

* update Dockerfile to copy static files and change start command ([65fea70](https://github.com/wize-works/jobsight-pro/commit/65fea704997ed0c243e66595c812eec13a617022))

## [1.10.2](https://github.com/wize-works/jobsight-pro/compare/v1.10.1...v1.10.2) (2025-05-27)


### Bug Fixes

* update PostCSS configuration to use object syntax for plugins ([3d790e0](https://github.com/wize-works/jobsight-pro/commit/3d790e0da5c4e12dfe611f6c3fc17363a560aaa3))

## [1.10.1](https://github.com/wize-works/jobsight-pro/compare/v1.10.0...v1.10.1) (2025-05-27)


### Bug Fixes

* update import path for globals.css in layout.tsx ([3b22c97](https://github.com/wize-works/jobsight-pro/commit/3b22c97b6667f0571e801f733c8d7a6d62199651))

# [1.10.0](https://github.com/wize-works/jobsight-pro/compare/v1.9.1...v1.10.0) (2025-05-27)


### Features

* add initial Tailwind CSS configuration file ([989ae9e](https://github.com/wize-works/jobsight-pro/commit/989ae9e072ce0953189d1e9179b5240080f9f1ac))

## [1.9.1](https://github.com/wize-works/jobsight-pro/compare/v1.9.0...v1.9.1) (2025-05-27)


### Bug Fixes

* update Dockerfile to copy next.config.js instead of next.config.ts ([16bcd82](https://github.com/wize-works/jobsight-pro/commit/16bcd8206ad396cd04f85ff98f777e75f29b6550))

# [1.9.0](https://github.com/wize-works/jobsight-pro/compare/v1.8.1...v1.9.0) (2025-05-27)


### Features

* refactor business context and remove deprecated files ([14271f7](https://github.com/wize-works/jobsight-pro/commit/14271f7d4d9b90d987b2e95aeb949a286dd974a2))

## [1.8.1](https://github.com/wize-works/jobsight-pro/compare/v1.8.0...v1.8.1) (2025-05-27)


### Bug Fixes

* update next.config file extension from mjs to ts for consistency ([66c5182](https://github.com/wize-works/jobsight-pro/commit/66c5182e8b8a3930c3a9e4dc6b5c5076907f1b40))

# [1.8.0](https://github.com/wize-works/jobsight-pro/compare/v1.7.12...v1.8.0) (2025-05-27)


### Features

* update dependencies and configuration for Tailwind CSS and DaisyUI ([3fef5ca](https://github.com/wize-works/jobsight-pro/commit/3fef5ca34a847a2ab325d99d2dba02011568b36a))

## [1.7.12](https://github.com/wize-works/jobsight-pro/compare/v1.7.11...v1.7.12) (2025-05-27)


### Bug Fixes

* remove unused generator metadata from layout.tsx for cleaner code ([103fd2b](https://github.com/wize-works/jobsight-pro/commit/103fd2bd4d7b0e33aec26bb6320cc7017c75ade4))

## [1.7.11](https://github.com/wize-works/jobsight-pro/compare/v1.7.10...v1.7.11) (2025-05-27)


### Bug Fixes

* update project name in package.json and package-lock.json for consistency; add KINDE_CLIENT_SECRET to Dockerfile for improved configuration ([47b6769](https://github.com/wize-works/jobsight-pro/commit/47b6769aa4c927782b4ca862b40a00463a25b579))

## [1.7.10](https://github.com/wize-works/jobsight-pro/compare/v1.7.9...v1.7.10) (2025-05-27)


### Bug Fixes

* add KINDE_CLIENT_ID argument and environment variable to Dockerfile for improved configuration ([4597619](https://github.com/wize-works/jobsight-pro/commit/4597619391db33e2e42ee3e3a3f77d72d92b4965))

## [1.7.9](https://github.com/wize-works/jobsight-pro/compare/v1.7.8...v1.7.9) (2025-05-27)


### Bug Fixes

* move KINDE_ISSUER_URL argument to the correct position in Dockerfile for improved clarity ([5fe12ad](https://github.com/wize-works/jobsight-pro/commit/5fe12ad55424de1831e956300e78a20f25bf14bc))

## [1.7.8](https://github.com/wize-works/jobsight-pro/compare/v1.7.7...v1.7.8) (2025-05-27)


### Bug Fixes

* add KINDE_ISSUER_URL argument and environment variable to Dockerfile for improved configuration ([1156e74](https://github.com/wize-works/jobsight-pro/commit/1156e741a6ed4b2ccf81085cd6121d55fb75d94f))

## [1.7.7](https://github.com/wize-works/jobsight-pro/compare/v1.7.6...v1.7.7) (2025-05-27)


### Bug Fixes

* add dynamic export to route.ts for improved handling of dynamic routes ([24cb2a2](https://github.com/wize-works/jobsight-pro/commit/24cb2a2c1f80dda0c40b32e2439fdfe9786bf59f))

## [1.7.6](https://github.com/wize-works/jobsight-pro/compare/v1.7.5...v1.7.6) (2025-05-27)


### Bug Fixes

* refactor next.config.mjs to improve path handling and maintainability ([6caf5f1](https://github.com/wize-works/jobsight-pro/commit/6caf5f1b17d98ada8a6b9db463427b9983320fcf))

## [1.7.5](https://github.com/wize-works/jobsight-pro/compare/v1.7.4...v1.7.5) (2025-05-27)


### Bug Fixes

* format next.config.mjs for improved readability and consistency ([837d2e0](https://github.com/wize-works/jobsight-pro/commit/837d2e004a438e234e834c75df6497a0be84f6fc))

## [1.7.4](https://github.com/wize-works/jobsight-pro/compare/v1.7.3...v1.7.4) (2025-05-27)


### Bug Fixes

* update deployment configuration to enhance environment variable management and secure sensitive values ([23a7d42](https://github.com/wize-works/jobsight-pro/commit/23a7d423903d157e32b0e8dac341bb3912a10cde))

## [1.7.3](https://github.com/wize-works/jobsight-pro/compare/v1.7.2...v1.7.3) (2025-05-27)


### Bug Fixes

* simplify Dockerfile by removing unnecessary environment variables and restructuring build stages ([9db0e8a](https://github.com/wize-works/jobsight-pro/commit/9db0e8a47e86043d57737f90d708149867fd4dde))

## [1.7.2](https://github.com/wize-works/jobsight-pro/compare/v1.7.1...v1.7.2) (2025-05-27)


### Bug Fixes

* update Dockerfile for improved build process and streamline environment variable handling ([e9a003f](https://github.com/wize-works/jobsight-pro/commit/e9a003f139ddfaa11750cf7ed80ffe1d869e7c9e))

## [1.7.1](https://github.com/wize-works/jobsight-pro/compare/v1.7.0...v1.7.1) (2025-05-27)


### Bug Fixes

* update Dockerfile to improve environment variable handling and build process ([bdbc55b](https://github.com/wize-works/jobsight-pro/commit/bdbc55bd90cd60f8f99003af96f5c5d52dbec310))

# [1.7.0](https://github.com/wize-works/jobsight-pro/compare/v1.6.0...v1.7.0) (2025-05-27)


### Features

* restructure Dockerfile and reintroduce deployment configuration files ([1d406d1](https://github.com/wize-works/jobsight-pro/commit/1d406d1d2244f45663fbb25332526d394f90059c))

# [1.6.0](https://github.com/wize-works/jobsight-pro/compare/v1.5.3...v1.6.0) (2025-05-27)


### Features

* add TypeScript types for task notes, dependencies, and tasks ([d72e18b](https://github.com/wize-works/jobsight-pro/commit/d72e18b6744a9ab3a89a955e43e405c0c77b32f5))

## [1.5.3](https://github.com/wize-works/jobsight-pro/compare/v1.5.2...v1.5.3) (2025-05-27)


### Bug Fixes

* Update Dockerfile to copy next.config.mjs instead of next.config.js ([d6d0565](https://github.com/wize-works/jobsight-pro/commit/d6d0565d3a52adb431300ecbb7c6eb31a7bca6d8))

## [1.5.2](https://github.com/wize-works/jobsight-pro/compare/v1.5.1...v1.5.2) (2025-05-27)


### Bug Fixes

* Update Dockerfile to clarify source and config file copying ([95dab4d](https://github.com/wize-works/jobsight-pro/commit/95dab4da52a5082ab8db081694d42cde2d0f7681))

## [1.5.1](https://github.com/wize-works/jobsight-pro/compare/v1.5.0...v1.5.1) (2025-05-27)


### Bug Fixes

* Correct formatting and structure of tsconfig.json for improved readability ([da178c9](https://github.com/wize-works/jobsight-pro/commit/da178c9e2a366ff48f2a4015b9b061a101df5002))

# [1.5.0](https://github.com/wize-works/jobsight-pro/compare/v1.4.0...v1.5.0) (2025-05-27)


### Features

* Add tsconfig.json to Dockerfile for TypeScript configuration during build ([73fe76b](https://github.com/wize-works/jobsight-pro/commit/73fe76bf4a379268ddabf982b2ba9f2d3282c042))

# [1.4.0](https://github.com/wize-works/jobsight-pro/compare/v1.3.0...v1.4.0) (2025-05-27)


### Features

* Add .dockerignore file to exclude unnecessary files from Docker context ([8ad08ad](https://github.com/wize-works/jobsight-pro/commit/8ad08ada56126a325685e52febe3c36fd2a2db13))

# [1.3.0](https://github.com/wize-works/jobsight-pro/compare/v1.2.0...v1.3.0) (2025-05-27)


### Features

* Enhance Dockerfile and deployment configuration with additional environment variables for Kinde and Supabase integration ([1565f26](https://github.com/wize-works/jobsight-pro/commit/1565f26990515b794062d732ec40caec6f60bf29))

# [1.2.0](https://github.com/wize-works/jobsight-pro/compare/v1.1.0...v1.2.0) (2025-05-27)


### Features

* Update deployment.yaml to enhance Doppler integration and streamline environment variable management ([d6a1891](https://github.com/wize-works/jobsight-pro/commit/d6a18912adf193c2e88e2c7da8a134bd0a7d4ca2))

# [1.1.0](https://github.com/wize-works/jobsight-pro/compare/v1.0.0...v1.1.0) (2025-05-27)


### Features

* Add Dockerfile for multi-stage build and runtime configuration ([9592357](https://github.com/wize-works/jobsight-pro/commit/959235744a96937b2d4c080095cc40f7416a17c2))

# 1.0.0 (2025-05-27)


### Bug Fixes

* change select input to use defaultValue for business type ([b9657b4](https://github.com/wize-works/jobsight-pro/commit/b9657b46260c6e54c805dde30e655dda5d30af1d))
* Correct equipment name display in crew detail component ([7458091](https://github.com/wize-works/jobsight-pro/commit/7458091ad32eb1ff97e637369d886d57a91da047))
* correct Kinde package name in dependencies ([2336424](https://github.com/wize-works/jobsight-pro/commit/2336424386b0f46d97e8880f643ac3b072bb52c1))
* correct Kinde package name in dependencies and imports ([25c60f6](https://github.com/wize-works/jobsight-pro/commit/25c60f6726e7c9f409cd781b2a6a961d6064e0f7))
* correct package name for Kinde authentication ([8ecfe33](https://github.com/wize-works/jobsight-pro/commit/8ecfe332e6450336137862b434b4db451162d6f8))
* correct Tailwind CSS import and DaisyUI setup ([25c84fb](https://github.com/wize-works/jobsight-pro/commit/25c84fbd5a36aa58165d1493239f50c266e5fb2c))
* correct Tailwind CSS import and DaisyUI setup ([e563cae](https://github.com/wize-works/jobsight-pro/commit/e563caeaba1b86321e19436e7db3c59dbbd1c849))
* correct useTheme import in theme-toggle component ([2587b2b](https://github.com/wize-works/jobsight-pro/commit/2587b2b1887a70e0a4af6c55fceb205915b358f3))
* replace Clerk auth with custom auth in onboarding page ([afca076](https://github.com/wize-works/jobsight-pro/commit/afca076402e33d66624483e1ece56651cd8d8486))
* update package.json formatting and dependencies ([690ea32](https://github.com/wize-works/jobsight-pro/commit/690ea32dcdc03a0a803d994ad9fb8811c53eb8c5))
* update PostCSS config to use CommonJS syntax ([8b1004f](https://github.com/wize-works/jobsight-pro/commit/8b1004faae4e7f2cec91b14387a130a292e3057b))
* update postcss version and remove unused dependencies ([52a1100](https://github.com/wize-works/jobsight-pro/commit/52a1100ef323dbb70b3737dc3ef9a3c1ee21d3d8))
* use value prop for select in business page ([fa573c4](https://github.com/wize-works/jobsight-pro/commit/fa573c461d139599b282eada28e3071575816daf))


### Features

* add @tailwindcss/postcss and update PostCSS config ([38eb37c](https://github.com/wize-works/jobsight-pro/commit/38eb37c4f5f764b823e63fa19999ee39dece796c))
* Add client edit form and client list management ([e4e14bc](https://github.com/wize-works/jobsight-pro/commit/e4e14bc9889fdd33bbaf15767f4168b2026606f0))
* add client edit form and new client page ([7295b83](https://github.com/wize-works/jobsight-pro/commit/7295b831d711c4f8de39dd6ddedb3431cf355606))
* Add crew management components and pages ([b826d3f](https://github.com/wize-works/jobsight-pro/commit/b826d3f2afef7917e7ffd00495125df33a687410))
* Add crew notes functionality and update equipment type display in crew detail component ([e9ebad7](https://github.com/wize-works/jobsight-pro/commit/e9ebad76ec444ed92da02ab9ddf0b5e489e9dd85))
* Add crew schedule history and current schedule fetching to crew page and detail component ([cee3818](https://github.com/wize-works/jobsight-pro/commit/cee3818a0a8a103d3270e555400257f12041b2b3))
* add loading component and projects page with mock data ([d110de7](https://github.com/wize-works/jobsight-pro/commit/d110de76c70dc4132f1a32f4b2b628908d6fb6b0))
* add LoginButton component and update landing page for authentication ([2be0b7b](https://github.com/wize-works/jobsight-pro/commit/2be0b7b766c20393a715d2a50ad96b2623b8918d))
* add postcss-import dependency to package.json and update pnpm-lock.yaml ([fc3aae3](https://github.com/wize-works/jobsight-pro/commit/fc3aae3b382d7771ff7e8ae321eeb7b2fe5f291d))
* Add project management functionality with modal for creating new projects ([4547329](https://github.com/wize-works/jobsight-pro/commit/4547329a16febde3aa2f86f98bdb572fe57579b0))
* add Reports module with dashboards and visualizations ([e2157e0](https://github.com/wize-works/jobsight-pro/commit/e2157e00ba1cfab4b9b5b42f7470208d00b01ebf))
* add Settings module for account and organization preferences ([4327836](https://github.com/wize-works/jobsight-pro/commit/4327836810e8308a5d21c9108ae29ba7607fbaa5))
* add Settings module for account and organization preferences ([1b96756](https://github.com/wize-works/jobsight-pro/commit/1b96756806a1177316f8eef762d52878d744c68f))
* add settings page for third-party API integrations ([00acb6c](https://github.com/wize-works/jobsight-pro/commit/00acb6cec44600e430c05bf1202193831e41b811))
* add Supabase integration settings page ([e676b4b](https://github.com/wize-works/jobsight-pro/commit/e676b4baeb927c6d876f9779261a94d75a3ccf0b))
* add tsconfig.json with ES2017 target ([aff3376](https://github.com/wize-works/jobsight-pro/commit/aff33769a265424c028a55183b18107ead0a317b))
* enhance crew and equipment edit pages with improved layout and navigation ([83a6615](https://github.com/wize-works/jobsight-pro/commit/83a661545c54377a3099f5aee8385bb48db9951e))
* enhance dashboard layout with Sidebar component and improve theme handling ([6cab117](https://github.com/wize-works/jobsight-pro/commit/6cab117c20f3dbf0ac2408c7b8bb9c785ee7ad6b))
* Enhance project crew management with additional fields and UI improvements ([8b03d3d](https://github.com/wize-works/jobsight-pro/commit/8b03d3d94c2bc54b9a3852ae9a495ce0d45d05fa))
* fork Jobsight Website Development ([d093f9d](https://github.com/wize-works/jobsight-pro/commit/d093f9ddd619f34bc149adf7888712a5380b18fa))
* Implement CRUD operations for client contacts, interactions, crew members, and projects ([9961797](https://github.com/wize-works/jobsight-pro/commit/9961797d745a82600c0f20a880f335ce81e413c1))
* Implement CRUD operations for media tags, media, project crews, project milestones, project issues, subtasks, task notes, task dependencies, and tasks with business context ([bc0d874](https://github.com/wize-works/jobsight-pro/commit/bc0d874eada7fba1bf16afe1a706c61ee8273ec8))
* Implement Equipment Print Page with detailed information and QR code generation ([e412078](https://github.com/wize-works/jobsight-pro/commit/e412078faf4299ca60c1c11df4efc72388b8742b))
* implement Navbar component and integrate with DashboardLayout ([61ee647](https://github.com/wize-works/jobsight-pro/commit/61ee6473b0dc655506f8e0210d42cddadf65f7d4))
* integrate Kinde for user authentication ([4941494](https://github.com/wize-works/jobsight-pro/commit/494149480f151db07a8fb2d54735533d072c1bec))
* integrate new logo files into navbar and dashboard ([23d6cfe](https://github.com/wize-works/jobsight-pro/commit/23d6cfe24f61e364ec45f1daddd5f411069c2565))
* Refactor equipment and crew management types, update imports, and add crew member assignment functionality ([ecb1f40](https://github.com/wize-works/jobsight-pro/commit/ecb1f40f950341c5f1bb38d7689e1e7fea15effd))
* restore Kinde authentication route with GET handler ([3793d53](https://github.com/wize-works/jobsight-pro/commit/3793d538a99aba514ad76663fa01859f7aa6dc25))
* restore v25 from v23 ([9a882ba](https://github.com/wize-works/jobsight-pro/commit/9a882ba0671e36266e98de10dbc3f1b8e343fab0))
* sync jobsight-pro-next with main ([664232b](https://github.com/wize-works/jobsight-pro/commit/664232b0f5704c7955933d8043b95066cab98664))
* sync jobsight-pro-next with v0.dev main ([34eb828](https://github.com/wize-works/jobsight-pro/commit/34eb828dfeabcefa78950682b6956bb08ecb8b2c))
* sync main with v0.dev deployments ([b6855a9](https://github.com/wize-works/jobsight-pro/commit/b6855a9b26fa3f2a40c523fc1e016fa21e33695b))
* update business management functionality with new server actions and context integration ([1fc3077](https://github.com/wize-works/jobsight-pro/commit/1fc30773b8e0aff2d0a4f658c2b5ef378d2ff881))
* Update ClientCard component to use Link for navigation and remove onClick prop ([1114a8f](https://github.com/wize-works/jobsight-pro/commit/1114a8f60ec84eecfe07940107d7e8ef410c36dd))
* update homepage layout and add theme toggle component ([aec4446](https://github.com/wize-works/jobsight-pro/commit/aec4446a2a63fb5343780df69a63b5a4543adb94))
