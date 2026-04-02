// Add this to the top of login.js to fetch the token the moment the page opens
document.addEventListener("DOMContentLoaded", async () => {
    await fetchAndStoreCsrfToken();
});

document.getElementById('loginBtn').addEventListener('click', async () => {
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;
    const statusText = document.getElementById('statusMessage');

    statusText.classList.remove('hidden');
    statusText.innerText = "Verifying credentials...";
    statusText.className = "mt-4 text-center text-sm font-bold text-blue-600";

    try {
        const response = await fetch(`${ENV_CONFIG.API_BASE_URL}/Auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
            body: JSON.stringify({ username: usernameInput, password: passwordInput }),
            credentials: 'include' // Important: ensures cookies (and thus session) are properly handled
        });

        if (response.ok) {
            const data = await response.json();

            if (data.roles && data.roles.includes("Admin")) {
                statusText.innerText = "Admin verified. Redirecting...";
                statusText.className = "mt-4 text-center text-sm font-bold text-green-600";

                setTimeout(() => {
                    window.location.href = "users.html"; // Your admin home page
                }, 1000);
            
            } else {
                // 3. They logged in successfully, but they are just a basic user!
                
                // Optional but recommended: Immediately hit a C# logout endpoint 
                // so they don't have an active basic session trapped on the admin site
                await fetch(`${ENV_CONFIG.API_BASE_URL}/Auth/logout`, { method: 'POST' });

                // Show the error and stop the redirect
                // showToast("Access Denied: You do not have Administrator privileges.", "error");
                statusText.innerText = "Access Denied: You do not have Administrator privileges.";
                statusText.className = "mt-4 text-center text-sm font-bold text-red-600";

            }

        } else if (response.status === 401 || response.status === 403 || response.status === 400) {
            // Captures bad passwords, non-admins (if backend blocks them), or bad payloads
            statusText.innerText = "Credentials not found or unauthorized.";
            statusText.className = "mt-4 text-center text-sm font-bold text-red-600";
            const errorData = await response.text(); 
            console.error("CRITICAL 400 ERROR DETAILS:", errorData);
        } else {
            statusText.innerText = "Server error. Please try again.";
            statusText.className = "mt-4 text-center text-sm font-bold text-red-600";
        }
    } catch (error) {
        statusText.innerText = `Network connection failed.`;
        statusText.className = "mt-4 text-center text-sm font-bold text-red-600";
        console.error(error);
    }
});