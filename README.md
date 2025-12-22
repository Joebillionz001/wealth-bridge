# WealthBridge

WealthBridge is a modern investment platform prototype designed to help users grow their wealth through diversified investment opportunities. This application provides a user-friendly interface for managing funds, tracking portfolios, and exploring various investment categories like Real Estate, Technology, and Cryptocurrency.

## Features

*   **User Authentication:** Secure signup and login flows (simulated).
*   **Interactive Dashboard:** Real-time overview of total balance, investments, and profits.
*   **Investment Plans:** Browse and invest in categorized plans with varying ROIs and durations.
*   **Portfolio Management:** Track active and completed investments with detailed status updates.
*   **Financial Analytics:** Visual charts for balance history and portfolio distribution using Chart.js.
*   **Transaction History:** Detailed log of deposits, withdrawals, and earnings with CSV export and receipt generation.
*   **Profile & Settings:** Manage user details, security settings, and toggle Dark Mode.
*   **Testimonials & Leaderboard:** View success stories and top investors (simulated social proof).
*   **Responsive Design:** Fully optimized for desktop and mobile devices.

## Technologies Used

*   **Frontend:** HTML5, CSS3, JavaScript (ES6 Modules)
*   **Libraries:**
    *   [Chart.js](https://www.chartjs.org/) for data visualization.
    *   [Paystack Inline](https://paystack.com/docs/payments/inline/) for payment simulation.
*   **Data Persistence:** Browser `localStorage` (Mock Backend).

## Getting Started

To run this project locally, you need a simple HTTP server because it uses JavaScript ES6 modules.

### Prerequisites

*   A modern web browser (Chrome, Firefox, Edge).
*   VS Code with "Live Server" extension (Recommended) OR Node.js installed.

### Installation

1.  **Clone the repository** (or download the source code):
    ```bash
    git clone https://github.com/yourusername/wealth-bridge.git
    cd wealth-bridge
    ```

2.  **Run the application:**

    *   **Option A (VS Code):** Open the folder in VS Code, right-click on `index.html`, and select "Open with Live Server".
    *   **Option B (Node.js http-server):**
        ```bash
        npx http-server .
        ```
        Then open the URL shown in your terminal (usually `http://127.0.0.1:8080`).

3.  **Login Credentials:**
    Since this is a prototype, you can sign up with any email/password to create a new local account.

## Project Structure

*   `index.html`: Landing page.
*   `dashboard.html`: Main user dashboard.
*   `investments.html`: Investment plans browsing page.
*   `style.css` & `dashboard.css`: Global and specific styling.
*   `main.js`: Main entry point handling routing and initialization.
*   `api-service.js`: Mock API service handling data logic and localStorage interactions.
*   `auth.js`: Authentication logic.
*   `dashboard.js`: Dashboard logic (charts, transactions).

## Important Notes

*   **Prototype Status:** This application is a frontend prototype. It does not connect to a real backend server. All data is stored in your browser's `localStorage`. Clearing your cache will reset the data.
*   **Payments:** The Paystack integration is set up for demonstration. Ensure you are using Test Keys if you plan to modify the payment logic to avoid real charges.