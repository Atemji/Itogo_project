let actionHistory = JSON.parse(localStorage.getItem('action_history') || '[]');

function getZoneStyle(color) {
    return {
        color: color,
        fillColor: color,
        fillOpacity: 0.4,
        weight: 3
    };
}

function logAction(text) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    actionHistory.unshift({ text, time });
    if (actionHistory.length > 50) actionHistory.pop();
    localStorage.setItem('action_history', JSON.stringify(actionHistory));
    renderHistory();
}

function renderHistory() {
    const container = document.getElementById('history-container');
    if (!container) return;
    container.innerHTML = '';
    if (actionHistory.length === 0) {
        container.innerHTML = '<div class="history-item"><span>История действий пуста</span></div>';
        return;
    }
    actionHistory.forEach(item => {
        const el = document.createElement('div');
        el.className = 'history-item';
        el.innerHTML = `<span>${item.text}</span><span class="history-time">${item.time}</span>`;
        container.appendChild(el);
    });
}
renderHistory();

function applyTheme(theme) {
    const body = document.body;
    body.classList.remove('theme-dark');
    if (theme === 'dark') {
        body.classList.add('theme-dark');
    } else if (theme === 'auto') {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            body.classList.add('theme-dark');
        }
    }
    localStorage.setItem('theme_mode', theme);

    document.querySelectorAll('.theme-rect').forEach(rect => {
        rect.classList.toggle('active', rect.getAttribute('data-theme') === theme);
    });
}

const currentTheme = localStorage.getItem('theme_mode') || 'auto';
applyTheme(currentTheme);

document.querySelectorAll('.theme-rect').forEach(rect => {
    rect.addEventListener('click', function() {
        applyTheme(this.getAttribute('data-theme'));
    });
});

var map = L.map('map', { attributionControl: false }).setView([57.1522, 65.5272], 12);
L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let isModerator = false;
let isAuth = false;
let currentUserData = {};
let isRegisterMode = false;
let globalProvidersData = [];

function setAuthMode(register) {
    isRegisterMode = register;
    const authModalTitle = document.getElementById('auth-modal-title');
    const authActionBtn = document.getElementById('auth-action-btn');
    const groupEmail = document.getElementById('group-email');
    const groupPassConfirm = document.getElementById('group-pass-confirm');
    const authSwitchText = document.getElementById('auth-switch-text');
    const authErrorMsg = document.getElementById('auth-error-msg');

    if (authErrorMsg) authErrorMsg.textContent = '';

    if (isRegisterMode) {
        if (authModalTitle) authModalTitle.textContent = "Регистрация";
        if (authActionBtn) authActionBtn.textContent = "Зарегистрироваться";
        if (groupEmail) groupEmail.style.display = 'flex';
        if (groupPassConfirm) groupPassConfirm.style.display = 'flex';
        if (authSwitchText) authSwitchText.innerHTML = "Уже есть аккаунт? <span>Войдите</span>";
    } else {
        if (authModalTitle) authModalTitle.textContent = "Вход в систему";
        if (authActionBtn) authActionBtn.textContent = "Войти";
        if (groupEmail) groupEmail.style.display = 'none';
        if (groupPassConfirm) groupPassConfirm.style.display = 'none';
        if (authSwitchText) authSwitchText.innerHTML = "Впервые на сайте? <span>Зарегистрируйтесь</span>";
    }
}

