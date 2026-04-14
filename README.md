# Task Flow 🚀

Task Flow is a full-stack MERN (MongoDB, Express, React, Node.js) application designed to streamline task assignment, project management, and employee tracking. It features a clean, responsive UI and a robust API backend.

## 🏗️ How It Works (System Architecture)

The application follows a standard Client-Server architecture with a clear separation of concerns:

1. **The Client (Frontend):** Built with React and Vite. It handles the user interface, client-side routing, and local state management. It communicates with the backend exclusively via RESTful HTTP requests.
2. **The Server (Backend):** Built with Node.js and Express. It acts as the gatekeeper, receiving requests from the frontend, enforcing authentication/authorization, and processing business logic.
3. **The Database:** MongoDB is used to securely store persistent data (users, tasks, projects). The backend uses Mongoose (an ODM) to structure and validate this data before saving it.

---

## 🗺️ Application Sitemap & Routing

The frontend utilizes `react-router-dom` to manage navigation between distinct views. Here is the structural sitemap:

*   **`/login`** (Public)
    *   The entry point. Users must authenticate here. If a user is already logged in, they are automatically redirected to the Dashboard.
*   **`/dashboard`** (Protected)
    *   **Main View:** The primary workspace where users can see tasks assigned to them.
    *   **Interactions:** Users can change task statuses (e.g., Pending -> In Progress), view task details, and manage their daily workflow.
*   **`/admin`** (Protected)
    *   **Control Panel:** Dedicated to management and administrative duties.
    *   **Sub-sections (Tabs/Panels):**
        *   *Projects Management:* Create, view, and assign projects.
        *   *Employees Management:* Add new employees to the system and manage access.
        *   *Services Management:* Define the types of services the organization provides.
        *   *Task Overview:* A holistic view of all tasks across all projects and employees.

---

## 🔄 How Components Interact (Data Flow Process)

Understanding how data moves through Task Flow is key to understanding the application. Here is the step-by-step lifecycle of a typical action (e.g., "Adding a new Task"):

### 1. User Interaction (The View)
A user clicks a "Create Task" button in the **React UI** (e.g., inside the Admin Panel component). This opens a form. The user fills out the data and clicks Submit.

### 2. State & Context Management (The Bridge)
Instead of the UI component talking directly to the server, the component calls a function provided by the **`DataContext`**. 
*   *Why?* Centralizing this keeps components clean and ensures that when data updates, the whole app knows about it.

### 3. API Request (The Network)
The `DataContext` formats the data and makes an asynchronous HTTP `POST` request (using `fetch` or `axios`) to the backend endpoint: `http://localhost:5000/api/tasks`.

### 4. Route & Controller (The Server)
The Express backend receives the request at the `server/routes/tasks.js` file. 
*   It checks the request headers to ensure the user is authenticated (via a JWT token).
*   It parses the incoming JSON data.

### 5. Database Interaction (The Model)
The server passes the data to the **Mongoose Model** (`server/models/Task.js`). Mongoose validates the data (e.g., ensuring the title isn't empty, ensuring the Project ID exists). If valid, it writes the new document to the MongoDB database.

### 6. The Response & Update
*   **Server Reply:** The backend sends a success response `201 Created` back to the frontend, along with the newly created task data.
*   **State Update:** The `DataContext` receives this new data and updates its internal React State.
*   **UI Re-render:** Because the state changed, React automatically re-renders the UI, and the user instantly sees the new task appear on their screen.

---

## 💻 Tech Stack Summary

*   **Frontend UI:** React 19, HTML5, CSS3, `react-icons`
*   **Frontend Tooling:** Vite, `react-router-dom`, Context API
*   **Backend Server:** Node.js, Express.js
*   **Database:** MongoDB, Mongoose ODM
*   **Security & Auth:** `bcryptjs` (password hashing), JSON Web Tokens (JWT), CORS

## 🚀 Getting Started Locally

1. **Clone the repository.**
2. **Setup Backend:**
   * Navigate to `/server`.
   * Run `npm install`.
   * Create a `.env` file with `MONGO_URI`, `PORT`, and `JWT_SECRET`.
   * Run `npm run dev` to start the backend on port 5000.
3. **Setup Frontend:**
   * Navigate to the root directory.
   * Run `npm install`.
   * Run `npm run dev` to start the React UI.
