let currentEditId = null;
let currentDeleteId = null;

document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
});

document.addEventListener("DOMContentLoaded", async () => {
    await fetchAndStoreCsrfToken();
});

function parseStoredRoles() {
    try {
        const parsed = JSON.parse(localStorage.getItem('userRoles') || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function normalizeRole(role) {
    if (role === 'Admin') return 'SuperAdmin';
    if (role === 'RouteAdmin') return 'RouteManager';
    return role;
}

function formatRoleLabel(role) {
    if (role === 'SuperAdmin') return 'Super Admin';
    if (role === 'RouteManager') return 'Route Manager';
    return role;
}

function getRoleBadgeClass(role) {
    if (role === 'SuperAdmin') {
        return 'bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 text-amber-900 border border-amber-300 ring-1 ring-amber-200 shadow-sm';
    }
    if (role === 'RouteManager') {
        return 'bg-blue-100 text-blue-700 border border-blue-200';
    }
    return 'bg-gray-100 text-gray-700 border border-gray-200';
}

async function loadUsers() {
    try {
        const response = await fetch(`${ENV_CONFIG.API_BASE_URL}/users`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            // Authorized! Uncloak the UI
            document.getElementById('dashboardUI').classList.remove('hidden');
            
            // 1. Rename the variable to 'data' to reflect the whole pagination object
            const data = await response.json();

            // Handle either paged payload ({ items: [...] }) or direct array ([...]).
            const users = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
            populateTable(users);
            
        } else {
            window.location.href = '../pages/login.html';
        }
    } catch (error) {
        // 3. PRO TIP: Log the actual error during development so you aren't flying blind!
        console.error("Dashboard crashed:", error);
        
        // Temporarily comment out the redirect while debugging so you can read the console
        // window.location.href = '../pages/login.html'; 
    }
}

function populateTable(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = ''; 

    const rolesArray = parseStoredRoles();

    const canDelete = rolesArray.includes("SuperAdmin"); // Only SuperAdmins can see the delete button

    if (!Array.isArray(users) || users.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="5" class="py-10 px-6 text-center text-sm text-gray-500">
                No users found.
            </td>
        `;
        tbody.appendChild(emptyRow);
        return;
    }

    users.forEach((user, index) => {
        const rowNumber = index + 1; 
        const normalizedRole = normalizeRole(user.role);
        const roleLabel = formatRoleLabel(normalizedRole);

        const roleBadgeClass = getRoleBadgeClass(normalizedRole);

        // Create a visual Status Badge
        const statusBadge = user.isBanned 
            ? `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Suspended</span>`
            : `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>`;

        // Button styling for Ban/Unban: Red for Ban, Green for Unban
        const banButtonText = user.isBanned ? "Unban" : "Ban";
        const banButtonColor = user.isBanned 
            ? "bg-green-600 hover:bg-green-700" 
            : "bg-red-600 hover:bg-red-700";

        // Delete button is only visible to SuperAdmins
        const deleteButtonHTML = canDelete ? `
            <button onclick="openDeleteModal('${user.id}', '${user.username}')" class="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-md transition-colors" title="Delete">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        ` : '';

        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition-colors group";
        
        tr.innerHTML = `
            <td class="py-3 px-6 text-sm text-gray-500 font-medium">${rowNumber}</td>
            <td class="py-3 px-6 text-sm text-gray-800 font-semibold">${user.username}</td>
            <td class="py-3 px-6 text-sm">
                <span class="px-2.5 py-1 rounded-full text-xs font-bold ${roleBadgeClass}">
                    ${roleLabel}
                </span>
            </td>
            <td class="py-3 px-6 text-sm">
                ${statusBadge}
            </td>

            <td class="py-3 px-6 text-right space-x-2">
                <button 
                    onclick="toggleBan(${user.id})" 
                    class="ml-2 px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white ${banButtonColor} transition-colors"
                >
                    ${banButtonText}
                </button>
                <button onclick="openEditModal('${user.id}', '${user.username}', '${normalizedRole}')" class="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-2 rounded-md transition-colors" title="Edit">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                ${deleteButtonHTML}
            </td>
        `;

        tbody.appendChild(tr);
    });
}

async function toggleBan(userId) {
    // Optional: Add a quick confirmation so admins don't misclick
    if (!confirm("Are you sure you want to change this user's ban status?")) return;

    try {
        // 🚨 CRITICAL: Use the 127.0.0.1 URL to ensure the cookie attaches properly
        const response = await fetch(`${ENV_CONFIG.API_BASE_URL}/Users/toggle-ban/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken() // <-- Attach the token here!
            },
            credentials: 'include' // 🚨 This is the VIP Pass we fixed earlier!
        });

        const data = await response.json();

        if (response.ok) {
            // Show the success message from C#
            alert(data.message); 
            
            // Reload the table so the button color updates instantly!
            loadUsers(); // Change this to whatever your fetch users function is called
        } else {
            // If they aren't an admin, or the token expired
            alert("Error: " + data.message);
        }
    } catch (error) {
        console.error("Failed to toggle ban:", error);
        alert("A network error occurred. Check the console.");
    }
}