function initializeAppData() {
    Promise.all([
        fetch('/api/check-auth/').then(res => res.json()),
        fetch('/api/get-providers/').then(res => res.json())
    ]).then(([authData, providers]) => {
        const openLoginBtn = document.getElementById('open-login-btn');
        const userPillBtn = document.getElementById('user-pill-btn');

        if (authData.is_authenticated) {
            isAuth = true;
            isModerator = authData.is_moderator;
            currentUserData = authData;

            if (openLoginBtn) openLoginBtn.style.display = 'none';
            if (userPillBtn) userPillBtn.style.display = 'flex';

            const pillUsername = document.getElementById('pill-username');
            const pillInitials = document.getElementById('pill-initials');
            const pillImg = document.getElementById('pill-img');
            const modalInitials = document.getElementById('modal-initials');
            const modalAvatarImg = document.getElementById('modal-avatar-img');
            const accountUsername = document.getElementById('account-username');
            const profileDisplayName = document.getElementById('profile-display-name');
            const accountEmail = document.getElementById('account-email');
            const accountProvider = document.getElementById('account-provider');

            if (pillUsername) pillUsername.textContent = authData.display_name || authData.username;
            if (pillInitials) pillInitials.textContent = authData.username.charAt(0).toUpperCase();
            if (modalInitials) modalInitials.textContent = authData.username.charAt(0).toUpperCase();

            if (authData.avatar_url) {
                if (pillImg) {
                    pillImg.src = authData.avatar_url;
                    pillImg.style.display = 'block';
                }
                if (pillInitials) pillInitials.style.display = 'none';

                if (modalAvatarImg) {
                    modalAvatarImg.src = authData.avatar_url;
                    modalAvatarImg.style.display = 'block';
                }
                if (modalInitials) modalInitials.style.display = 'none';
            }

            if (accountUsername) accountUsername.value = authData.username;
            if (profileDisplayName) profileDisplayName.value = authData.display_name || authData.username;
            if (accountEmail) accountEmail.value = authData.email || '';
            if (authData.selected_provider && accountProvider) {
                accountProvider.value = authData.selected_provider;
            }
        } else {
            if (openLoginBtn) openLoginBtn.style.display = 'block';
            if (userPillBtn) userPillBtn.style.display = 'none';
        }

        globalProvidersData = providers;
        const container = document.getElementById('operators-container');
        if (container) {
            container.innerHTML = '';
            providers.forEach((op, index) => {
                defaultOperatorTechs[op.code] = "4G";
                const chip = document.createElement('div');
                chip.className = `operator-chip ${index === 0 ? 'active' : ''}`;
                chip.setAttribute('data-operator', op.code);
                chip.textContent = op.name;

                if (index === 0) currentOperator = op.code;
                chip.addEventListener('click', function() {
                    document.querySelectorAll('.operator-chip').forEach(c => c.classList.remove('active'));
                    this.classList.add('active');
                    currentOperator = op.code;
                    updateNetworkUI();
                });
                container.appendChild(chip);
            });
        }
        operatorTechs = JSON.parse(JSON.stringify(defaultOperatorTechs));
        updateNetworkUI();
        loadExistingZones();
        loadExistingMarkers();
    });
}

const userPill = document.getElementById('user-pill-btn');
const profileDropdown = document.getElementById('profile-dropdown');
const settingsModal = document.getElementById('settings-modal');
const authModal = document.getElementById('auth-modal');
const servicesPopupMenu = document.getElementById('services-popup-menu');
const changePasswordModal = document.getElementById('change-password-modal');

if (userPill) {
    userPill.addEventListener('click', (e) => {
        e.stopPropagation();
        if (profileDropdown) profileDropdown.classList.toggle('show');
    });
}

document.addEventListener('click', () => {
    if (profileDropdown) profileDropdown.classList.remove('show');
});

const openLoginBtn = document.getElementById('open-login-btn');
if (openLoginBtn) {
    openLoginBtn.addEventListener('click', () => {
        setAuthMode(false);
        document.body.classList.add('blurred');
        if (authModal) authModal.classList.add('show');
    });
}

const openCpBtn = document.getElementById('open-change-password-modal-btn');
if (openCpBtn) {
    openCpBtn.addEventListener('click', () => {
        document.getElementById('cp-old-password').value = '';
        document.getElementById('cp-new-password').value = '';
        document.getElementById('cp-new-password-confirm').value = '';
        document.getElementById('change-pass-error-msg').textContent = '';
        if (changePasswordModal) changePasswordModal.classList.add('show');
    });
}

const cancelCpBtn = document.getElementById('cancel-change-password-btn');
if (cancelCpBtn) {
    cancelCpBtn.addEventListener('click', () => {
        if (changePasswordModal) changePasswordModal.classList.remove('show');
    });
}

if (changePasswordModal) {
    changePasswordModal.addEventListener('click', (e) => {
        if (e.target === changePasswordModal) {
            changePasswordModal.classList.remove('show');
        }
    });
}

const submitCpBtn = document.getElementById('submit-change-password-btn');
if (submitCpBtn) {
    submitCpBtn.addEventListener('click', () => {
        const payload = {
            old_password: document.getElementById('cp-old-password').value,
            new_password: document.getElementById('cp-new-password').value,
            new_password_confirm: document.getElementById('cp-new-password-confirm').value
        };

        fetch('/api/change-password/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                logAction('Пароль изменен');
                alert(data.message);
                if (changePasswordModal) changePasswordModal.classList.remove('show');
            } else {
                document.getElementById('change-pass-error-msg').textContent = data.message || 'Ошибка смены пароля';
            }
        })
        .catch(() => {
            document.getElementById('change-pass-error-msg').textContent = 'Произошла ошибка сети';
        });
    });
}

