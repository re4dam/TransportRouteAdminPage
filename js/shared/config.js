const API_BASE = "http://localhost:5285/api";

async function fetchAndStoreCsrfToken() {
    try {
        const response = await fetch(`${API_BASE}/Auth/csrf-token`, {
            method: 'GET',
            credentials: 'include' // Important: ensures the token pairs with the current user session
        });
        
        if (response.ok) {
            const data = await response.json();
            // Store it in sessionStorage so it survives page reloads but clears when the tab closes
            sessionStorage.setItem('csrf_token', data.token);
        }
    } catch (error) {
        console.error("Failed to fetch CSRF token", error);
    }
}

// A helper function to easily grab the token whenever we need it
function getCsrfToken() {
    return sessionStorage.getItem('csrf_token');
}