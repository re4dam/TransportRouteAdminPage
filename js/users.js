let currentEditId = null;
let currentDeleteId = null;

document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
});

document.addEventListener("DOMContentLoaded", async () => {
    await fetchAndStoreCsrfToken();
});

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
            
            // 2. Pass ONLY the array of users into the table generator
            // Note: ASP.NET JSON serialization usually makes properties camelCase ('items')
            populateTable(data.items); 
            
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

    users.forEach((user, index) => {
        const rowNumber = index + 1; 

        // Dynamic badge styling: Purple for Admin, Gray for standard User
        const roleBadgeClass = user.role === 'Admin' 
            ? 'bg-purple-100 text-purple-700 border border-purple-200' 
            : 'bg-gray-100 text-gray-700 border border-gray-200';

        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition-colors group";
        
        tr.innerHTML = `
            <td class="py-3 px-6 text-sm text-gray-500 font-medium">${rowNumber}</td>
            <td class="py-3 px-6 text-sm text-gray-800 font-semibold">${user.username}</td>
            <td class="py-3 px-6 text-sm">
                <span class="px-2.5 py-1 rounded-full text-xs font-bold ${roleBadgeClass}">
                    ${user.role}
                </span>
            </td>

            <td class="py-3 px-6 text-right space-x-2">
                <button onclick="openEditModal('${user.id}', '${user.username}', '${user.role}')" class="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-2 rounded-md transition-colors" title="Edit">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onclick="openDeleteModal('${user.id}', '${user.username}')" class="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-md transition-colors" title="Delete">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

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
    document.getElementById('editRole').value = currentRole;
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
            headers: { 'Content-Type': 'application/json',
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