function openSettingsModal(tabId) {
    document.body.classList.add('blurred');
    if (settingsModal) settingsModal.classList.add('show');
    document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.settings-pane').forEach(p => p.classList.remove('active'));
    const tabEl = document.querySelector(`[data-tab="${tabId}"]`);
    const paneEl = document.getElementById(tabId);
    if (tabEl) tabEl.classList.add('active');
    if (paneEl) paneEl.classList.add('active');
}

const dropSettings = document.getElementById('drop-settings');
if (dropSettings) {
    dropSettings.addEventListener('click', () => openSettingsModal('tab-account'));
}

const dropLogout = document.getElementById('drop-logout');
if (dropLogout) {
    dropLogout.addEventListener('click', () => {
        fetch('/api/logout/', { method: 'POST' }).then(() => location.reload());
    });
}

document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.settings-pane').forEach(p => p.classList.remove('active'));
        this.classList.add('active');
        const targetPane = document.getElementById(this.getAttribute('data-tab'));
        if (targetPane) targetPane.classList.add('active');
    });
});

if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('show');
            document.body.classList.remove('blurred');
        }
    });
}

if (authModal) {
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.classList.remove('show');
            document.body.classList.remove('blurred');
        }
    });
}

const authSwitchText = document.getElementById('auth-switch-text');
if (authSwitchText) {
    authSwitchText.addEventListener('click', () => {
        setAuthMode(!isRegisterMode);
    });
}

const authActionBtn = document.getElementById('auth-action-btn');
if (authActionBtn) {
    authActionBtn.addEventListener('click', () => {
        const usernameInp = document.getElementById('inp-username');
        const passwordInp = document.getElementById('inp-password');
        const payload = {
            username: usernameInp ? usernameInp.value : '',
            password: passwordInp ? passwordInp.value : ''
        };
        let url = '/api/login/';
        if (isRegisterMode) {
            url = '/api/register/';
            const emailInp = document.getElementById('inp-email');
            const passConfirmInp = document.getElementById('inp-password-confirm');
            payload.email = emailInp ? emailInp.value : '';
            payload.password_confirm = passConfirmInp ? passConfirmInp.value : '';
        }

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                location.reload();
            } else {
                const authErrorMsg = document.getElementById('auth-error-msg');
                if (authErrorMsg) authErrorMsg.textContent = data.message || "Ошибка";
            }
        });
    });
}

const saveAccountBtn = document.getElementById('save-account-btn');
if (saveAccountBtn) {
    saveAccountBtn.addEventListener('click', () => {
        const settingsErrorMsg = document.getElementById('settings-error-msg');
        if (settingsErrorMsg) settingsErrorMsg.textContent = '';

        const accUser = document.getElementById('account-username');
        const profName = document.getElementById('profile-display-name');
        const accEmail = document.getElementById('account-email');
        const accProvider = document.getElementById('account-provider');
        const avatarFileInput = document.getElementById('avatar-file-input');

        const formData = new FormData();
        formData.append('username', accUser ? accUser.value : '');
        formData.append('display_name', profName ? profName.value : '');
        formData.append('email', accEmail ? accEmail.value : '');
        formData.append('selected_provider', accProvider ? accProvider.value : '');

        if (avatarFileInput && avatarFileInput.files[0]) {
            formData.append('avatar', avatarFileInput.files[0]);
        }

        fetch('/api/update-profile/', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                logAction('Профиль обновлен');

                currentUserData.username = data.username;
                currentUserData.display_name = data.display_name;
                currentUserData.email = data.email;
                currentUserData.selected_provider = data.selected_provider;

                const pillUsername = document.getElementById('pill-username');
                const pillInitials = document.getElementById('pill-initials');
                const modalInitials = document.getElementById('modal-initials');

                const displayNameText = data.display_name || data.username;
                if (pillUsername) pillUsername.textContent = displayNameText;
                if (pillInitials) pillInitials.textContent = data.username.charAt(0).toUpperCase();
                if (modalInitials) modalInitials.textContent = data.username.charAt(0).toUpperCase();

                if (data.avatar_url) {
                    const pillImg = document.getElementById('pill-img');
                    const modalAvatarImg = document.getElementById('modal-avatar-img');
                    if (pillImg) {
                        pillImg.src = data.avatar_url;
                        pillImg.style.display = 'block';
                    }
                    if (pillInitials) pillInitials.style.display = 'none';

                    if (modalAvatarImg) {
                        modalAvatarImg.src = data.avatar_url;
                        modalAvatarImg.style.display = 'block';
                    }
                    if (modalInitials) modalInitials.style.display = 'none';
                }

                if (settingsModal) settingsModal.classList.remove('show');
                document.body.classList.remove('blurred');
            } else {
                if (settingsErrorMsg) settingsErrorMsg.textContent = data.message || "Ошибка сохранения";
            }
        })
        .catch(() => {
            if (settingsErrorMsg) settingsErrorMsg.textContent = 'Произошла ошибка сети';
        });
    });
}

