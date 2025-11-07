# MD Trader's Journal - Installation Guide

Thank you for using MD Trader's Journal. This guide will walk you through the process of setting up and running the application on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

1.  **Node.js**: The application is built on Node.js. We recommend using the latest Long-Term Support (LTS) version. You can download it from [nodejs.org](https://nodejs.org/).
    *   To check if you have Node.js installed, open your terminal or command prompt and run: `node -v`. This should print the version number (e.g., `v20.11.1`).
2.  **npm (Node Package Manager)**: npm is included with Node.js. It's used to manage the application's dependencies.
    *   To check your npm version, run: `npm -v`.

## Step 1: First-Time Setup

You only need to do these steps once.

1.  **Download and Unzip**: If you received the application as a `.zip` file, unzip it to a permanent location on your computer (e.g., `C:\Apps\MD-Journal` or your Documents folder).

2.  **Install Dependencies**: You need to install the required packages for the application.
    *   Navigate into the application folder in File Explorer.
    *   Click the address bar at the top, type `cmd`, and press `Enter`.
    *   In the black command window that appears, type the following command and press `Enter`:
        ```bash
        npm install
        ```
    *   This may take a few minutes. Once it's finished, you can close the command window.

## Step 2: Running the Application (One-Click Launch)

After the first-time setup, you no longer need to use the command prompt.

1.  **Go to the application folder.**
2.  **Double-click the `start-app.bat` file.**

A new command window will open and start the server. After a few seconds, the application will automatically open in your default web browser.

3.  **Open in Browser**: The application runs at:
    **[http://localhost:9003](http://localhost:9003)**

You can bookmark this address for easy access.

## Optional: Create a Desktop Shortcut

For a true desktop app feel, you can create a shortcut.

1.  Right-click on the `start-app.bat` file and select **Create shortcut**.
2.  Rename the new shortcut to "MD Trader's Journal".
3.  You can now move this shortcut to your Desktop, Start Menu, or Taskbar.
4.  **(Optional) Change the Icon**:
    *   Right-click the new shortcut and select **Properties**.
    *   In the **Shortcut** tab, click **Change Icon...**.
    *   Click **Browse...** and navigate to your application folder.
    *   Go into the `public` folder and select the `logo.svg` file.
    *   Click **OK** on all windows.

Now you have a desktop icon that launches your application with a single click!

## Offline Functionality & Data Safety

The application is designed to be fully functional offline. All your journal data is stored locally in your browser's storage. This means:
*   You do not need an internet connection to use the app after the initial setup.
*   Your data is private and stays on your device.
*   Performance is fast as it does not rely on a remote server for core operations.

**Important**: Because data is stored locally, **clearing your browser's cache or site data could result in the loss of all your journal entries.** Please use the application's built-in **Import/Export** functionality regularly to back up your data to a safe location.

---

That's it! You're all set up. Happy trading!
