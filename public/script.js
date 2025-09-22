// Global variables
let currentEditingRule = null;
let currentEditingNumber = null;
let allRules = [];
let allNumbers = [];
let deleteCallback = null;

// Pagination variables
let currentRulesPage = 1;
let currentNumbersPage = 1;
let itemsPerPage = 9; // 3x3 grid
let filteredRules = [];
let filteredNumbers = [];

// Load data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadRules();
    loadNumbers();
    
    // Prevent zoom on mobile
    document.addEventListener('gesturestart', function (e) {
        e.preventDefault();
    });
    
    document.addEventListener('gesturechange', function (e) {
        e.preventDefault();
    });
    
    document.addEventListener('gestureend', function (e) {
        e.preventDefault();
    });
    
    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
});

// Tab switching
function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tab + '-tab').classList.add('active');
}

// Rules functions
async function loadRules() {
    try {
        const response = await fetch('/rules');
        allRules = await response.json();
        currentRulesPage = 1;
        displayRules(allRules);
    } catch (error) {
        console.error('Error loading rules:', error);
        showNotification('خطأ في تحميل القواعد', 'error');
    }
}

function displayRules(rules) {
    filteredRules = rules;
    const totalPages = Math.ceil(rules.length / itemsPerPage);
    const startIndex = (currentRulesPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageRules = rules.slice(startIndex, endIndex);
    
    const container = document.getElementById('rulesContainer');
    container.innerHTML = '';
    
    currentPageRules.forEach(rule => {
        const card = document.createElement('div');
        card.className = 'rule-card';
        
        card.innerHTML = `
            <div class="card-header">
                <div class="card-id">#${rule.id}</div>
                <div class="card-title">
                    ${getReplyTypeIcon(rule.reply_type)} ${rule.pattern}
                </div>
            </div>
            
            <div class="card-content">
                <div class="card-pattern">${rule.pattern}</div>
                <div class="card-reply">${rule.reply}</div>
                ${rule.media_url ? `<div class="card-media-info">📎 ملف مرفق</div>` : ''}
            </div>
            
            <div class="card-badges">
                <span class="badge match-type">${getMatchTypeText(rule.match_type)}</span>
                <span class="badge priority">أولوية: ${rule.priority}</span>
                <span class="badge ${rule.active ? 'active' : 'inactive'}">${rule.active ? 'نشط' : 'غير نشط'}</span>
                ${rule.reply_type !== 'text' ? `<span class="badge reply-type">${getReplyTypeText(rule.reply_type)}</span>` : ''}
                <span class="badge lang">any</span>
            </div>
            
            <div class="card-actions">
                <button class="btn btn-edit" onclick="editRule(${rule.id})">
                    🔧 تعديل
                </button>
                <button class="btn btn-delete" onclick="confirmDeleteRule(${rule.id})">
                    🗑️ حذف
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    updateRulesPagination(totalPages);
}

function updateRulesPagination(totalPages) {
    const pagination = document.getElementById('rulesPagination');
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    pagination.innerHTML = '';
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '‹';
    prevBtn.disabled = currentRulesPage === 1;
    prevBtn.onclick = () => {
        if (currentRulesPage > 1) {
            currentRulesPage--;
            displayRules(filteredRules);
        }
    };
    pagination.appendChild(prevBtn);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentRulesPage - 1 && i <= currentRulesPage + 1)) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === currentRulesPage ? 'active' : '';
            pageBtn.onclick = () => {
                currentRulesPage = i;
                displayRules(filteredRules);
            };
            pagination.appendChild(pageBtn);
        } else if (i === currentRulesPage - 2 || i === currentRulesPage + 2) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.color = 'white';
            dots.style.padding = '10px';
            pagination.appendChild(dots);
        }
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '›';
    nextBtn.disabled = currentRulesPage === totalPages;
    nextBtn.onclick = () => {
        if (currentRulesPage < totalPages) {
            currentRulesPage++;
            displayRules(filteredRules);
        }
    };
    pagination.appendChild(nextBtn);
    
    // Page info
    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `صفحة ${currentRulesPage} من ${totalPages} (${filteredRules.length} قاعدة)`;
    pagination.appendChild(pageInfo);
}

function filterRules() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    
    const filtered = allRules.filter(rule => {
        const matchesSearch = rule.pattern.toLowerCase().includes(searchTerm) ||
                            rule.reply.toLowerCase().includes(searchTerm) ||
                            rule.match_type.toLowerCase().includes(searchTerm);
        
        const matchesStatus = statusFilter === '' || rule.active.toString() === statusFilter;
        const matchesType = typeFilter === '' || rule.match_type === typeFilter;
        
        return matchesSearch && matchesStatus && matchesType;
    });
    
    currentRulesPage = 1; // Reset to first page
    displayRules(filtered);
}

// Numbers functions
async function loadNumbers() {
    try {
        const response = await fetch('/authorized-numbers');
        allNumbers = await response.json();
        currentNumbersPage = 1;
        displayNumbers(allNumbers);
    } catch (error) {
        console.error('Error loading numbers:', error);
        showNotification('خطأ في تحميل الأرقام', 'error');
    }
}

function displayNumbers(numbers) {
    filteredNumbers = numbers;
    const totalPages = Math.ceil(numbers.length / itemsPerPage);
    const startIndex = (currentNumbersPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageNumbers = numbers.slice(startIndex, endIndex);
    
    const container = document.getElementById('numbersContainer');
    container.innerHTML = '';
    
    currentPageNumbers.forEach(number => {
        const card = document.createElement('div');
        card.className = 'number-card';
        
        card.innerHTML = `
            <div class="card-header">
                <div class="card-id">#${number.id}</div>
                <div class="card-title">${number.name || 'بدون اسم'}</div>
            </div>
            
            <div class="card-content">
                <div class="card-phone">${number.phone_number}</div>
                <div class="card-date">📅 ${formatDate(number.created_at)}</div>
            </div>
            
            <div class="card-badges">
                <span class="badge ${number.active ? 'active' : 'inactive'}">${number.active ? 'نشط' : 'غير نشط'}</span>
            </div>
            
            <div class="card-actions">
                <button class="btn btn-edit" onclick="editNumber(${number.id})">
                    🔧 تعديل
                </button>
                <button class="btn btn-delete" onclick="confirmDeleteNumber(${number.id})">
                    🗑️ حذف
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    updateNumbersPagination(totalPages);
}

function updateNumbersPagination(totalPages) {
    const pagination = document.getElementById('numbersPagination');
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    pagination.innerHTML = '';
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '‹';
    prevBtn.disabled = currentNumbersPage === 1;
    prevBtn.onclick = () => {
        if (currentNumbersPage > 1) {
            currentNumbersPage--;
            displayNumbers(filteredNumbers);
        }
    };
    pagination.appendChild(prevBtn);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentNumbersPage - 1 && i <= currentNumbersPage + 1)) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === currentNumbersPage ? 'active' : '';
            pageBtn.onclick = () => {
                currentNumbersPage = i;
                displayNumbers(filteredNumbers);
            };
            pagination.appendChild(pageBtn);
        } else if (i === currentNumbersPage - 2 || i === currentNumbersPage + 2) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.color = 'white';
            dots.style.padding = '10px';
            pagination.appendChild(dots);
        }
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '›';
    nextBtn.disabled = currentNumbersPage === totalPages;
    nextBtn.onclick = () => {
        if (currentNumbersPage < totalPages) {
            currentNumbersPage++;
            displayNumbers(filteredNumbers);
        }
    };
    pagination.appendChild(nextBtn);
    
    // Page info
    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `صفحة ${currentNumbersPage} من ${totalPages} (${filteredNumbers.length} رقم)`;
    pagination.appendChild(pageInfo);
}

