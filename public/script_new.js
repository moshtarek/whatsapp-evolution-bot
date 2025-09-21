// Global variables
let currentEditingRule = null;
let currentEditingNumber = null;

// Load data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadRules();
    loadNumbers();
    
    // Tab change event
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(e) {
            if (e.target.id === 'numbers-tab') {
                loadNumbers();
            } else if (e.target.id === 'rules-tab') {
                loadRules();
            }
        });
    });
});

// Rules functions
async function loadRules() {
    try {
        const response = await fetch('/rules');
        const rules = await response.json();
        displayRules(rules);
    } catch (error) {
        console.error('Error loading rules:', error);
        alert('خطأ في تحميل القواعد');
    }
}

function displayRules(rules) {
    const tbody = document.getElementById('rulesTable');
    tbody.innerHTML = '';
    
    rules.forEach(rule => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${rule.id}</td>
            <td><code>${rule.pattern}</code></td>
            <td><span class="badge bg-info">${getMatchTypeText(rule.match_type)}</span></td>
            <td>${truncateText(rule.reply, 50)}</td>
            <td>${getReplyTypeIcon(rule.reply_type)}</td>
            <td><span class="badge bg-secondary">${rule.priority}</span></td>
            <td>${rule.active ? '<span class="badge bg-success">نشط</span>' : '<span class="badge bg-danger">غير نشط</span>'}</td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editRule(${rule.id})" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteRule(${rule.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showRuleModal(rule = null) {
    currentEditingRule = rule;
    const modal = new bootstrap.Modal(document.getElementById('ruleModal'));
    const title = document.getElementById('ruleModalTitle');
    
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
    
    modal.show();
}

function fillRuleForm(rule) {
    document.getElementById('ruleId').value = rule.id;
    document.getElementById('pattern').value = rule.pattern;
    document.getElementById('matchType').value = rule.match_type;
    document.getElementById('reply').value = rule.reply;
    document.getElementById('replyType').value = rule.reply_type || 'text';
    document.getElementById('mediaUrl').value = rule.media_url || '';
    document.getElementById('filename').value = rule.filename || '';
    document.getElementById('priority').value = rule.priority;
    document.getElementById('lang').value = rule.lang;
    document.getElementById('active').checked = rule.active === 1;
    document.getElementById('businessHours').checked = rule.only_in_business_hours === 1;
    toggleMediaFields();
}

function toggleMediaFields() {
    const replyType = document.getElementById('replyType').value;
    const mediaFields = document.getElementById('mediaFields');
    mediaFields.style.display = (replyType === 'image' || replyType === 'document') ? 'block' : 'none';
}

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
        lang: document.getElementById('lang').value,
        active: document.getElementById('active').checked ? 1 : 0,
        only_in_business_hours: document.getElementById('businessHours').checked ? 1 : 0
    };

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
            bootstrap.Modal.getInstance(document.getElementById('ruleModal')).hide();
            loadRules();
            alert(ruleId ? 'تم تحديث القاعدة بنجاح' : 'تم إضافة القاعدة بنجاح');
        } else {
            throw new Error('فشل في حفظ القاعدة');
        }
    } catch (error) {
        console.error('Error saving rule:', error);
        alert('خطأ في حفظ القاعدة');
    }
}

async function editRule(id) {
    try {
        const response = await fetch(`/rules/${id}`);
        const rule = await response.json();
        showRuleModal(rule);
    } catch (error) {
        console.error('Error loading rule:', error);
        alert('خطأ في تحميل القاعدة');
    }
}

async function deleteRule(id) {
    if (!confirm('هل أنت متأكد من حذف هذه القاعدة؟')) return;

    try {
        const response = await fetch(`/rules/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadRules();
            alert('تم حذف القاعدة بنجاح');
        } else {
            throw new Error('فشل في حذف القاعدة');
        }
    } catch (error) {
        console.error('Error deleting rule:', error);
        alert('خطأ في حذف القاعدة');
    }
}

// Numbers functions
async function loadNumbers() {
    try {
        const response = await fetch('/authorized-numbers');
        const numbers = await response.json();
        displayNumbers(numbers);
    } catch (error) {
        console.error('Error loading numbers:', error);
        alert('خطأ في تحميل الأرقام');
    }
}

function displayNumbers(numbers) {
    const tbody = document.getElementById('numbersTable');
    tbody.innerHTML = '';
    
    numbers.forEach(number => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${number.id}</td>
            <td><code>${number.phone_number}</code></td>
            <td>${number.name || '-'}</td>
            <td>${number.active ? '<span class="badge bg-success">نشط</span>' : '<span class="badge bg-danger">غير نشط</span>'}</td>
            <td>${formatDate(number.created_at)}</td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editNumber(${number.id})" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteNumber(${number.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showNumberModal(number = null) {
    currentEditingNumber = number;
    const modal = new bootstrap.Modal(document.getElementById('numberModal'));
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
    
    modal.show();
}

function fillNumberForm(number) {
    document.getElementById('numberId').value = number.id;
    document.getElementById('phoneNumber').value = number.phone_number;
    document.getElementById('numberName').value = number.name || '';
    document.getElementById('numberActive').checked = number.active === 1;
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
            bootstrap.Modal.getInstance(document.getElementById('numberModal')).hide();
            loadNumbers();
            alert(numberId ? 'تم تحديث الرقم بنجاح' : 'تم إضافة الرقم بنجاح');
        } else {
            const error = await response.json();
            throw new Error(error.error || 'فشل في حفظ الرقم');
        }
    } catch (error) {
        console.error('Error saving number:', error);
        alert('خطأ في حفظ الرقم: ' + error.message);
    }
}

async function editNumber(id) {
    try {
        const response = await fetch(`/authorized-numbers/${id}`);
        const number = await response.json();
        showNumberModal(number);
    } catch (error) {
        console.error('Error loading number:', error);
        alert('خطأ في تحميل الرقم');
    }
}

async function deleteNumber(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الرقم؟')) return;

    try {
        const response = await fetch(`/authorized-numbers/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadNumbers();
            alert('تم حذف الرقم بنجاح');
        } else {
            throw new Error('فشل في حذف الرقم');
        }
    } catch (error) {
        console.error('Error deleting number:', error);
        alert('خطأ في حذف الرقم');
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
        'text': '<i class="fas fa-comment text-primary"></i> نص',
        'image': '<i class="fas fa-image text-success"></i> صورة',
        'document': '<i class="fas fa-file text-warning"></i> ملف'
    };
    return icons[type] || icons['text'];
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
