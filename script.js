let currentVersion = null;
const checkInterval = 30000; // 30 seconds
let reloadTimer = null;

// Cache-busting version fetch
async function fetchVersion() {
    const response = await fetch(`/api/version?_=${Date.now()}`);
    if (!response.ok) throw new Error('Failed to fetch version');
    return await response.text();
}

// Force fresh load on every page visit
function ensureFreshLoad() {
    if (performance.navigation.type === 1) { // Type 1 = page reload
        if (!window.location.search.includes('_=')) {
            window.location.search = `_=${Date.now()}`;
        }
    }
}

async function initPage() {
    ensureFreshLoad();
    
    // Set load time
    document.getElementById('load-time').textContent = new Date().toLocaleTimeString();
    
    // Initialize visit count (not cached)
    let count = localStorage.getItem('visitCount') || 0;
    count = parseInt(count) + 1;
    localStorage.setItem('visitCount', count);
    document.getElementById('visit-count').textContent = count;
    
    // Get initial version (with cache busting)
    try {
        currentVersion = await fetchVersion();
        document.getElementById('current-version').textContent = currentVersion;
    } catch (error) {
        console.error('Initial version check failed:', error);
        document.getElementById('current-version').textContent = 'Error';
    }
    
    // Set up periodic checks
    setInterval(checkVersion, checkInterval);
    
    // Set up deployment button
    document.getElementById('deploy-btn').addEventListener('click', simulateDeployment);
}

async function checkVersion() {
    try {
        const newVersion = await fetchVersion();
        
        if (currentVersion && newVersion !== currentVersion) {
            showUpdateNotification();
        }
    } catch (error) {
        console.error('Version check failed:', error);
    }
}

function showUpdateNotification() {
    const notification = document.getElementById('update-notification');
    notification.classList.add('show');
    let secondsLeft = 10;
    
    reloadTimer = setInterval(() => {
        secondsLeft--;
        document.getElementById('countdown').textContent = secondsLeft;
        
        if (secondsLeft <= 0) {
            clearInterval(reloadTimer);
            forceReload();
        }
    }, 1000);
}

function cancelReload() {
    clearInterval(reloadTimer);
    document.getElementById('update-notification').classList.remove('show');
}

function forceReload() {
    document.getElementById('update-notification').classList.remove('show');
    document.getElementById('reload-notification').classList.add('show');
    
    // Force completely fresh reload
    setTimeout(() => {
        window.location.href = window.location.pathname + `?_=${Date.now()}`;
    }, 1000);
}

async function simulateDeployment() {
    try {
        const newVersion = (parseFloat(currentVersion) + 0.1).toFixed(1);
        const response = await fetch(`/update-version?_=${Date.now()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ version: newVersion })
        });
        
        if (!response.ok) throw new Error('Update failed');
        
        console.log('Deployment simulated to version:', newVersion);
        alert(`Version updated to ${newVersion}`);
    } catch (error) {
        console.error('Deployment failed:', error);
        alert('Deployment failed. Check console for details.');
    }
}

document.addEventListener('DOMContentLoaded', initPage);