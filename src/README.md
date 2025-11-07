# MD Trader's Journal - Powered by Firebase Studio

Welcome to your comprehensive trading journal, designed to help you track, analyze, and improve your trading performance. This guide provides all the necessary steps to run, use, and deploy your application.

## Table of Contents

1.  [Running the Application Locally](#running-the-application-locally)
    -   [Prerequisites](#prerequisites)
    -   [One-Click Launch (for non-developers)](#one-click-launch-for-non-developers)
    -   [Developer Launch](#developer-launch)
2.  [How to Use the Application](#how-to-use-the-application)
    -   [Authentication](#authentication)
    -   [Data Storage & The Client-Server Model](#data-storage--the-client-server-model)
3.  [Deploying to the Web with Firebase](#deploying-to-the-web-with-firebase)
    -   [Deployment Prerequisites](#deployment-prerequisites)
    -   [Step-by-Step Deployment Guide](#step-by-step-deployment-guide)
4.  [Advanced Customization](#advanced-customization)
    -   [Changing Authentication Providers](#changing-authentication-providers)
    -   [Deploying to Other Platforms (Vercel, Netlify, etc.)](#deploying-to-other-platforms-vercel-netlify-etc)

---

## Running the Application Locally

You can run this application on your own computer in two ways: a simple one-click launch or the standard developer launch.

### Prerequisites

Before you start, ensure you have **Node.js** installed. This is the only requirement.
*   **Download Node.js**: [nodejs.org](https://nodejs.org/) (we recommend the LTS version).
*   **How to check if it's installed**: Open a command prompt or terminal and type `node -v`. If you see a version number (e.g., `v20.11.1`), you're ready.

### One-Click Launch (for non-developers)

This is the easiest way to run the app on a Windows PC without any technical knowledge.

1.  **First-Time Setup**:
    *   If you have a `.zip` file, unzip it to a folder on your computer.
    *   Open the folder, right-click on an empty space while holding `Shift`, and select "Open command window here" or "Open PowerShell window here".
    *   In the window that appears, type `npm install` and press Enter. This will download all the necessary components. This only needs to be done once.

2.  **Launch the App**:
    *   From now on, simply double-click the `start-app.bat` file in the application folder.
    *   A command window will appear and start the server. The application will automatically open in your web browser at **http://localhost:9003**.

> **Pro Tip**: For a true desktop app feel, right-click `start-app.bat`, create a shortcut, and move it to your desktop. You can even change its icon to the `logo.svg` located in the `public` folder.

### Developer Launch

If you are a developer, you can use the standard Node.js commands.

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
3.  Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How to Use the Application

### Authentication

The application supports two modes:

*   **Sign in with Google**: This is the recommended option. Your data will be securely stored in your personal Firebase cloud account, allowing you to access your journal from any device.
*   **Continue as Guest**: If you prefer not to create an account, you can use the guest mode. All your data will be saved locally on your computer's web browser.

### Data Storage & The Client-Server Model

It's important to understand how your data is stored.

*   **Firebase Authentication Works Locally**: You do not need to deploy the application to use Google Sign-In. Your local application (`localhost`) connects directly to the live Firebase Authentication servers in the cloud.
*   **Guest Users (Local Storage)**: When you 'Continue as Guest', all data is stored in your browser's `localStorage`. This is fast and works completely offline, but it means your data is tied to a single computer and browser. **Clearing your browser cache may delete your data**, so regular backups using the app's export feature are highly recommended for guest users.
*   **Signed-In Users (Cloud & Local Storage)**: When you sign in with Google, your data is stored in a hybrid model. It's kept in your browser's local storage for speed and offline functionality, and it's also automatically synchronized with your private Firebase Firestore database in the cloud. This provides a seamless backup and allows you to access your data across any device you sign in from.

---

## Deploying to the Web with Firebase

This application is built for easy deployment with **Firebase App Hosting**.

### Deployment Prerequisites

1.  **Google Account**: You need a Google account to use Firebase.
2.  **Firebase CLI**: You must have the Firebase Command Line Interface (CLI) installed. If you don't have it, run this command in your terminal:
    ```bash
    npm install -g firebase-tools
    ```

### Step-by-Step Deployment Guide

Follow these steps in your terminal from the application's root folder.

**Step 1: Log in to Firebase**

This command will open a browser window for you to log in to your Google account.

```bash
firebase login
```

**Step 2: Initialize App Hosting**

You only need to do this once. This command links your local project to a Firebase project.

```bash
firebase apphosting:backends:create
```

*   It will ask you to select a Firebase project. If you don't have one, you can create a new one.
*   It will ask for a backend ID. You can use the default suggestion or enter your own (e.g., `md-journal-backend`).
*   It will ask for the region. Choose the one closest to you.

**Step 3: Deploy the Application**

This is the final step. This command bundles your application and sends it to Firebase to be hosted live on the web.

```bash
firebase apphosting:backends:deploy
```

After the command finishes, the terminal will display the **live URL** of your deployed application. You can share this URL with anyone.

That's it! Your MD Trader's Journal is now live.

---

## Advanced Customization

### Changing Authentication Providers

This application is built with a tight integration to Firebase Authentication for ease of use. However, the architecture is designed to be adaptable. If you want to switch to another authentication provider (e.g., Supabase, Auth0, Clerk), you will need to perform the following developer tasks:

1.  **Install the New Provider's SDK**: Add the necessary client-side library for your chosen auth provider to `package.json`.
2.  **Replace the Firebase Provider**: The `src/firebase/client-provider.tsx` and `src/firebase/provider.tsx` components currently wrap the application to provide Firebase context. You will need to create a similar provider for your new service.
3.  **Update Authentication Hooks**: The application uses the `useUser()` and `useAuth()` hooks (found in `src/firebase/provider.tsx`) to access the user's state. You must replace these with equivalent hooks from your new provider's SDK.
4.  **Update UI Components**: Search the project for any component that uses `useUser` or `useAuth` and update it to use your new hooks. The main files to check will be `src/app/login/page.tsx` and `src/components/main-header.tsx`.

### Deploying to Other Platforms (Vercel, Netlify, etc.)

While this app is optimized for Firebase App Hosting, it is a standard Next.js application and can be deployed to any hosting provider that supports Next.js.

To do so:

1.  **Choose a Hosting Provider**: Platforms like [Vercel](https://vercel.com/) (from the creators of Next.js), [Netlify](https://www.netlify.com/), or [AWS Amplify](https://aws.amazon.com/amplify/) are excellent choices.
2.  **Follow Their Documentation**: Each platform has its own process for connecting a GitHub repository and deploying a Next.js app. You will need to follow their specific instructions.
3.  **Environment Variables**: You will need to add your Firebase configuration details (from `src/firebase/config.ts`) as environment variables in your new hosting provider's project settings. This ensures the deployed app can connect to your Firebase backend for authentication and database services.
4.  **Remove Firebase Hosting Config**: You can safely delete the `apphosting.yaml` file, as it is specific to Firebase App Hosting and will not be used by other providers.