const modalAvatarBox = document.getElementById('modal-avatar-box');
const avatarFileInput = document.getElementById('avatar-file-input');
if (modalAvatarBox && avatarFileInput) {
    modalAvatarBox.addEventListener('click', () => avatarFileInput.click());
    avatarFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const modalAvatarImg = document.getElementById('modal-avatar-img');
                const modalInitials = document.getElementById('modal-initials');
                const pillImg = document.getElementById('pill-img');
                const pillInitials = document.getElementById('pill-initials');

                if (modalAvatarImg) {
                    modalAvatarImg.src = evt.target.result;
                    modalAvatarImg.style.display = 'block';
                }
                if (modalInitials) modalInitials.style.display = 'none';

                if (pillImg) {
                    pillImg.src = evt.target.result;
                    pillImg.style.display = 'block';
                }
                if (pillInitials) pillInitials.style.display = 'none';

                logAction('Выбрано новое фото профиля');
            }
            reader.readAsDataURL(file);
        }
    });
}

let currentOperator = null;
let operatorTechs = {};
let defaultOperatorTechs = {};

function loadExistingZones() {
    fetch('/api/get-zones/')
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                var layer = L.geoJSON(item.geom, {
                    style: getZoneStyle(item.color)
                }).getLayers()[0];

                layer.zoneId = item.id;
                layer.coverageData = { color: item.color, operators: item.operators, comment: item.comment };

                layer.on('click', (e) => {
                    const color = layer.coverageData ? layer.coverageData.color : item.color;
                    if (color === '#f59e0b') {
                        L.DomEvent.stopPropagation(e);
                        openServicesPopupMenu(e.containerPoint, layer);
                    }
                });

                bindLayerContext(layer);
                layer.addTo(map);
            });
        });
}

function openServicesPopupMenu(containerPoint, layer) {
    if (!isAuth) {
        alert('Пожалуйста, войдите в систему и выберите оператора в настройках.');
        return;
    }

    const accountProviderEl = document.getElementById('account-provider');
    const userProviderCode = accountProviderEl ? accountProviderEl.value : '';
    const subtitleEl = document.getElementById('services-provider-subtitle');
    const container = document.getElementById('services-categories-container');
    if (container) container.innerHTML = '';

    const coverage = (layer && layer.coverageData) ? layer.coverageData : {};
    const operatorsData = coverage.operators || {};
    const commentText = coverage.comment || '';
    const currentTech = userProviderCode ? (operatorsData[userProviderCode] || '4G') : null;

    if (!userProviderCode) {
        if (subtitleEl) subtitleEl.textContent = "Оператор не выбран!";
        if (container) container.innerHTML = `<div class="popup-info-message">Выберите оператора в настройках профиля.</div>`;
    } else {
        const providerObj = globalProvidersData.find(p => p.code === userProviderCode);
        if (providerObj) {
            if (subtitleEl) {
                subtitleEl.innerHTML = `Оператор: <b>${providerObj.name}</b> <span style="opacity:0.6;">(${currentTech})</span>`;
            }

            if (!providerObj.services || providerObj.services.length === 0) {
                if (container) {
                    container.innerHTML = `<div class="popup-info-message">Нет доступных сервисов.</div>`;
                }
            } else {
                let grouped = {};
                providerObj.services.forEach(s => {
                    if (!grouped[s.category]) {
                        grouped[s.category] = { name: s.category_name, items: [] };
                    }
                    grouped[s.category].items.push(s);
                });

                for (let catKey in grouped) {
                    let cat = grouped[catKey];
                    let catBlock = document.createElement('div');
                    catBlock.className = 'service-category-block';

                    let catTitle = document.createElement('div');
                    catTitle.className = 'service-category-title';
                    catTitle.textContent = cat.name;
                    catBlock.appendChild(catTitle);

                    let grid = document.createElement('div');
                    grid.className = 'service-grid';

                    cat.items.forEach(srv => {
                        let card = document.createElement('div');
                        card.className = 'service-card';

                        let iconHtml = srv.icon_url
                            ? `<img src="${srv.icon_url}" class="service-card-icon" alt="">`
                            : `<span style="font-size: 16px;"></span>`;

                        card.innerHTML = `
                            ${iconHtml}
                            <div class="service-card-name" title="${srv.name}">${srv.name}</div>
                        `;
                        grid.appendChild(card);
                    });

                    catBlock.appendChild(grid);
                    if (container) container.appendChild(catBlock);
                }
            }

            if (commentText.trim() && container) {
                let commentBlock = document.createElement('div');
                commentBlock.className = 'moderator-comment-block';
                commentBlock.innerHTML = `<b>Комментарий модератора:</b><br>${commentText}`;
                container.appendChild(commentBlock);
            }

        } else {
            if (subtitleEl) subtitleEl.textContent = "Оператор не найден";
        }
    }

    closeMenu();
    if (servicesPopupMenu) {
        servicesPopupMenu.style.left = containerPoint.x + 'px';
        servicesPopupMenu.style.top = containerPoint.y + 'px';
        servicesPopupMenu.classList.add('show');
    }
}