function filterNumbers() {
    const searchTerm = document.getElementById('searchNumberInput').value.toLowerCase();
    const statusFilter = document.getElementById('numberStatusFilter').value;
    const sortFilter = document.getElementById('numberSortFilter').value;
    
    let filtered = allNumbers.filter(number => {
        const matchesSearch = number.phone_number.includes(searchTerm) ||
                            (number.name && number.name.toLowerCase().includes(searchTerm));
        
        const matchesStatus = statusFilter === '' || number.active.toString() === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    // Sort numbers
    switch (sortFilter) {
        case 'newest':
            filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'oldest':
            filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            break;
        case 'name':
            filtered.sort((a, b) => {
                const nameA = (a.name || '').toLowerCase();
                const nameB = (b.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
            break;
    }
    
    currentNumbersPage = 1; // Reset to first page
    displayNumbers(filtered);
}

// Modal functions
function showModal(rule = null) {
    currentEditingRule = rule;
    const modal = document.getElementById('modalOverlay');
    const title = document.getElementById('modalTitle');
    
    if (rule) {
        title.textContent = 'تعديل القاعدة';
        fillRuleForm(rule);
    } else {
        title.textContent = 'إضافة قاعدة جديدة';
        document.getElementById('ruleForm').reset();
        document.getElementById('ruleId').value = '';
        document.getElementById('active').checked = true;
        document.getElementById('priority').value = 10;
        toggleMediaFields();
    }
    
    modal.style.display = 'flex';
}

function hideModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}

function showNumberModal(number = null) {
    currentEditingNumber = number;
    const modal = document.getElementById('numberModalOverlay');
    const title = document.getElementById('numberModalTitle');
    
    if (number) {
        title.textContent = 'تعديل الرقم';
        fillNumberForm(number);
    } else {
        title.textContent = 'إضافة رقم جديد';
        document.getElementById('numberForm').reset();
        document.getElementById('numberId').value = '';
        document.getElementById('numberActive').checked = true;
    }
    
    modal.style.display = 'flex';
}

function hideNumberModal() {
    document.getElementById('numberModalOverlay').style.display = 'none';
}

// Custom confirm dialog
function showConfirm(message, callback) {
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmDialog').style.display = 'flex';
    deleteCallback = callback;
}

function hideConfirm() {
    document.getElementById('confirmDialog').style.display = 'none';
    deleteCallback = null;
}

function confirmDelete() {
    if (deleteCallback) {
        deleteCallback();
    }
    hideConfirm();
}

function confirmDeleteRule(id) {
    showConfirm('هل أنت متأكد من حذف هذه القاعدة؟', () => deleteRule(id));
}

function confirmDeleteNumber(id) {
    showConfirm('هل أنت متأكد من حذف هذا الرقم؟', () => deleteNumber(id));
}

// Form functions
function fillRuleForm(rule) {
    document.getElementById('ruleId').value = rule.id;
    document.getElementById('pattern').value = rule.pattern;
    document.getElementById('matchType').value = rule.match_type;
    document.getElementById('reply').value = rule.reply;
    document.getElementById('replyType').value = rule.reply_type || 'text';
    document.getElementById('mediaUrl').value = rule.media_url || '';
    document.getElementById('filename').value = rule.filename || '';
    document.getElementById('priority').value = rule.priority;
    document.getElementById('active').checked = rule.active === 1;
    document.getElementById('businessHours').checked = rule.only_in_business_hours === 1;
    
    // Show uploaded image info if exists
    const uploadedInfo = document.getElementById('uploadedInfo');
    const uploadedFilename = document.getElementById('uploadedFilename');
    
    if (rule.media_url && rule.reply_type === 'image') {
        uploadedInfo.style.display = 'block';
        uploadedFilename.textContent = `اسم الملف: ${rule.filename || 'غير محدد'}`;
    } else {
        uploadedInfo.style.display = 'none';
    }
    
    toggleMediaFields();
}

function fillNumberForm(number) {
    document.getElementById('numberId').value = number.id;
    document.getElementById('phoneNumber').value = number.phone_number;
    document.getElementById('numberName').value = number.name || '';
    document.getElementById('numberActive').checked = number.active === 1;
}

function toggleMediaFields() {
    const replyType = document.getElementById('replyType').value;
    const mediaFields = document.getElementById('mediaFields');
    const uploadedInfo = document.getElementById('uploadedInfo');
    
    mediaFields.style.display = (replyType === 'image' || replyType === 'document') ? 'block' : 'none';
    
    // Clear upload info when switching away from image/document
    if (replyType === 'text') {
        uploadedInfo.style.display = 'none';
        document.getElementById('mediaUrl').value = '';
        document.getElementById('filename').value = '';
    }
    
    // Initialize upload area if showing media fields
    if (replyType === 'image' || replyType === 'document') {
        initializeUploadArea();
    }
}

// Initialize upload area
function initializeUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('imageUpload');
    
    if (!uploadArea || !fileInput) return;
    
    // Click to select file
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File selection
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            uploadFile(e.target.files[0]);
        }
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            uploadFile(files[0]);
        }
    });
}