// Logout function - simply calls the API and then redirects to home page (which will then redirect to login if not authenticated)
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await fetch(`${ENV_CONFIG.API_BASE_URL}/Auth/logout`, { method: 'POST', credentials: 'include' });
        window.location.href = '../index.html'; // Send back to home page after logout
    } catch (error) {
        console.error("Logout failed", error);
    }
});

// --- 2. Edit Modal Logic ---
function openEditModal(id, username, currentRole) {
    currentEditId = id;
    document.getElementById('editUsername').value = username;
    document.getElementById('editRole').value = normalizeRole(currentRole);
    document.getElementById('editModalBackdrop').classList.remove('hidden');
}

function closeEditModal() {
    currentEditId = null;
    document.getElementById('editModalBackdrop').classList.add('hidden');
}

async function submitEdit() {
    if (!currentEditId) return;
    
    const username = document.getElementById('editUsername').value;
    const newRole = document.getElementById('editRole').value;

    try {
        const response = await fetch(`${ENV_CONFIG.API_BASE_URL}/users/${currentEditId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken() // <-- Attach the token here!
            },
            body: JSON.stringify({ username: username, role: newRole }),
            credentials: 'include'
        });

        if (response.ok) {
            closeEditModal();
            loadUsers();
            // Trigger Success Toast
            showNotification(`Role for ${username} successfully updated!`, 'success');
        } else {
            // Trigger Error Toast
            showNotification(`Failed to update user. Server rejected.`, 'error');
        }
    } catch (error) {
        showNotification(`Network error during update.`, 'error');
    }
}

// --- 3. Delete Modal Logic ---
function openDeleteModal(id, username) {
    currentDeleteId = id;
    document.getElementById('deleteTargetName').innerText = username;
    document.getElementById('deleteModalBackdrop').classList.remove('hidden');
}

function closeDeleteModal() {
    currentDeleteId = null;
    document.getElementById('deleteModalBackdrop').classList.add('hidden');
}

async function confirmDelete() {
    if (!currentDeleteId) return;
    
    // Grab the username before we delete it so we can use it in the notification
    const username = document.getElementById('deleteTargetName').innerText;

    try {
        const response = await fetch(`${ENV_CONFIG.API_BASE_URL}/users/${currentDeleteId}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': getCsrfToken() },
            credentials: 'include'
        });

        if (response.ok) {
            closeDeleteModal();
            loadUsers();
            // Trigger Success Toast
            showNotification(`User ${username} was permanently deleted.`, 'success');
        } else {
            // Trigger Error Toast
            showNotification(`Failed to delete user.`, 'error');
        }
    } catch (error) {
        showNotification(`Network error during deletion.`, 'error');
    }
}

// --- 4. Close Modals on Outside Click ---
// If the user clicks on the darkened background (but not the white box itself), close the modals.
window.addEventListener('click', (event) => {
    const editBackdrop = document.getElementById('editModalBackdrop');
    const deleteBackdrop = document.getElementById('deleteModalBackdrop');
    
    if (event.target === editBackdrop) {
        closeEditModal();
    }
    if (event.target === deleteBackdrop) {
        closeDeleteModal();
    }
});

// 1. Reveal the button ONLY if they are a SuperAdmin
const rolesArray = parseStoredRoles();
if (rolesArray.includes('SuperAdmin')) {
    document.getElementById('showCreateBtn').classList.remove('hidden');
}

// 2. Toggle the form visibility
function toggleCreateForm() {
    const form = document.getElementById('createUserForm');
    form.classList.toggle('hidden');
}

// 3. Send the data to C#
async function provisionUser() {
    const username = document.getElementById('newUsername').value;
    const email = document.getElementById('newEmail').value;
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;

    if (!username || !email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        const payload = JSON.stringify({ username, email, password, role });
        const response = await fetch(`${ENV_CONFIG.API_BASE_URL}/users/create-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            },
            credentials: 'include',
            body: payload
        });

        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json')
            ? await response.json()
            : { message: await response.text() };

        if (response.ok) {
            showNotification(data.message || 'User created successfully.', 'success');
            toggleCreateForm(); // Hide the form
            
            // Clear inputs
            document.getElementById('newUsername').value = '';
            document.getElementById('newEmail').value = '';
            document.getElementById('newPassword').value = '';
            
            loadUsers();
        } else {
            showNotification(`Error (${response.status}): ` + (data.message || 'Failed to create user.'), 'error');
        }
    } catch (error) {
        console.error("Provisioning failed:", error);
        showNotification('Network error during user creation.', 'error');
    }
}