let markersMap = {};
let pendingMarkerLatLng = null;
let isMarkerCreationActive = false;

function loadExistingMarkers() {
    fetch('/api/get-markers/')
        .then(res => res.json())
        .then(data => {
            data.forEach(item => {
                renderMarker(item);
            });
        });
}

function renderMarker(item) {
    const iconEmoji = '💬';

    const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="custom-map-marker">${iconEmoji}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
    });

    var marker = L.marker([item.lat, item.lng], { icon: customIcon }).addTo(map);
    marker.markerId = item.id;
    markersMap[item.id] = marker;

    const initials = item.author_name ? item.author_name.charAt(0).toUpperCase() : 'U';

    let avatarContent = `<span>${initials}</span>`;
    if (item.avatar_url) {
        avatarContent = `<img src="${item.avatar_url}" alt="Avatar" class="marker-popup-avatar-img">`;
    }

    let deleteBtnHtml = '';
    if (isModerator || (currentUserData.username && currentUserData.username === item.username)) {
        deleteBtnHtml = `<button class="btn-main marker-delete-btn" onclick="deleteMarker(${item.id})">Удалить заметку</button>`;
    }

    const popupContent = `
        <div class="marker-popup-container">
            <div class="marker-popup-header">
                <div class="marker-popup-avatar-box">${avatarContent}</div>
                <span class="marker-popup-author">${item.author_name}</span>
            </div>
            <div class="marker-popup-comment">${item.comment || 'Без комментария'}</div>
            <div class="marker-popup-date">${item.created_at}</div>
            ${deleteBtnHtml}
        </div>
    `;
    marker.bindPopup(popupContent);
}

window.deleteMarker = function(id) {
    if (!confirm('Удалить эту заметку?')) return;
    fetch('/api/delete-marker/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            if (markersMap[id]) {
                map.removeLayer(markersMap[id]);
                delete markersMap[id];
            }
            logAction('Заметка удалена');
        } else {
            alert(data.message || 'Ошибка удаления');
        }
    });
};

var customMenu = document.getElementById('custom-menu');
var layerMenu = document.getElementById('layer-menu');
var markerCreateMenu = document.getElementById('marker-create-menu');
var activeLayer = null;
var selectedColor = "#10b981";

map.getContainer().addEventListener('contextmenu', (e) => e.preventDefault());
if (customMenu) customMenu.addEventListener('click', (e) => e.stopPropagation());
if (layerMenu) layerMenu.addEventListener('click', (e) => e.stopPropagation());
if (markerCreateMenu) markerCreateMenu.addEventListener('click', (e) => e.stopPropagation());
if (servicesPopupMenu) servicesPopupMenu.addEventListener('click', (e) => e.stopPropagation());