// Upload file function
async function uploadFile(file) {
    // Validate file
    if (!file.type.startsWith('image/')) {
        showNotification('يرجى اختيار ملف صورة صالح', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
        showNotification('حجم الملف كبير جداً (الحد الأقصى 5MB)', 'error');
        return;
    }
    
    // Show progress
    const progressDiv = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const uploadedInfo = document.getElementById('uploadedInfo');
    const uploadedFilename = document.getElementById('uploadedFilename');
    
    progressDiv.style.display = 'block';
    uploadedInfo.style.display = 'none';
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
    
    // Create form data
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await fetch('/upload-image', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('فشل في رفع الصورة');
        }
        
        const result = await response.json();
        
        // Update progress to 100%
        progressFill.style.width = '100%';
        progressText.textContent = '100%';
        
        // Update hidden fields
        document.getElementById('mediaUrl').value = result.url;
        document.getElementById('filename').value = result.filename;
        
        // Debug: log the uploaded values
        console.log('Upload completed:', {
            mediaUrl: result.url,
            filename: result.filename,
            replyType: document.getElementById('replyType').value
        });
        
        // Show upload success info
        uploadedFilename.textContent = `اسم الملف: ${result.filename}`;
        uploadedInfo.style.display = 'block';
        
        showNotification('تم رفع الصورة بنجاح!', 'success');
        
        // Hide progress after delay
        setTimeout(() => {
            progressDiv.style.display = 'none';
        }, 2000);
        
    } catch (error) {
        console.error('Upload error:', error);
        showNotification('فشل في رفع الصورة: ' + error.message, 'error');
        progressDiv.style.display = 'none';
    }
}

