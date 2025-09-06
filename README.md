# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### What is the build folder doing?

When you run `npm run build`, React Router compiles your application for production and outputs a `build/` directory at the project root.

Inside `build/` you will typically see:
- `build/client/` — your static, optimized client assets (HTML, CSS, JS, images). These are what the browser downloads.
- `build/server/` — the server bundle used by the app server to handle SSR (server-side rendering), data loading, and routing.

How it’s used:
- The `start` script (`npm start`) runs `react-router-serve` against `./build/server/index.js`, which serves the server bundle and also serves the static assets from `build/client/`.
- This separation lets you deploy the server code and the client assets together efficiently.

Notes:
- Do not edit files in `build/` manually; they are generated artifacts and will be overwritten on the next build.
- Ensure `build/` is ignored by version control (e.g., via `.gitignore`).
- If you’re using Docker (as in this repo), the image build step should run `npm run build` and then use the `build/` output at runtime.

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