function closeMenu() {
    if (customMenu) customMenu.classList.remove('show');
    if (layerMenu) layerMenu.classList.remove('show');
    if (markerCreateMenu) markerCreateMenu.classList.remove('show');
    if (servicesPopupMenu) servicesPopupMenu.classList.remove('show');
    isMarkerCreationActive = false;
    map.getContainer().style.cursor = '';
}

function resetGeomanTools() {
    if (map.pm) {
        map.pm.disableDraw();
        map.pm.disableGlobalEditMode();
        map.pm.disableGlobalDragMode();
        map.pm.disableGlobalRotateMode();
        map.pm.disableGlobalRemovalMode();
    }
}

map.on('contextmenu', (e) => {
    closeMenu();
    resetGeomanTools();
    if (!isAuth) return;

    if (isModerator) {
        if (customMenu) {
            customMenu.style.left = e.containerPoint.x + 'px';
            customMenu.style.top = e.containerPoint.y + 'px';
            customMenu.classList.add('show');
        }
    } else {
        pendingMarkerLatLng = e.latlng;
        const markerComment = document.getElementById('marker-comment');
        if (markerComment) markerComment.value = '';
        if (markerCreateMenu) {
            markerCreateMenu.style.left = e.containerPoint.x + 'px';
            markerCreateMenu.style.top = e.containerPoint.y + 'px';
            markerCreateMenu.classList.add('show');
        }
    }
});

map.on('click', (e) => {
    if (isMarkerCreationActive) {
        pendingMarkerLatLng = e.latlng;
        const markerComment = document.getElementById('marker-comment');
        if (markerComment) markerComment.value = '';
        if (markerCreateMenu) {
            markerCreateMenu.style.left = e.containerPoint.x + 'px';
            markerCreateMenu.style.top = e.containerPoint.y + 'px';
            markerCreateMenu.classList.add('show');
        }
        isMarkerCreationActive = false;
        map.getContainer().style.cursor = '';
        return;
    }
    closeMenu();
});
map.on('movestart', closeMenu);

const btnMarker = document.getElementById('btn-marker');
if (btnMarker) {
    btnMarker.addEventListener('click', () => {
        closeMenu();
        resetGeomanTools();
        if (!isAuth) {
            alert('Необходимо авторизоваться.');
            return;
        }
        isMarkerCreationActive = true;
        map.getContainer().style.cursor = 'crosshair';
    });
}

const btnPolygon = document.getElementById('btn-polygon');
const btnEdit = document.getElementById('btn-edit');
const btnDrag = document.getElementById('btn-drag');
const btnRotate = document.getElementById('btn-rotate');
const btnDelete = document.getElementById('btn-delete');

if (btnPolygon) btnPolygon.addEventListener('click', () => { closeMenu(); resetGeomanTools(); if(isModerator) map.pm.enableDraw('Polygon'); });
if (btnEdit) btnEdit.addEventListener('click', () => { closeMenu(); resetGeomanTools(); if(isModerator) map.pm.toggleGlobalEditMode(); });
if (btnDrag) btnDrag.addEventListener('click', () => { closeMenu(); resetGeomanTools(); if(isModerator) map.pm.toggleGlobalDragMode(); });
if (btnRotate) btnRotate.addEventListener('click', () => { closeMenu(); resetGeomanTools(); if(isModerator) map.pm.toggleGlobalRotateMode(); });
if (btnDelete) btnDelete.addEventListener('click', () => { closeMenu(); resetGeomanTools(); if(isModerator) map.pm.toggleGlobalRemovalMode(); });

var colorOptions = document.querySelectorAll('.color-option');
colorOptions.forEach((option) => {
    option.addEventListener('click', function() {
        colorOptions.forEach((o) => o.classList.remove('selected'));
        this.classList.add('selected');
        selectedColor = this.getAttribute('data-color');
    });
});

const btnSaveMarker = document.getElementById('btn-save-marker');
if (btnSaveMarker) {
    btnSaveMarker.addEventListener('click', () => {
        if (!pendingMarkerLatLng) return;
        const markerComment = document.getElementById('marker-comment');
        const commentText = markerComment ? markerComment.value : '';

        const payload = {
            lat: pendingMarkerLatLng.lat,
            lng: pendingMarkerLatLng.lng,
            comment: commentText,
            icon_type: 'chat'
        };

        fetch('/api/save-marker/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                renderMarker(data);
                logAction('Создана новая заметка');
            } else {
                alert(data.message || 'Ошибка сохранения заметки');
            }
        });
        closeMenu();
    });
}

