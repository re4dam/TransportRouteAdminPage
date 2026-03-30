function showNotification(message, type = 'success') {
    // We must ensure the toast container exists on whatever page calls this
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'fixed top-5 right-5 z-[200] flex flex-col gap-3 pointer-events-none';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800';
    const icon = type === 'success' 
        ? `<svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`
        : `<svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;

    toast.className = `flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transform transition-all duration-300 translate-x-full opacity-0 pointer-events-auto ${bgColor}`;
    toast.innerHTML = `${icon}<p class="text-sm font-semibold">${message}</p>`;

    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.remove('translate-x-full', 'opacity-0'));

    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}