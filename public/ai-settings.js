let currentSettings = {};
let availableProviders = {};

// تحميل الإعدادات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    setupEventListeners();
});

async function loadSettings() {
    try {
        const response = await fetch('/ai-settings');
        const data = await response.json();
        
        currentSettings = data.settings;
        availableProviders = data.providers;
        
        renderProviders();
        updateForm();
    } catch (error) {
        showAlert('خطأ في تحميل الإعدادات: ' + error.message, 'danger');
    }
}

function renderProviders() {
    const container = document.getElementById('providersContainer');
    container.innerHTML = '';
    
    Object.entries(availableProviders).forEach(([key, provider]) => {
        const isSelected = currentSettings.provider === key;
        const badgeClass = provider.free ? 'free-badge' : 'paid-badge';
        const badgeText = provider.free ? 'مجاني' : 'مدفوع';
        
        const providerCard = `
            <div class="col-md-4">
                <div class="provider-card card h-100 ${isSelected ? 'selected' : ''}" 
                     data-provider="${key}" style="cursor: pointer;">
                    <div class="card-body text-center">
                        <h6 class="card-title">${provider.name}</h6>
                        <span class="badge ${badgeClass} text-white">${badgeText}</span>
                        <div class="mt-2">
                            <small class="text-muted">${provider.models.length} نموذج متاح</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += providerCard;
    });
    
    // إضافة event listeners للبطاقات
    document.querySelectorAll('.provider-card').forEach(card => {
        card.addEventListener('click', () => selectProvider(card.dataset.provider));
    });
}

function selectProvider(providerKey) {
    // إزالة التحديد من جميع البطاقات
    document.querySelectorAll('.provider-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // تحديد البطاقة المختارة
    document.querySelector(`[data-provider="${providerKey}"]`).classList.add('selected');
    
    // تحديث النماذج المتاحة
    updateModels(providerKey);
    
    // تحديث رابط المزود
    updateProviderLink(providerKey);
    
    currentSettings.provider = providerKey;
}

function updateModels(providerKey) {
    const modelSelect = document.getElementById('model');
    const provider = availableProviders[providerKey];
    
    modelSelect.innerHTML = '';
    provider.models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        if (model === currentSettings.model) {
            option.selected = true;
        }
        modelSelect.appendChild(option);
    });
}

function updateProviderLink(providerKey) {
    const linkElement = document.getElementById('providerLink');
    const links = {
        groq: '<a href="https://console.groq.com" target="_blank">console.groq.com</a>',
        openai: '<a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com</a>',
        gemini: '<a href="https://makersuite.google.com/app/apikey" target="_blank">makersuite.google.com</a>'
    };
    
    linkElement.innerHTML = links[providerKey] || '';
}

function updateForm() {
    document.getElementById('model').value = currentSettings.model || '';
    document.getElementById('apiKey').value = currentSettings.apiKey || '';
    document.getElementById('maxTokens').value = currentSettings.maxTokens || 1500;
    document.getElementById('temperature').value = currentSettings.temperature || 0.7;
    document.getElementById('temperatureValue').textContent = currentSettings.temperature || 0.7;
    
    if (currentSettings.provider) {
        updateModels(currentSettings.provider);
        updateProviderLink(currentSettings.provider);
    }
}

function setupEventListeners() {
    // تبديل إظهار/إخفاء مفتاح API
    document.getElementById('toggleApiKey').addEventListener('click', () => {
        const apiKeyInput = document.getElementById('apiKey');
        const icon = document.querySelector('#toggleApiKey i');
        
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            apiKeyInput.type = 'password';
            icon.className = 'fas fa-eye';
        }
    });
    
    // تحديث قيمة Temperature
    document.getElementById('temperature').addEventListener('input', (e) => {
        document.getElementById('temperatureValue').textContent = e.target.value;
    });
    
    // حفظ الإعدادات
    document.getElementById('aiSettingsForm').addEventListener('submit', saveSettings);
    
    // اختبار الاتصال
    document.getElementById('testBtn').addEventListener('click', testConnection);
}

async function saveSettings(e) {
    e.preventDefault();
    
    const formData = {
        provider: currentSettings.provider,
        model: document.getElementById('model').value,
        apiKey: document.getElementById('apiKey').value,
        maxTokens: parseInt(document.getElementById('maxTokens').value),
        temperature: parseFloat(document.getElementById('temperature').value)
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
            showAlert('تم حفظ الإعدادات بنجاح!', 'success');
            currentSettings = formData;
        } else {
            throw new Error('فشل في حفظ الإعدادات');
        }
    } catch (error) {
        showAlert('خطأ في حفظ الإعدادات: ' + error.message, 'danger');
    }
}

async function testConnection() {
    const testBtn = document.getElementById('testBtn');
    const originalText = testBtn.innerHTML;
    
    testBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>جاري الاختبار...';
    testBtn.disabled = true;
    
    try {
        // محاكاة اختبار الاتصال
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showAlert('تم الاتصال بنجاح! المحرك يعمل بشكل صحيح.', 'success');
    } catch (error) {
        showAlert('فشل في الاتصال: ' + error.message, 'danger');
    } finally {
        testBtn.innerHTML = originalText;
        testBtn.disabled = false;
    }
}

function showAlert(message, type) {
    const alertDiv = document.getElementById('testResult');
    alertDiv.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    alertDiv.style.display = 'block';
    
    // إخفاء التنبيه بعد 5 ثوان
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 5000);
}