var networkBtns = document.querySelectorAll('.network-btn');
function updateNetworkUI() {
    if (!currentOperator) return;
    const netSubtitle = document.getElementById('network-subtitle');
    if (netSubtitle) netSubtitle.textContent = "Тип сети (" + currentOperator + ")";
    var activeTech = operatorTechs[currentOperator] || "4G";
    networkBtns.forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-tech') === activeTech);
    });
}

networkBtns.forEach((btn) => {
    btn.addEventListener('click', function() {
        operatorTechs[currentOperator] = this.getAttribute('data-tech');
        updateNetworkUI();
    });
});

const btnDefaultNet = document.getElementById('btn-default-net');
if (btnDefaultNet) {
    btnDefaultNet.addEventListener('click', () => {
        for (var op in operatorTechs) { operatorTechs[op] = "4G"; }
        updateNetworkUI();
    });
}

const btnSaveLayer = document.getElementById('btn-save-layer');
if (btnSaveLayer) {
    btnSaveLayer.addEventListener('click', () => {
        if (!isModerator) return;
        if (activeLayer) {
            const layerComment = document.getElementById('layer-comment');
            var commentText = layerComment ? layerComment.value : '';

            activeLayer.setStyle(getZoneStyle(selectedColor));
            activeLayer.coverageData = { color: selectedColor, operators: JSON.parse(JSON.stringify(operatorTechs)), comment: commentText };

            activeLayer.off('click');
            activeLayer.on('click', (ev) => {
                if (activeLayer.coverageData && activeLayer.coverageData.color === '#f59e0b') {
                    L.DomEvent.stopPropagation(ev);
                    openServicesPopupMenu(ev.containerPoint, activeLayer);
                }
            });

            var payload = {
                id: activeLayer.zoneId || null,
                geom: activeLayer.toGeoJSON(),
                color: selectedColor,
                operators: activeLayer.coverageData.operators,
                comment: commentText
            };

            fetch('/api/save-zone/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success' && data.id) {
                    activeLayer.zoneId = data.id;
                    logAction(`Зона #${data.id} сохранена`);
                }
            });
        }
        closeMenu();
    });
}

function bindLayerContext(layer) {
    layer.on('contextmenu', (e) => {
        if (!isModerator) return;
        L.DomEvent.stopPropagation(e);
        closeMenu();
        resetGeomanTools();
        activeLayer = layer;

        const layerComment = document.getElementById('layer-comment');
        if (layer.coverageData) {
            selectedColor = layer.coverageData.color || "#10b981";
            operatorTechs = JSON.parse(JSON.stringify(layer.coverageData.operators || defaultOperatorTechs));
            if (layerComment) layerComment.value = layer.coverageData.comment || "";
        } else {
            operatorTechs = JSON.parse(JSON.stringify(defaultOperatorTechs));
            if (layerComment) layerComment.value = "";
        }

        colorOptions.forEach((o) => o.classList.toggle('selected', o.getAttribute('data-color') === selectedColor));
        var firstChip = document.querySelector('.operator-chip');
        if (firstChip) {
            currentOperator = firstChip.getAttribute('data-operator');
            document.querySelectorAll('.operator-chip').forEach(c => c.classList.remove('active'));
            firstChip.classList.add('active');
        }
        updateNetworkUI();

        var pt = map.latLngToContainerPoint(e.latlng);
        if (layerMenu) {
            layerMenu.style.left = pt.x + 'px';
            layerMenu.style.top = pt.y + 'px';
            layerMenu.classList.add('show');
        }
    });
}

map.on('pm:create', (e) => {
    if (!isModerator) return;
    var layer = e.layer;

    layer.coverageData = {
        color: selectedColor,
        operators: JSON.parse(JSON.stringify(operatorTechs)),
        comment: ""
    };

    layer.on('click', (ev) => {
        if (layer.coverageData && layer.coverageData.color === '#f59e0b') {
            L.DomEvent.stopPropagation(ev);
            openServicesPopupMenu(ev.containerPoint, layer);
        }
    });

    bindLayerContext(layer);
});

map.on('pm:remove', (e) => {
    if (!isModerator) return;
    var removedLayer = e.layer;
    if (removedLayer.zoneId) {
        fetch('/api/delete-zone/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: removedLayer.zoneId })
        }).then(() => logAction(`Удалена зона #${removedLayer.zoneId}`));
    }
});

initializeAppData();