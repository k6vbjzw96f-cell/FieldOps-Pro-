# Field Force Solutions - Product Requirements Document

## Original Problem Statement
Create a field service workforce management platform for technicians with task scheduling, map/location tracking, inventory management, reporting & analytics, and team/worker management. Like Simpro with quoting, invoicing, customer portal, and email notifications.

## Business Name
Field Force Solutions

## User Personas
1. **Admin** - Full access, manages team, views all reports
2. **Dispatcher** - Creates jobs, assigns technicians, manages schedule
3. **Technician** - Views assigned jobs, updates status, tracks inventory
4. **Customer** - Views quotes/invoices via portal links, makes payments

## Core Features (Implemented)
- ✅ User Authentication (JWT)
- ✅ Dashboard with metrics & analytics
- ✅ Customer Management (CRUD)
- ✅ Quote System (create, send, accept/decline)
- ✅ Invoice System with Stripe Payment Links
- ✅ Customer Portal (public links for quotes/invoices)
- ✅ Job/Task Management (scheduling, assignment)
- ✅ GPS Map Tracking (Leaflet)
- ✅ Inventory Management
- ✅ Team Management
- ✅ Reports & Analytics
- ✅ Stripe Subscription Billing
- ✅ Australian GST (10%) calculation

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, Recharts
- Backend: FastAPI, Python
- Database: MongoDB
- Payments: Stripe
- Maps: Leaflet
- Email: Resend (ready, needs API key)

## Subscription Plans
- Free: $0 (1 user, 10 tasks)
- Starter: $29/mo (5 users, unlimited tasks)
- Pro: $79/mo (20 users, maps, analytics)
- Enterprise: $199/mo (unlimited, SMS/email, priority support)

## What's Been Implemented (January 2026)
1. Full authentication system
2. Customer database with CRUD
3. Quoting system with PDF-like view
4. Invoicing with Stripe payment links
5. Customer portal for quote acceptance & invoice payment
6. Job management with calendar view
7. GPS tracking map
8. Inventory management
9. Team management
10. Reports dashboard
11. Settings with billing
12. Rebranded to "Field Force Solutions"

## P0 Features (Complete)
- Customer management
- Quote creation & sending
- Invoice creation with payment links
- Job scheduling
- Team management

## P1 Features (Next Phase)
- Email notifications (needs Resend API key)
- SMS notifications (needs Twilio keys)
- Job completion photos
- Time tracking
- Recurring invoices

## P2 Features (Backlog)
- Mobile app (React Native)
- QuickBooks/Xero integration
- Custom forms
- Client signature capture
- Route optimization
