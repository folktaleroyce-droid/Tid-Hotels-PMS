# Tidé Hotels - Production-Grade Property Management System (PMS)

## 1. Project Overview

This document outlines the architecture for a production-grade, industrial-use Property Management System (PMS) for Tidé Hotels. The system is designed from the ground up to be a real-time, multi-user, and scalable platform, addressing the critical need for instant data synchronization across all hotel operations.

This architecture moves beyond client-side simulation to a robust client-server model, ensuring data integrity, security, and performance suitable for commercial deployment.

**Core Tenets:**
- **Single Source of Truth:** All data resides in a centralized cloud database.
- **Real-Time First:** All data updates are pushed to clients instantly via WebSockets. Polling is not used.
- **Secure & Scalable:** The system is built on enterprise-grade, managed infrastructure with robust security policies.
- **Modular & Extensible:** The architecture supports future growth and integration with third-party services.

---

## 2. Core Architecture: Vercel + Supabase

To meet the requirements of real-time functionality, security, and scalability, we will use a decoupled frontend and backend architecture.



### Frontend:
- **Framework:** React (Vite/Next.js)
- **Deployment:** Vercel
- **Responsibilities:**
    - Rendering the user interface.
    - Subscribing to real-time data channels from the backend.
    - Sending user-initiated mutations (e.g., creating a booking, updating room status) to the backend API.
    - Handling user authentication state.

### Backend:
- **Platform:** **Supabase** (Open Source Firebase Alternative)
- **Responsibilities:**
    - **Database:** A dedicated, scalable PostgreSQL database serves as the single source of truth.
    - **Real-time Engine:** Supabase's built-in Realtime Server listens for database changes (INSERT, UPDATE, DELETE) and instantly broadcasts these changes to all subscribed clients over WebSockets.
    - **Authentication:** Manages user identities, roles, and access via JWTs.
    - **API:** Auto-generates a secure RESTful API for all database interactions.
    - **Serverless Functions:** For custom business logic, such as integrating with third-party OTA APIs or payment gateways.

---

## 3. Real-Time System Deep Dive

The core of the PMS is its real-time capability, which is achieved through Supabase's integrated services.

**The Real-time Data Flow:**
1.  **Subscription:** When a user logs in, the React frontend uses the `supabase-js` client library to subscribe to specific database tables or filtered channels (e.g., `rooms`, `reservations`, `maintenance_requests`).
2.  **Action:** A front-desk clerk checks a guest in. The React app sends an `INSERT` request to the `guests` table and an `UPDATE` to the `rooms` table via the Supabase API.
3.  **Database Change:** The PostgreSQL database commits the transaction.
4.  **Broadcast:** The database change is detected by Supabase's Realtime Server, which immediately pushes a JSON payload containing the new data down the persistent WebSocket connection to all subscribed clients.
5.  **UI Update:** The React app on every connected device (manager's laptop, housekeeper's tablet) receives the payload. The application's state is updated, and the UI re-renders instantly to reflect the change (e.g., the room color changes from green to blue) without a page refresh.

**Conflict Resolution:**
- **Atomic Transactions:** PostgreSQL ensures that all database operations are atomic (they either fully complete or fail entirely), preventing partially-updated, corrupt data.
- **Optimistic Locking:** For critical operations like booking the last room, a database function can be used to first check availability and then create the booking in a single, locked transaction, preventing double-bookings from concurrent requests.

---

## 4. OTA Channel Manager Integration Strategy

Directly integrating with multiple OTA APIs (Booking.com, Expedia, etc.) is complex and requires certification. The industry-standard approach is to use a **master Channel Manager service** (like SiteMinder, RateGain, or Cloudbeds) as a single point of integration.

**Integration Flow:**
1.  **API Partnership:** Tidé Hotels partners with a Channel Manager provider and gains API access.
2.  **Backend Connection:** A **Supabase Edge Function** is created to act as the middleware between our PMS and the Channel Manager API.
3.  **Two-Way Synchronization:**
    - **PMS -> Channel Manager (Push):** When a staff member changes a room rate, blocks a room (`stopSell`), or a walk-in guest occupies a room, a database trigger fires the Supabase Edge Function. This function then calls the Channel Manager's API to update the inventory and rates across all connected OTAs.
    - **Channel Manager -> PMS (Pull/Webhook):** When a new reservation is made on an OTA, the Channel Manager receives it and calls a dedicated, secure **webhook endpoint** in our Supabase backend. This function then securely parses the reservation data and inserts it into our `reservations` table.
4.  **Real-time Update:** As soon as the new reservation is inserted into our database, the real-time system (from section 3) automatically pushes this new booking to all connected PMS clients instantly.

This architecture prevents double-bookings and ensures perfect synchronization between internal operations and external sales channels.

---

## 5. Database & Security Model

### Authentication
- Supabase Auth will be used for user management, supporting email/password, OAuth (Google, etc.), and magic links.
- Every authenticated request to the backend API will include a secure JSON Web Token (JWT).

### Roles & Permissions (Row-Level Security)
PostgreSQL's **Row-Level Security (RLS)** is a powerful feature that allows us to define granular data access policies directly in the database. This is far more secure than handling permissions in the frontend or API layer.

**Example Policies:**
- `CREATE POLICY "Housekeeping can only see and update room status" ON rooms FOR ALL USING (auth.jwt() ->> 'role' = 'housekeeping') WITH CHECK (auth.jwt() ->> 'role' = 'housekeeping' AND status IN ('Dirty', 'Cleaning', 'Vacant'));`
- `CREATE POLICY "Front desk can access guest details" ON guests FOR SELECT USING (auth.jwt() ->> 'role' = 'front_desk' OR auth.jwt() ->> 'role' = 'manager');`
- `CREATE POLICY "Users can only see their own staff profile" ON employees FOR SELECT USING (email = auth.jwt() ->> 'email');`

### Audit Logging
A dedicated `audit_log` table will be created. Database triggers on critical tables (`guests`, `transactions`, `rooms`) will automatically insert a new row into the audit log whenever data is changed, recording who made the change, what changed, and when.

---

## 6. Deployment & Scalability

- **Frontend:** The React application is deployed as a static/server-rendered site on **Vercel**, leveraging its global CDN for fast load times worldwide.
- **Backend:** **Supabase** is a managed service that handles database scaling, backups, and real-time server maintenance automatically. It can handle thousands of concurrent connections and is built to scale with demand.

This architecture is cost-effective to start and can scale seamlessly as the hotel's operations grow.

---

## 7. Future Expansion

This modular design allows for future enhancements with minimal disruption.
- **APIs:** Supabase automatically provides a secure RESTful API. A GraphQL endpoint can be added using community extensions if needed for more complex data-fetching requirements.
- **New Modules:** Adding a new module like "Point of Sale (POS)" would involve creating new tables in the database (`menu_items`, `pos_orders`), setting up RLS policies, and building the corresponding frontend components that subscribe to the new data. The core architecture remains unchanged.
- **Offline Readiness:** For enhanced resilience, a Service Worker can be implemented in the frontend to cache data and queue actions taken while offline. Once connectivity is restored, the Service Worker would sync the queued actions with the backend.
