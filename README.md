# Event Horizon Dashboards

A dashboard application for event management, built with React, TypeScript, Vite, and Tailwind CSS.

## Features
- User authentication and role-based access
- Event creation, management, and categorization
- Badge designer and batch badge printing
- Attendee and guest management
- Usher and organizer dashboards
- Vendor management and task tracking
- Real-time notifications and messaging
- Audit logs and reporting
- Responsive, mobile-friendly UI

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or bun (for package management)

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd event-horizon-dashboards
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```
3. Copy the example environment file and configure as needed:
   ```bash
   cp env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   # or
   bun run dev
   ```
5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
├── public/                # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # API and utility libraries
│   ├── pages/             # Page components (route views)
│   ├── styles/            # Global and print styles
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── package.json           # Project metadata and scripts
├── tailwind.config.ts     # Tailwind CSS configuration
├── vite.config.ts         # Vite configuration
└── README.md              # Project documentation
```

## Scripts
- `npm run dev` – Start development server
- `npm run build` – Build for production
- `npm run preview` – Preview production build
- `npm run lint` – Lint codebase

## Contributing

To contribute:
1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to your branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

---

For backend API and more, see the `validity_backend` directory.
