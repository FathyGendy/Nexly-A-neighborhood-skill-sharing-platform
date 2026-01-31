# Nexly - Neighborhood Skill Sharing Platform

[![Live Demo](https://img.shields.io/badge/Live_Demo-nexly.runasp.net-blue?style=for-the-badge)](https://nexly.runasp.net/)
[![.NET 9](https://img.shields.io/badge/.NET_9-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Stripe](https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)

> **"Help is just around the corner."**

Nexly is a modern full-stack hyper-local service marketplace. It connects community members with verified local experts for tasks like gardening, tutoring, cleaning, and repairs. Built with a focus on trust, the platform features real-time communication, secure payments, and AI-assisted discovery.

---

## Screenshots

**Provider Dashboard**
![Nexly Dashboard](Nexly.Web/src/assets/dashboard.jpeg)

<br>

| Landing Page | Service Search |
|:---:|:---:|
| <img src="Nexly.Web/src/assets/landing-page.jpeg" width="400" alt="Landing Page"> | <img src="Nexly.Web/src/assets/service-search.jpeg" width="400" alt="Service Search"> |

*(Note: The app allows providers to list services and users to book them instantly.)*

---

## Key Features

### For Service Seekers
*   **AI Assistant ("Nexy"):** An integrated OpenAI chatbot that helps you find the right service or answers support questions instantly.
*   **Smart Search:** Filter services by category, location, and price.
*   **Real-Time Chat:** Built with SignalR, allowing seamless live messaging with providers before booking.
*   **Social Proof:** Read verified reviews and see ratings before hiring.

### For Service Providers
*   **Verified Badge System:** A verification workflow to build trust with neighbors.
*   **Provider Dashboard:** Manage bookings, earnings, and service listings in one place.
*   **Secure Payouts:** Integrated Stripe Connect for secure and fast payment processing.

---

## Technical Architecture

This project is built using Clean Architecture principles to ensure separation of concerns, scalability, and maintainability.

### The Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React (Vite), TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | ASP.NET Core Web API (.NET 9) |
| **Database** | SQL Server, Entity Framework Core (Code-First) |
| **Real-Time** | Azure SignalR Service / Native SignalR |
| **AI** | OpenAI GPT-4 Integration |
| **Cloud/Media**| Cloudinary (Image Optimization), Azure Blob Storage |
| **Auth** | JWT Authentication with Refresh Tokens |
| **Payments** | Stripe API |

---

### Prerequisites
*   .NET 9 SDK
*   Node.js & npm
*   SQL Server

---

Built with ❤️ by Fathy
