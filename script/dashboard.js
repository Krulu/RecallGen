import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { initProfileDropdown } from './profiledropdown.js';

//CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyDiUes0g8qj-pCRD0kDdcPsmSMsrYDbmwU",
    authDomain: "recallgen-4b38d.firebaseapp.com",
    projectId: "recallgen-4b38d",
    storageBucket: "recallgen-4b38d.firebasestorage.app",
    messagingSenderId: "67954844866",
    appId: "1:67954844866:web:5f52423f12fd30644b475b",
    measurementId: "G-TYTK4RHRBH"
};
const SUPABASE_URL = 'https://xdudxyjihjyteukiaate.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkdWR4eWppaGp5dGV1a2lhYXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3OTA4MDksImV4cCI6MjA4NjM2NjgwOX0.szi9C6EK9OZ1TrkYBI1oJZkFkSeDNTdcjnM2MuY8ti4';

//INIT
const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


function getDisplayName(storageFilename) {
    return storageFilename.replace(/^\d+_/, '');
}
function applyThemeColorToBanner(hex) {
    if (!hex) return;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    document.documentElement.style.setProperty('--banner-color-rgb', `${r}, ${g}, ${b}`);

    const banner = document.getElementById('quickstart-banner');
    if (banner) {
        banner.style.background  = `linear-gradient(135deg, rgba(${r},${g},${b},0.12), rgba(${r},${g},${b},0.04))`;
        banner.style.borderColor = `rgba(${r},${g},${b},0.3)`;
    }

    document.querySelectorAll('.qs-step-icon').forEach(el => {
        el.style.background = `rgba(${r},${g},${b},0.12)`;
        el.style.color = hex;
    });

    document.querySelectorAll('.qs-step-num').forEach(el => {
        el.style.background = hex;
    });

    const qsTitle = document.querySelector('.qs-title');
    if (qsTitle) qsTitle.style.color = hex;
}

function getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf')                             return 'fas fa-file-pdf';
    if (['png','jpg','jpeg','gif'].includes(ext))  return 'fas fa-file-image';
    if (['doc','docx'].includes(ext))              return 'fas fa-file-word';
    return 'fas fa-file-alt';
}

function formatDate(isoString) {
    const date      = new Date(isoString);
    const now       = new Date();
    const diffMs    = now - date;
    const diffMins  = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays  = Math.floor(diffMs / 86400000);

    if (diffMins  < 1)  return 'Just now';
    if (diffMins  < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays  < 7)  return `${diffDays}d ago`;
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

async function loadRecentModules(userId) {
    const listEl  = document.getElementById('recent-list');
    const countEl = document.getElementById('recent-count');

    try {
        const { data, error } = await supabase
            .from('user_modules')
            .select('*')
            .eq('user_id', userId)
            .order('uploaded_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        listEl.innerHTML = '';

        if (!data || data.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>No uploads yet.<br>Upload your first module!</p>
                </div>`;
            countEl.textContent = '0 files';
            return;
        }

        countEl.textContent = `${data.length} file${data.length > 1 ? 's' : ''}`;

        data.forEach((module, index) => {
            // ✅ Show clean display name (strip timestamp prefix)
            const displayName = getDisplayName(module.file_name);

            const card = document.createElement('div');
            card.className = 'module-card';
            card.style.animationDelay = `${index * 0.1}s`;

            card.innerHTML = `
                <div class="module-icon">
                    <i class="${getFileIcon(displayName)}"></i>
                </div>
                <div class="module-info">
                    <div class="module-name" title="${displayName}">${displayName}</div>
                    <div class="module-date">${formatDate(module.uploaded_at)}</div>
                </div>
                <button class="module-open-btn" title="Open file">
                    <i class="fas fa-external-link-alt"></i>
                </button>`;

            card.querySelector('.module-open-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                window.open(module.file_url, '_blank');
            });

            card.addEventListener('click', () => {
                window.open(module.file_url, '_blank');
            });

            listEl.appendChild(card);
        });

    } catch (err) {
        console.error('Error loading recent modules:', err);
        listEl.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Could not load recent files.</p>
            </div>`;
    }
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.uid)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                const username = data.username && data.username.trim() !== ''
                    ? data.username
                    : user.email.split('@')[0];

                document.getElementById('display-username').innerText = username;

                if (data.profile_pic && data.profile_pic.startsWith('http')) {
                    document.getElementById('nav-pfp').src = data.profile_pic;
                }
                if (data.theme_bg) {
                    document.body.style.backgroundImage    = `url('${data.theme_bg}')`;
                    document.body.style.backgroundSize     = "cover";
                    document.body.style.backgroundPosition = "center";
                }
                if (data.theme_color) {
                    document.documentElement.style.setProperty('--primary-teal', data.theme_color);
                    applyThemeColorToBanner(data.theme_color);
                }
            } else {
                document.getElementById('display-username').innerText = user.email.split('@')[0];
            }

        } catch (error) {
            console.error("Error loading user data:", error);
            document.getElementById('display-username').innerText = user.email.split('@')[0];
        }

        await loadRecentModules(user.uid);
        await initProfileDropdown(user, supabase);

    } else {
        if (localStorage.getItem('isRegistering') === 'true') {
            localStorage.removeItem('isRegistering');
            return;
        }
        window.location.href = "login.html";
    }
});

const fileInput = document.getElementById('file-input');
if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        const user = auth.currentUser;

        if (file && user) {
            try {
                const timestamp = Date.now();
                const fileName = `${timestamp}_${file.name}`;
                const filePath = `${user.uid}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('modules')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('modules')
                    .getPublicUrl(filePath);
                await supabase.from('user_modules').insert({
                    user_id:     user.uid,
                    file_name:   fileName, 
                    file_url:    publicUrl,
                    uploaded_at: new Date().toISOString()
                });

                Swal.fire({
                    title: 'Upload Complete!',
                    text:  'Your module has been uploaded successfully.',
                    icon:  'success',
                    timer: 1500,
                    showConfirmButton: false
                });

                await loadRecentModules(user.uid);

            } catch (error) {
                console.error("Upload Error:", error);
                Swal.fire('Upload Failed', error.message, 'error');
            }
        }
    });
}

document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => { window.location.href = "login.html"; });
});

const burgerBtn = document.getElementById('burgerBtn');
const sidebar   = document.getElementById('sidebar');
const overlay   = document.getElementById('sidebarOverlay');

burgerBtn.addEventListener('click', () => {
    burgerBtn.classList.toggle('open');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('visible');
});

overlay.addEventListener('click', () => {
    burgerBtn.classList.remove('open');
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
});

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        burgerBtn.classList.remove('open');
        sidebar.classList.remove('open');
        overlay.classList.remove('visible');
    });
});

// QUICKSTART BANNER
const banner  = document.getElementById('quickstart-banner');
const qsClose = document.getElementById('qs-close');

const qsLinks = ['dashboard.html', 'modules.html', 'quiz.html'];

document.querySelectorAll('.qs-step').forEach((step, index) => {
    step.style.cursor = 'pointer';
    step.addEventListener('click', () => {
        window.location.href = qsLinks[index];
    });
});

qsClose.addEventListener('click', (e) => {
    e.stopPropagation();
    banner.classList.add('hidden');
});