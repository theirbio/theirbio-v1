- **Intuitive Dashboard**: A private, authenticated dashboard to easily manage and update your profile information.
- **Visually Stunning UI**: A modern, minimalist design with a focus on typography, spacing, and user experience.
## Technology Stack
- **Frontend**:
  - [React](https://reactjs.org/)
  - [React Router](https://reactrouter.com/)
  - [Vite](https://vitejs.dev/)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [shadcn/ui](https://ui.shadcn.com/)
  - [Framer Motion](https://www.framer.com/motion/) for animations
  - [Zustand](https://zustand-demo.pmnd.rs/) for state management
- **Backend**:
  - [Cloudflare Workers](https://workers.cloudflare.com/)
  - [Hono](https://hono.dev/)
- **Storage**:
  - [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- **Language**:
  - [TypeScript](https://www.typescriptlang.org/)
## Getting Started
Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.
### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- [Bun](https://bun.sh/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
### Installation
1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/theirbio.git
    cd theirbio
    ```
2.  **Install dependencies:**
    ```sh
    bun install
    ```
3.  **Run the development server:**
    This command starts the Vite frontend server and the Wrangler dev server for the backend API concurrently.
    ```sh
    bun dev
    ```
The application will be available at `http://localhost:3000`.
## Project Structure
- `src/`: Contains the frontend React application.
  - `pages/`: Top-level page components.
  - `components/`: Reusable UI components, including shadcn/ui elements.
  - `stores/`: Zustand state management stores.
  - `lib/`: Utility functions and API client.
- `worker/`: Contains the Cloudflare Worker backend code.
  - `index.ts`: The entry point for the worker.
  - `user-routes.ts`: Hono API routes for user and profile management.
  - `entities.ts`: Durable Object entity definitions.
- `shared/`: Contains TypeScript types shared between the frontend and backend.
## Deployment
This project is designed for seamless deployment to the Cloudflare network.
1.  **Log in to Wrangler:**
    If you haven't already, authenticate the Wrangler CLI with your Cloudflare account.
    ```sh
    wrangler login
    ```
2.  **Deploy the application:**
    This command will build the frontend, then deploy both the static assets and the worker to your Cloudflare account.
    ```sh
    bun deploy
    ```
Alternatively, you can deploy your own version of this project with a single click.
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/syedwasiqbukhari-123/theirBio-generated-app-20250930-235153)
## Available Scripts
- `bun dev`: Starts the local development server for both frontend and backend.
- `bun build`: Builds the frontend application for production.
- `bun deploy`: Deploys the application to Cloudflare Workers.
- `bun lint`: Lints the codebase using ESLint.