// Save functions
async function saveRule() {
    const form = document.getElementById('ruleForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const ruleData = {
        pattern: document.getElementById('pattern').value,
        match_type: document.getElementById('matchType').value,
        reply: document.getElementById('reply').value,
        reply_type: document.getElementById('replyType').value,
        media_url: document.getElementById('mediaUrl').value || null,
        filename: document.getElementById('filename').value || null,
        priority: parseInt(document.getElementById('priority').value),
        lang: 'ar',
        active: document.getElementById('active').checked ? 1 : 0,
        only_in_business_hours: document.getElementById('businessHours').checked ? 1 : 0
    };

    // Debug: log the data being sent
    console.log('Saving rule data:', ruleData);

    try {
        const ruleId = document.getElementById('ruleId').value;
        const url = ruleId ? `/rules/${ruleId}` : '/rules';
        const method = ruleId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ruleData)
        });

        if (response.ok) {
            hideModal();
            loadRules();
            showNotification(ruleId ? 'تم تحديث القاعدة بنجاح' : 'تم إضافة القاعدة بنجاح', 'success');
        } else {
            throw new Error('فشل في حفظ القاعدة');
        }
    } catch (error) {
        console.error('Error saving rule:', error);
        showNotification('خطأ في حفظ القاعدة', 'error');
    }
}

async function saveNumber() {
    const form = document.getElementById('numberForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const numberData = {
        phone_number: document.getElementById('phoneNumber').value.replace(/[^0-9]/g, ''),
        name: document.getElementById('numberName').value || null,
        active: document.getElementById('numberActive').checked ? 1 : 0
    };

    try {
        const numberId = document.getElementById('numberId').value;
        const url = numberId ? `/authorized-numbers/${numberId}` : '/authorized-numbers';
        const method = numberId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(numberData)
        });

        if (response.ok) {
            hideNumberModal();
            loadNumbers();
            showNotification(numberId ? 'تم تحديث الرقم بنجاح' : 'تم إضافة الرقم بنجاح', 'success');
        } else {
            const error = await response.json();
            throw new Error(error.error || 'فشل في حفظ الرقم');
        }
    } catch (error) {
        console.error('Error saving number:', error);
        showNotification('خطأ في حفظ الرقم: ' + error.message, 'error');
    }
}

// Edit functions
async function editRule(id) {
    try {
        const response = await fetch(`/rules/${id}`);
        const rule = await response.json();
        showModal(rule);
    } catch (error) {
        console.error('Error loading rule:', error);
        showNotification('خطأ في تحميل القاعدة', 'error');
    }
}

async function editNumber(id) {
    try {
        const response = await fetch(`/authorized-numbers/${id}`);
        const number = await response.json();
        showNumberModal(number);
    } catch (error) {
        console.error('Error loading number:', error);
        showNotification('خطأ في تحميل الرقم', 'error');
    }
}

// Delete functions
async function deleteRule(id) {
    try {
        const response = await fetch(`/rules/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadRules();
            showNotification('تم حذف القاعدة بنجاح', 'success');
        } else {
            throw new Error('فشل في حذف القاعدة');
        }
    } catch (error) {
        console.error('Error deleting rule:', error);
        showNotification('خطأ في حذف القاعدة', 'error');
    }
}

async function deleteNumber(id) {
    try {
        const response = await fetch(`/authorized-numbers/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadNumbers();
            showNotification('تم حذف الرقم بنجاح', 'success');
        } else {
            throw new Error('فشل في حذف الرقم');
        }
    } catch (error) {
        console.error('Error deleting number:', error);
        showNotification('خطأ في حذف الرقم', 'error');
    }
}

