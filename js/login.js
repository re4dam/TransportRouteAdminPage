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
        const response = await fetch(`${API_BASE}/Auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
            body: JSON.stringify({ username: usernameInput, password: passwordInput }),
            credentials: 'include'
        });

        if (response.ok) {
            // OPTIONAL: If your C# API returns the user role in the JSON, you can strictly check it here.
            // const data = await response.json();
            // if (data.role !== 'Admin') { ... throw error ... }
            
            statusText.innerText = "Admin verified. Redirecting...";
            statusText.className = "mt-4 text-center text-sm font-bold text-green-600";
            window.location.href = 'users.html';
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