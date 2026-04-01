document.addEventListener("DOMContentLoaded", async () => {
    const navActions = document.getElementById('navActions');

    try {
        // Ping an authenticated endpoint to see if the cookie is valid
        const response = await fetch(`${ENV_CONFIG.API_BASE_URL}/users`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            // User is logged in
            navActions.innerHTML = `
                <div class="flex items-center gap-4">
                    <a href="./pages/users.html" class="text-sm font-semibold text-purple-600 hover:text-purple-700">Go to Dashboard</a>
                    <button id="logoutBtn" class="px-4 py-2 rounded-md font-medium text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-all">Log Out</button>
                </div>
            `;
            
            // Attach logout event
            document.getElementById('logoutBtn').addEventListener('click', async () => {
                await fetch(`${ENV_CONFIG.API_BASE_URL}/Auth/logout`, { method: 'POST', credentials: 'include' });
                window.location.reload();
            });
        } else {
            // User is not logged in
            navActions.innerHTML = `
                <a href="./pages/login.html" class="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">Log In</a>
            `;
        }
    } catch (error) {
        // Network error (assume offline or logged out)
        navActions.innerHTML = `<a href="./pages/login.html" class="bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium">Log In</a>`;
    }
});