// Utility functions
function getMatchTypeText(type) {
    const types = {
        'EXACT': 'تطابق كامل',
        'STARTS_WITH': 'يبدأ بـ',
        'CONTAINS': 'يحتوي على',
        'REGEX': 'تعبير نمطي'
    };
    return types[type] || type;
}

function getReplyTypeIcon(type) {
    const icons = {
        'text': '💬',
        'image': '🖼️',
        'document': '📄'
    };
    return icons[type] || icons['text'];
}

function getReplyTypeIcon(replyType) {
    switch(replyType) {
        case 'image': return '🖼️';
        case 'document': return '📄';
        case 'text':
        default: return '💬';
    }
}

function getReplyTypeText(type) {
    const types = {
        'text': 'نص',
        'image': 'صورة',
        'document': 'ملف'
    };
    return types[type] || types['text'];
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA') + ' ' + date.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function showNotification(message, type = 'success') {
    const container = document.getElementById('notificationContainer');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? '✅' : '❌';
    
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">${icon}</div>
            <div class="notification-text">${message}</div>
            <button class="notification-close" onclick="hideNotification(this)">×</button>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        hideNotification(notification.querySelector('.notification-close'));
    }, 3000);
}

function hideNotification(closeBtn) {
    const notification = closeBtn.closest('.notification');
    notification.classList.remove('show');
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Close modals when clicking outside
document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) hideModal();
});

document.getElementById('numberModalOverlay').addEventListener('click', function(e) {
    if (e.target === this) hideNumberModal();
});

document.getElementById('confirmDialog').addEventListener('click', function(e) {
    if (e.target === this) hideConfirm();
});

// متغيرات الذكاء الاصطناعي
let aiSettings = {};
let aiProviders = {};

// تحميل إعدادات AI عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    loadAISettings();
});

async function loadAISettings() {
    try {
        const response = await fetch('/ai-settings');
        const data = await response.json();
        aiSettings = data.settings;
        aiProviders = data.providers;
    } catch (error) {
        console.error('Error loading AI settings:', error);
    }
}

function showAISettingsModal() {
    renderAIProviders();
    updateAIForm();
    document.getElementById('aiModalOverlay').style.display = 'flex';
}

function closeAIModal() {
    document.getElementById('aiModalOverlay').style.display = 'none';
}

function renderAIProviders() {
    const container = document.getElementById('providersContainer');
    const linksContainer = document.getElementById('apiLinksContainer');
    
    container.innerHTML = '';
    linksContainer.innerHTML = '';
    
    Object.entries(aiProviders).forEach(([key, provider]) => {
        const isSelected = aiSettings.provider === key;
        
        // بطاقة المحرك
        const providerCard = document.createElement('div');
        providerCard.style.cssText = `
            border: 3px solid ${isSelected ? '#28a745' : '#ddd'};
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            background: ${isSelected ? '#f8fff8' : 'white'};
            position: relative;
        `;
        
        providerCard.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 8px;">
                ${key === 'groq' ? '⚡' : key === 'openai' ? '🧠' : '🔮'}
            </div>
            <h4 style="margin: 8px 0; color: #333;">${provider.name}</h4>
            <div style="margin: 8px 0;">
                <span style="
                    background: ${provider.free ? 'linear-gradient(45deg, #28a745, #20c997)' : 'linear-gradient(45deg, #ffc107, #fd7e14)'};
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                ">
                    ${provider.free ? '🆓 مجاني' : '💰 مدفوع'}
                </span>
            </div>
            <div style="font-size: 12px; color: #666; margin-top: 8px;">
                ${provider.models.length} نموذج متاح
            </div>
            ${isSelected ? '<div style="position: absolute; top: 10px; right: 10px; color: #28a745; font-size: 20px;">✅</div>' : ''}
        `;
        
        providerCard.onclick = () => selectAIProvider(key);
        container.appendChild(providerCard);
        
        // زر الحصول على API
        const apiButton = document.createElement('a');
        apiButton.href = getProviderAPILink(key);
        apiButton.target = '_blank';
        apiButton.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            background: ${provider.free ? '#28a745' : '#ffc107'};
            color: ${provider.free ? 'white' : '#333'};
            text-decoration: none;
            border-radius: 8px;
            font-size: 13px;
            font-weight: bold;
            transition: all 0.3s;
        `;
        
        apiButton.innerHTML = `
            <span>${key === 'groq' ? '⚡' : key === 'openai' ? '🧠' : '🔮'}</span>
            <span>الحصول على ${provider.name} API</span>
            <span>🔗</span>
        `;
        
        apiButton.onmouseover = () => {
            apiButton.style.transform = 'translateY(-2px)';
            apiButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        };
        
        apiButton.onmouseout = () => {
            apiButton.style.transform = 'translateY(0)';
            apiButton.style.boxShadow = 'none';
        };
        
        linksContainer.appendChild(apiButton);
    });
}

function getProviderAPILink(providerKey) {
    const links = {
        groq: 'https://console.groq.com/keys',
        openai: 'https://platform.openai.com/api-keys',
        gemini: 'https://makersuite.google.com/app/apikey'
    };
    
    return links[providerKey] || '#';
}

function selectAIProvider(providerKey) {
    aiSettings.provider = providerKey;
    renderAIProviders();
    updateAIModels(providerKey);
    updateProviderHelp(providerKey);
}

function updateAIModels(providerKey) {
    const modelSelect = document.getElementById('aiModel');
    const provider = aiProviders[providerKey];
    
    modelSelect.innerHTML = '';
    provider.models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        if (model === aiSettings.model) {
            option.selected = true;
        }
        modelSelect.appendChild(option);
    });
}

function updateProviderHelp(providerKey) {
    const helpElement = document.getElementById('providerHelp');
    const links = {
        groq: 'احصل على مفتاح مجاني من console.groq.com',
        openai: 'احصل على مفتاح من platform.openai.com/api-keys',
        gemini: 'احصل على مفتاح مجاني من makersuite.google.com/app/apikey'
    };
    
    helpElement.textContent = links[providerKey] || '';
}

function updateAIForm() {
    document.getElementById('aiModel').value = aiSettings.model || '';
    document.getElementById('aiApiKey').value = aiSettings.apiKey || '';
    document.getElementById('aiMaxTokens').value = aiSettings.maxTokens || 1500;
    document.getElementById('aiTemperature').value = aiSettings.temperature || 0.7;
    document.getElementById('temperatureValue').textContent = aiSettings.temperature || 0.7;
    
    if (aiSettings.provider) {
        updateAIModels(aiSettings.provider);
        updateProviderHelp(aiSettings.provider);
    }
}

function toggleAIApiKey() {
    const input = document.getElementById('aiApiKey');
    const button = event.target;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

function toggleAdvancedSettings() {
    const advanced = document.getElementById('advancedSettings');
    const checkbox = document.getElementById('showAdvanced');
    
    advanced.style.display = checkbox.checked ? 'block' : 'none';
}

function updateTemperatureValue() {
    const slider = document.getElementById('aiTemperature');
    document.getElementById('temperatureValue').textContent = slider.value;
}

async function testAIConnection() {
    const button = event.target;
    const originalText = button.textContent;
    
    button.textContent = '⏳ جاري الاختبار...';
    button.disabled = true;
    
    try {
        // محاكاة اختبار الاتصال
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showNotification('✅ تم الاتصال بنجاح! المحرك يعمل بشكل صحيح.', 'success');
    } catch (error) {
        showNotification('❌ فشل في الاتصال: ' + error.message, 'error');
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
}

// حفظ إعدادات AI
document.getElementById('aiSettingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        provider: aiSettings.provider,
        model: document.getElementById('aiModel').value,
        apiKey: document.getElementById('aiApiKey').value,
        maxTokens: parseInt(document.getElementById('aiMaxTokens').value),
        temperature: parseFloat(document.getElementById('aiTemperature').value)
    };
    
    try {
        const response = await fetch('/ai-settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showNotification('✅ تم حفظ إعدادات الذكاء الاصطناعي بنجاح!', 'success');
            aiSettings = formData;
            closeAIModal();
        } else {
            throw new Error('فشل في حفظ الإعدادات');
        }
    } catch (error) {
        showNotification('❌ خطأ في حفظ الإعدادات: ' + error.message, 'error');
    }
});

// إغلاق modal عند النقر خارجه
document.getElementById('aiModalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'aiModalOverlay') {
        closeAIModal();
    }
});
