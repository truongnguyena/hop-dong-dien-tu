// ============================================================
// UTILITIES & CONFIG
// ============================================================

// Settings
const settings = {
  autoSave: localStorage.getItem('settingAutoSave') !== 'false',
  notifications: localStorage.getItem('settingNotifications') !== 'false',
  keyboardShortcuts: localStorage.getItem('settingKeyboardShortcuts') !== 'false',
  darkMode: localStorage.getItem('settingDarkMode') === 'true'
};

// Notification Toast
const showNotification = (message, type = 'success', duration = 3000) => {
  if (!settings.notifications) return;
  
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi bi-${type === 'success' ? 'check-circle-fill' : type === 'error' ? 'exclamation-circle-fill' : 'info-circle-fill'}"></i> ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  
  container.appendChild(toast);
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
  
  setTimeout(() => toast.remove(), duration);
};

// Dark Mode
const initDarkMode = () => {
  if (settings.darkMode) {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    const toggle = document.getElementById('darkModeToggle');
    if (toggle) toggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
  }
};

const toggleDarkMode = () => {
  const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-bs-theme');
    localStorage.setItem('settingDarkMode', 'false');
    const toggle = document.getElementById('darkModeToggle');
    if (toggle) toggle.innerHTML = '<i class="bi bi-moon-fill"></i>';
    showNotification('Light mode activated', 'info');
  } else {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    localStorage.setItem('settingDarkMode', 'true');
    const toggle = document.getElementById('darkModeToggle');
    if (toggle) toggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
    showNotification('Dark mode activated', 'info');
  }
};

// Auto-save
let autoSaveTimer;
const scheduleAutoSave = () => {
  if (!settings.autoSave) return;
  
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    const existingId = document.getElementById('contractId')?.value || localStorage.getItem(currentContractKey) || '';
    saveContractFromForm(existingId);
    showNotification('Bản nháp đã lưu tự động', 'success', 1500);
  }, 30000); // 30 giây
};

// Keyboard Shortcuts
const initKeyboardShortcuts = () => {
  if (!settings.keyboardShortcuts) return;

  document.addEventListener('keydown', (e) => {
    // Ctrl+S: Save Draft
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveDraft();
    }
    // Ctrl+O: Open Draft
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
      e.preventDefault();
      loadDraft();
    }
    // Ctrl+Shift+D: Dark Mode
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      toggleDarkMode();
    }
    // Ctrl+,: Settings
    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
      e.preventDefault();
      const modal = new bootstrap.Modal(document.getElementById('settingsModal'));
      modal.show();
    }
  });
};

// Input Validation
const validateInput = (value, type = 'text') => {
  const sanitized = value.trim();
  // Prevent XSS
  const escaped = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  return escaped;
};

// ============================================================
// MAIN VARIABLES
// ============================================================

const form = document.getElementById('contractBuilder');
const preview = document.getElementById('contractPreview');
const template = document.getElementById('contractTemplate');
const saveDraftBtn = document.getElementById('saveDraftBtn');
const loadDraftBtn = document.getElementById('loadDraftBtn');
const copyBtn = document.getElementById('copyContractBtn');
const exportBtn = document.getElementById('exportPdfBtn');
const generateLinkBtn = document.getElementById('generateLinkBtn');
const verifyBtn = document.getElementById('verifyBtn');
const progressBar = document.getElementById('progressBar');
const progressLabel = document.getElementById('progressLabel');
const storageKey = 'eContractDraft';
const contractsKey = 'eContracts';
const shareLinksKey = 'eContractShareLinks';
const ownerKey = 'eContractOwner';
const currentContractKey = 'eCurrentContractId';

// Quản lý hợp đồng và link chia sẻ
let contracts = JSON.parse(localStorage.getItem(contractsKey) || '[]');
let shareLinks = JSON.parse(localStorage.getItem(shareLinksKey) || '{}');

// Kiểm tra quyền truy cập - chỉ Bên A (người tạo) mới có quyền xem lưu trữ
const isContractOwner = () => {
  const ownerData = localStorage.getItem(ownerKey);
  if (!ownerData) return false;
  
  try {
    const owner = JSON.parse(ownerData);
    return owner.active === true;
  } catch {
    return false;
  }
};

// Đặt chủ sở hữu (Bên A) - được gọi khi tạo hợp đồng đầu tiên
const setContractOwner = (partyAName) => {
  const owner = {
    name: partyAName,
    createdAt: new Date().toISOString(),
    active: true
  };
  localStorage.setItem(ownerKey, JSON.stringify(owner));
};

// Kiểm tra và ẩn các nút quản lý nếu không phải chủ sở hữu
const checkPermissions = () => {
  const isOwner = isContractOwner();
  const manageBtn = document.getElementById('manageContractsBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const securityBadge = document.getElementById('securityBadge');
  
  // Hiển thị badge bảo mật nếu là chủ sở hữu
  if (securityBadge) {
    securityBadge.style.display = isOwner ? 'inline-flex' : 'none';
  }
  
  // Nếu không phải chủ sở hữu, ẩn các nút quản lý
  if (!isOwner) {
    if (manageBtn) manageBtn.style.display = 'none';
    // Cho phép export JSON để chia sẻ, nhưng không cho xem danh sách
  } else {
    if (manageBtn) manageBtn.style.display = 'inline-flex';
  }
};

const fieldNames = [
  'partyAName',
  'partyAId',
  'partyAAddress',
  'partyBName',
  'partyBId',
  'partyBAddress',
  'contractType',
  'contractValue',
  'createdDate',
  'effectiveDate',
  'expiryDate',
  'scope',
  'paymentTerms',
  'specialTerms',
  'stampCompanyA',
  'stampPositionA',
  'stampCompanyB',
  'stampPositionB',
];

// Helper to create unique id
const createContractId = () => 'contract_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

// Hàm tạo stamp hình tròn (con dấu điện tử)
const createStamp = (company, position, color = '#ff6b9d') => {
  const canvas = document.createElement('canvas');
  canvas.width = 150;
  canvas.height = 150;
  const ctx = canvas.getContext('2d');

  // Vẽ hình tròn ngoài
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(75, 75, 70, 0, Math.PI * 2);
  ctx.stroke();

  // Vẽ 2-3 hình tròn nhỏ bên trong (hiệu ứng anime)
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(75, 75, 60, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(75, 75, 50, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Văn bản công ty (arc text - tròn ở trên)
  ctx.fillStyle = color;
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Nếu công ty dài, giảm font size
  if (company && company.length > 15) {
    ctx.font = 'bold 10px Arial, sans-serif';
  }
  
  // Vẽ công ty ở giữa phía trên
  if (company) {
    const text = company.substring(0, 20); // Giới hạn độ dài
    ctx.fillText(text, 75, 45);
  }

  // Vẽ chức vụ ở giữa phía dưới
  ctx.font = '11px Arial, sans-serif';
  if (position) {
    const posText = position.substring(0, 15);
    ctx.fillText(posText, 75, 90);
  }

  // Vẽ dấu X giữa (biểu tượng kiểu dấu)
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(55, 55);
  ctx.lineTo(95, 95);
  ctx.moveTo(95, 55);
  ctx.lineTo(55, 95);
  ctx.stroke();

  return canvas.toDataURL('image/png');
};

// Hàm tính SHA-256 hash (dùng Web Crypto API)
const computeContractHash = async (contractData) => {
  // Tạo string từ dữ liệu hợp đồng (không bao gồm chữ ký và hash chính nó)
  const textToHash = JSON.stringify({
    partyA: contractData.partyAName + '|' + contractData.partyAId,
    partyB: contractData.partyBName + '|' + contractData.partyBId,
    type: contractData.contractType,
    value: contractData.contractValue,
    scope: contractData.scope,
    payment: contractData.paymentTerms,
    special: contractData.specialTerms,
    created: contractData.createdDate,
    effective: contractData.effectiveDate,
    expires: contractData.expiryDate,
  });
  
  const msgUint8 = new TextEncoder().encode(textToHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// Save current form as a contract entry (draft or signed depending on signatures)
const saveContractFromForm = (contractId) => {
  const data = getData();
  const ownerData = JSON.parse(localStorage.getItem(ownerKey) || '{}');

  if (!contractId) contractId = createContractId();

  const contractData = {
    id: contractId,
    ...data,
    signatureA: signatureAImage,
    signatureB: signatureBImage,
    stampA: null,
    stampB: null,
    contractHash: null,
    createdAt: new Date().toISOString(),
    status: 'draft',
    remoteSigning: remoteSigningCheckbox?.checked || false,
    version: '1.0',
    owner: data.partyAName || ownerData.name || null,
    ownerId: ownerData.createdAt || null
  };

  // Tạo stamp nếu có công ty và chức vụ
  if (data.stampCompanyA || data.stampPositionA) {
    contractData.stampA = createStamp(data.stampCompanyA, data.stampPositionA, '#ff6b9d');
  }
  if (data.stampCompanyB || data.stampPositionB) {
    contractData.stampB = createStamp(data.stampCompanyB, data.stampPositionB, '#c084fc');
  }

  // Nếu cả hai bên đã ký thì đánh dấu signed
  if (contractData.signatureA && contractData.signatureB) {
    contractData.status = 'signed';
    contractData.signedAt = new Date().toISOString();
  }

  // Lưu hoặc cập nhật
  const existingIndex = contracts.findIndex(c => c.id === contractId);
  if (existingIndex !== -1) {
    contracts[existingIndex] = contractData;
  } else {
    contracts.push(contractData);
  }
  localStorage.setItem(contractsKey, JSON.stringify(contracts));
  // Lưu current id để biết khi load lại
  localStorage.setItem(currentContractKey, contractId);
  const contractIdInput = document.getElementById('contractId');
  if (contractIdInput) contractIdInput.value = contractId;
  return contractId;
};

// Lock form UI to prevent further edits after signing
const lockForm = (contractId) => {
  // Disable all inputs/selects/textarea/buttons (except export and view actions)
  const elements = form.querySelectorAll('input, select, textarea, button');
  elements.forEach(el => {
    // Keep export/download/manage buttons enabled
    if (el.id === 'exportPdfBtn' || el.id === 'exportJsonBtn' || el.id === 'manageContractsBtn') return;
    // Keep copy and generate link allowed
    if (el.id === 'copyContractBtn' || el.id === 'generateLinkBtn') return;
    el.disabled = true;
  });

  // Make canvases non-interactive and hide clear buttons
  ['signatureCanvasA','signatureCanvasB'].forEach(id => {
    const c = document.getElementById(id);
    if (c) c.style.pointerEvents = 'none';
  });
  ['clearSignatureA','clearSignatureB'].forEach(id => {
    const b = document.getElementById(id);
    if (b) b.style.display = 'none';
  });

  // Show locked badge and watermark
  const lockedNoticeId = 'contractLockedNotice';
  if (!document.getElementById(lockedNoticeId)) {
    const notice = document.createElement('div');
    notice.id = lockedNoticeId;
    notice.className = 'alert alert-dark mt-3 d-flex align-items-center gap-2';
    notice.innerHTML = `
      <i class="bi bi-lock-fill" style="font-size: 1.5rem;"></i>
      <div>
        <strong>Hợp đồng đã được ký và đã bị khoá.</strong><br>
        <small>Không thể chỉnh sửa nội dung hoặc hủy bỏ chữ ký.</small>
      </div>
    `;
    const parent = document.getElementById('contract-form');
    if (parent) parent.prepend(notice);
  }

  // Thêm watermark vào preview
  const previewWatermarkId = 'previewWatermark';
  if (!document.getElementById(previewWatermarkId) && preview) {
    const watermark = document.createElement('div');
    watermark.id = previewWatermarkId;
    watermark.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 4rem;
      font-weight: bold;
      color: rgba(255, 107, 157, 0.1);
      pointer-events: none;
      white-space: nowrap;
      z-index: 1;
    `;
    watermark.textContent = '✓ ĐÃ KÝ & KHOÁ';
    // Tìm parent có position relative
    if (preview.parentElement) {
      preview.parentElement.style.position = 'relative';
      preview.parentElement.appendChild(watermark);
    }
  }
};

// If loading a contract object, check if signed
const isContractSigned = (contract) => {
  return contract && contract.status === 'signed';
};

// Điều khoản có sẵn
const presetTerms = {
  scope1: 'Phát triển và triển khai hệ thống phần mềm theo yêu cầu kỹ thuật đã được hai bên thống nhất. Bên B cam kết đảm bảo chất lượng sản phẩm đạt tiêu chuẩn đã cam kết.',
  scope2: 'Cung cấp dịch vụ tư vấn và hỗ trợ kỹ thuật theo yêu cầu của Bên A. Bên B sẽ cử nhân viên có chuyên môn phù hợp để thực hiện công việc.',
  scope3: 'Sản xuất và giao hàng sản phẩm theo đơn đặt hàng. Bên B cam kết giao hàng đúng thời hạn và đảm bảo chất lượng sản phẩm.',
  scope4: 'Thực hiện các công việc gia công theo thỏa thuận. Bên B cam kết hoàn thành đúng tiến độ và chất lượng yêu cầu.',
  payment1: 'Bên A thanh toán 100% giá trị hợp đồng trước khi Bên B thực hiện công việc. Thanh toán được thực hiện trong vòng 7 ngày làm việc kể từ ngày ký kết hợp đồng.',
  payment2: 'Bên A thanh toán 50% giá trị hợp đồng sau khi ký kết hợp đồng, 50% còn lại sau khi Bên B hoàn thành và được Bên A nghiệm thu. Mỗi đợt thanh toán được thực hiện trong vòng 7 ngày làm việc.',
  payment3: 'Bên A thanh toán 30% giá trị hợp đồng sau khi ký kết, 40% theo tiến độ thực hiện, 30% sau khi hoàn thành và nghiệm thu. Mỗi đợt thanh toán được thực hiện trong vòng 7 ngày làm việc.',
  payment4: 'Thanh toán theo từng hạng mục sau khi được nghiệm thu. Mỗi hạng mục được thanh toán trong vòng 7 ngày làm việc kể từ ngày nghiệm thu.',
  special1: 'Hai bên cam kết bảo mật tuyệt đối các thông tin liên quan đến hợp đồng và không được tiết lộ cho bên thứ ba mà không có sự đồng ý của bên còn lại.',
  special2: 'Quyền sở hữu trí tuệ đối với sản phẩm, tài liệu do Bên B tạo ra trong quá trình thực hiện hợp đồng sẽ chuyển giao cho Bên A sau khi Bên A thanh toán đầy đủ giá trị hợp đồng.',
  special3: 'Nếu Bên B chậm trễ trong việc thực hiện hợp đồng, Bên B sẽ phải chịu phạt vi phạm với mức 0.5% giá trị hợp đồng cho mỗi ngày chậm trễ.',
  special4: 'Bên B cam kết bảo hành sản phẩm/dịch vụ trong thời gian 12 tháng kể từ ngày nghiệm thu. Trong thời gian bảo hành, Bên B sẽ miễn phí sửa chữa, thay thế các lỗi do Bên B gây ra.'
};

// Điều khoản bắt buộc cho từng mục
const mandatoryTerms = {
  scope: 'Các bên cam kết thực hiện đúng và đầy đủ các nghĩa vụ đã thỏa thuận trong hợp đồng này.',
  paymentTerms: 'Thanh toán được thực hiện bằng chuyển khoản đến tài khoản do Bên B cung cấp. Mọi phí giao dịch ngân hàng do Bên A chịu trách nhiệm.',
  specialTerms: 'Các điều khoản này có giá trị pháp lý và được ưu tiên áp dụng khi có tranh chấp phát sinh.'
};

const emptyState = `
  <p class="empty-state">
    Điền thông tin để tạo nội dung hợp đồng. Phần xem trước sẽ hiển thị ngay tại đây.
  </p>
`;

const formatCurrency = (value) => {
  if (!value) return '';
  return Number(value).toLocaleString('vi-VN');
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Khởi tạo ngày tạo hợp đồng là hôm nay
const setTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  const createdDateInput = document.getElementById('createdDate');
  if (createdDateInput) {
    createdDateInput.value = dateString;
  }
};

const getData = () => {
  const formData = new FormData(form);
  return fieldNames.reduce((acc, field) => {
    acc[field] = formData.get(field)?.trim() ?? '';
    return acc;
  }, {});
};

const fillTemplate = (data) => {
  const clone = template.content.cloneNode(true);
  
  // Điền các trường thông thường
  clone.querySelectorAll('[data-field]').forEach((node) => {
    const key = node.dataset.field;
    let value = data[key] || '________________';
    
    if (key === 'contractValue') {
      value = formatCurrency(value);
    } else if (key === 'createdDate' || key === 'effectiveDate' || key === 'expiryDate') {
      value = formatDate(value);
    }
    
    node.textContent = value;
  });
  
  // Xử lý điều khoản với các điều khoản bắt buộc (luôn thêm điều khoản bắt buộc)
  const scopeField = clone.querySelector('[data-field="scope"]');
  if (scopeField) {
    let scopeContent = (data.scope || '').trim();
    if (mandatoryTerms.scope) {
      scopeContent = scopeContent ? scopeContent + '\n\n' + mandatoryTerms.scope : mandatoryTerms.scope;
    }
    if (scopeContent) {
      // Giữ nguyên xuống dòng bằng cách sử dụng white-space
      scopeField.style.whiteSpace = 'pre-line';
      scopeField.textContent = scopeContent;
    } else {
      scopeField.textContent = '________________';
    }
  }
  
  const paymentField = clone.querySelector('[data-field="paymentTerms"]');
  if (paymentField) {
    let paymentContent = (data.paymentTerms || '').trim();
    if (mandatoryTerms.paymentTerms) {
      paymentContent = paymentContent ? paymentContent + '\n\n' + mandatoryTerms.paymentTerms : mandatoryTerms.paymentTerms;
    }
    if (paymentContent) {
      paymentField.style.whiteSpace = 'pre-line';
      paymentField.textContent = paymentContent;
    } else {
      paymentField.textContent = '________________';
    }
  }
  
  const specialField = clone.querySelector('[data-field="specialTerms"]');
  if (specialField) {
    let specialContent = (data.specialTerms || '').trim();
    if (mandatoryTerms.specialTerms) {
      specialContent = specialContent ? specialContent + '\n\n' + mandatoryTerms.specialTerms : mandatoryTerms.specialTerms;
    }
    if (specialContent) {
      specialField.style.whiteSpace = 'pre-line';
      specialField.textContent = specialContent;
    } else {
      specialField.textContent = '________________';
    }
  }
  
  // Hiển thị chữ ký
  const signatureImgA = clone.querySelector('#signatureImgA');
  if (signatureImgA && signatureAImage) {
    signatureImgA.src = signatureAImage;
    signatureImgA.style.display = 'block';
  }
  
  const signatureImgB = clone.querySelector('#signatureImgB');
  if (signatureImgB && signatureBImage) {
    signatureImgB.src = signatureBImage;
    signatureImgB.style.display = 'block';
  }
  
  return clone;
};

const renderContract = () => {
  const data = getData();
  const hasValue = Object.values(data).some((v) => v);

  if (!hasValue) {
    preview.innerHTML = emptyState;
    return;
  }

  preview.innerHTML = '';
  preview.appendChild(fillTemplate(data));
};

const updateProgress = () => {
  const data = getData();
  const filled = Object.values(data).filter(Boolean).length;
  const percent = Math.round((filled / fieldNames.length) * 100);
  progressBar.style.width = `${percent}%`;
  progressBar.setAttribute('aria-valuenow', percent);
  progressLabel.textContent = `${percent}%`;
};

const saveDraft = () => {
  try {
    const data = getData();
    localStorage.setItem(storageKey, JSON.stringify(data));
    saveDraftBtn.textContent = 'Đã lưu ✓';
    showNotification('Bản nháp đã lưu thành công', 'success', 1500);
    setTimeout(() => (saveDraftBtn.textContent = 'Lưu bản nháp'), 2000);
  } catch (err) {
    console.error('Save draft error:', err);
    showNotification('Lỗi khi lưu bản nháp: ' + err.message, 'error');
  }
};

const loadDraft = () => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      showNotification('Chưa có bản nháp nào được lưu.', 'info');
      return;
    }
    const data = JSON.parse(raw);
    fieldNames.forEach((field) => {
      if (data[field] !== undefined) {
        form.elements[field].value = data[field];
      }
    });
    renderContract();
    updateProgress();
    showNotification('Bản nháp đã được khôi phục', 'success', 1500);
  } catch (err) {
    console.error('Load draft error:', err);
    showNotification('Lỗi khi tải bản nháp: ' + err.message, 'error');
  }
};

const copyContract = async () => {
  try {
    const text = preview.innerText.trim();
    if (!text) {
      showNotification('Chưa có nội dung để sao chép.', 'warning');
      return;
    }
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = 'Đã sao chép ✓';
    showNotification('Nội dung đã sao chép', 'success', 1500);
    setTimeout(() => (copyBtn.textContent = 'Sao chép nội dung'), 2000);
  } catch (err) {
    console.error('Copy error:', err);
    showNotification('Lỗi khi sao chép: ' + err.message, 'error');
  }
};

const exportContract = async () => {
  try {
    const html = preview.innerHTML.trim();
    if (!html) {
      showNotification('Chưa có nội dung để xuất.', 'warning');
      return;
    }

    const data = getData();
    let checksumHtml = '';
    try {
      const hash = await computeContractHash(data);
      checksumHtml = `
        <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ccc; font-size: 11px; color: #666;">
          <p><strong>Checksum SHA-256:</strong></p>
          <p style="font-family: monospace; word-break: break-all; background: #f5f5f5; padding: 0.5rem; border-radius: 4px;">
            ${hash}
          </p>
          <p><small>Sử dụng checksum này để xác minh hợp đồng chưa bị chỉnh sửa.</small></p>
        </div>
      `;
    } catch (err) {
      console.error('Error computing hash:', err);
    }

    const watermarkHtml = data.partyAId && data.partyBId ? `
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 3rem; font-weight: bold; color: rgba(255, 107, 157, 0.08); pointer-events: none; white-space: nowrap; z-index: 1;">
        ✓ ĐÃ KÝ
      </div>
    ` : '';

    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    printWindow.document.write(`
      <html>
        <head>
          <title>Hợp đồng điện tử</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; padding: 3rem; line-height: 1.6; }
            h3 { letter-spacing: 0.08em; text-align: center; }
            section { margin-bottom: 1.25rem; }
            ul { padding-left: 1.25rem; }
            .signature-box { height: 80px; border: 1px dashed #cbd5f5; margin: 1rem 0; display: flex; align-items: center; justify-content: center; }
            .signature-box img { max-width: 100%; max-height: 100px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e4e7ec; }
            .signatures > div { flex: 1; text-align: center; padding: 0 1rem; }
            .stamp { width: 80px; height: 80px; margin: 0.5rem auto; }
            @media print {
              body { padding: 1rem; }
            }
          </style>
        </head>
        <body>
          ${watermarkHtml}
          ${html}
          ${checksumHtml}
          <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ccc; font-size: 10px; color: #999; text-align: center;">
            <p>Hợp đồng được tạo và ký bằng hệ thống Hợp đồng Điện tử</p>
            <p>Ngày xuất: ${new Date().toLocaleString('vi-VN')}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    showNotification('Hợp đồng đã được xuất PDF', 'success', 1500);
  } catch (err) {
    console.error('Export PDF error:', err);
    showNotification('Lỗi khi xuất PDF: ' + err.message, 'error');
  }
};

form.addEventListener('submit', (event) => {
  event.preventDefault();
  renderContract();
  updateProgress();

  // Save current form as contract draft (or signed if both signatures present)
  const existingId = document.getElementById('contractId')?.value || localStorage.getItem(currentContractKey) || '';
  const newId = saveContractFromForm(existingId);

  // Hiển thị nút tạo link nếu đã bật ký từ xa
  if (remoteSigningCheckbox?.checked) {
    generateLinkBtn.style.display = 'inline-block';
  } else {
    generateLinkBtn.style.display = 'none';
  }
  // If saved contract is signed, lock the form
  const savedContract = contracts.find(c => c.id === newId);
  if (isContractSigned(savedContract)) {
    lockForm(newId);
  }

  preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

form.addEventListener('input', () => {
  updateProgress();
});

form.addEventListener('reset', () => {
  setTimeout(() => {
    // Xóa chữ ký
    signatureAImage = null;
    signatureBImage = null;
    const canvasA = document.getElementById('signatureCanvasA');
    const canvasB = document.getElementById('signatureCanvasB');
    if (canvasA) {
      const ctxA = canvasA.getContext('2d');
      ctxA.clearRect(0, 0, canvasA.width, canvasA.height);
    }
    if (canvasB) {
      const ctxB = canvasB.getContext('2d');
      ctxB.clearRect(0, 0, canvasB.width, canvasB.height);
    }
    // Đặt lại ngày tạo
    setTodayDate();
    preview.innerHTML = emptyState;
    updateProgress();
  }, 0);
});

// Xử lý ký từ xa
const remoteSigningCheckbox = document.getElementById('remoteSigning');
const remoteSigningSection = document.getElementById('remoteSigningSection');
let shareLinkModal = null;
const shareLinkInput = document.getElementById('shareLinkInput');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const remoteBadge = document.getElementById('remoteBadge');

// Toggle hiển thị section ký từ xa
if (remoteSigningCheckbox) {
  remoteSigningCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      remoteSigningSection.style.display = 'block';
      if (remoteBadge) remoteBadge.style.display = 'inline-block';
    } else {
      remoteSigningSection.style.display = 'none';
      if (remoteBadge) remoteBadge.style.display = 'none';
    }
  });
}

// Tạo link chia sẻ
const generateShareLink = () => {
  const data = getData();
  if (!data.partyAName || !data.partyBName) {
    alert('Vui lòng điền đầy đủ thông tin Bên A và Bên B trước khi tạo link.');
    return;
  }
  
  // Tạo ID duy nhất cho hợp đồng
  const contractId = 'contract_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  // Đặt chủ sở hữu nếu chưa có
  if (!isContractOwner()) {
    setContractOwner(data.partyAName);
  }
  
  // Lưu hợp đồng vào danh sách (chỉ Bên A mới có quyền tạo và lưu)
  const ownerData = JSON.parse(localStorage.getItem(ownerKey) || '{}');
  const contractData = {
    id: contractId,
    ...data,
    signatureA: signatureAImage,
    signatureB: signatureBImage,
    createdAt: new Date().toISOString(),
    status: 'pending_b_signature',
    remoteSigning: remoteSigningCheckbox?.checked || false,
    version: '1.0',
    owner: data.partyAName, // Lưu thông tin chủ sở hữu
    ownerId: ownerData.createdAt || null
  };
  
  // Kiểm tra xem contract đã tồn tại chưa (update thay vì tạo mới)
  const existingIndex = contracts.findIndex(c => c.id === contractId);
  if (existingIndex !== -1) {
    contracts[existingIndex] = contractData;
  } else {
    contracts.push(contractData);
  }
  localStorage.setItem(contractsKey, JSON.stringify(contracts));
  
  // Tạo link chia sẻ
  const shareLink = `${window.location.origin}${window.location.pathname}#sign/${contractId}`;
  shareLinks[contractId] = {
    link: shareLink,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 ngày
    signed: false
  };
  localStorage.setItem(shareLinksKey, JSON.stringify(shareLinks));
  
  // Hiển thị modal với link
  if (shareLinkInput) shareLinkInput.value = shareLink;
  
  // Khởi tạo và hiển thị modal
  const modalElement = document.getElementById('shareLinkModal');
  if (modalElement) {
    if (!shareLinkModal) {
      shareLinkModal = new bootstrap.Modal(modalElement);
    }
    shareLinkModal.show();
  }
  
  return shareLink;
};

// Sao chép link
copyLinkBtn?.addEventListener('click', async () => {
  await navigator.clipboard.writeText(shareLinkInput.value);
  copyLinkBtn.innerHTML = '<i class="bi bi-check"></i> Đã sao chép';
  setTimeout(() => {
    copyLinkBtn.innerHTML = '<i class="bi bi-clipboard"></i> Sao chép';
  }, 2000);
});

// Chia sẻ qua email
document.getElementById('shareEmailBtn')?.addEventListener('click', () => {
  const subject = encodeURIComponent('Hợp đồng cần ký kết');
  const body = encodeURIComponent(`Xin chào,\n\nVui lòng ký hợp đồng tại link sau:\n${shareLinkInput.value}\n\nTrân trọng.`);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
});

// Chia sẻ qua WhatsApp
document.getElementById('shareWhatsAppBtn')?.addEventListener('click', () => {
  const text = encodeURIComponent(`Xin chào, vui lòng ký hợp đồng tại link: ${shareLinkInput.value}`);
  window.open(`https://wa.me/?text=${text}`, '_blank');
});

// Chia sẻ qua Zalo
document.getElementById('shareZaloBtn')?.addEventListener('click', () => {
  const text = encodeURIComponent(`Xin chào, vui lòng ký hợp đồng tại link: ${shareLinkInput.value}`);
  window.open(`https://zalo.me/?msg=${text}`, '_blank');
});

// Xử lý trang ký từ xa
const handleRemoteSigning = () => {
  const hash = window.location.hash;
  if (hash.startsWith('#sign/')) {
    const contractId = hash.replace('#sign/', '');
    loadContractForSigning(contractId);
  }
};

// Tải hợp đồng để ký
const loadContractForSigning = (contractId) => {
  const contract = contracts.find(c => c.id === contractId);
  if (!contract) {
    document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-danger">Hợp đồng không tồn tại hoặc đã hết hạn.</div></div>';
    return;
  }
  
  const linkData = shareLinks[contractId];
  if (!linkData || new Date(linkData.expiresAt) < new Date()) {
    document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-warning">Link đã hết hạn. Vui lòng liên hệ với Bên A để lấy link mới.</div></div>';
    return;
  }
  
  if (linkData.signed) {
    document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-info">Hợp đồng này đã được ký. Cảm ơn bạn!</div></div>';
    return;
  }
  
  // Hiển thị giao diện ký
  showSigningInterface(contract);
};

// Hiển thị giao diện ký với phong cách anime
const showSigningInterface = (contract) => {
  // Thêm styles anime vào head
  const style = document.createElement('style');
  style.textContent = `
    body { background: linear-gradient(135deg, #fff5f7 0%, #ffeef7 50%, #fef0ff 100%); font-family: 'Inter', sans-serif; }
    .anime-card { border-radius: 24px; border: 2px solid #f5d0e8; box-shadow: 0 10px 40px rgba(255, 107, 157, 0.15); }
    .anime-header { background: linear-gradient(135deg, #ff9ec8 0%, #c084fc 100%); border-radius: 24px 24px 0 0; }
    .contract-preview { background: linear-gradient(to bottom, #ffffff 0%, #fef0ff 100%); border-radius: 16px; padding: 1.5rem; }
    .signature-canvas-box { border: 2px dashed #ff9ec8; border-radius: 16px; background: #fff; }
    .signature-canvas-box:hover { border-color: #c084fc; box-shadow: 0 0 0 3px rgba(255, 158, 200, 0.1); }
  `;
  document.head.appendChild(style);
  
  document.body.innerHTML = `
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <div class="container py-4">
      <div class="row justify-content-center">
        <div class="col-lg-10">
          <div class="card anime-card border-0">
            <div class="card-header anime-header text-white border-0 py-3">
              <h3 class="mb-0"><i class="bi bi-file-earmark-sign"></i> Ký hợp đồng điện tử</h3>
            </div>
            <div class="card-body p-4">
              <div class="alert alert-info border-0 mb-4" style="background: linear-gradient(135deg, #ffeef7 0%, #f3e8ff 100%); border-left: 4px solid #ff9ec8 !important;">
                <h5 class="mb-2"><i class="bi bi-file-text"></i> Hợp đồng: ${contract.contractType || 'N/A'}</h5>
                <p class="mb-0">Bạn đang ký hợp đồng với <strong>${contract.partyAName}</strong></p>
              </div>
              
              <div class="mb-4">
                <h5 class="mb-3"><i class="bi bi-eye"></i> Xem trước hợp đồng</h5>
                <div class="contract-preview border" style="max-height: 500px; overflow-y: auto;">
                  ${generateContractHTML(contract)}
                </div>
              </div>
              
              <div class="mb-4">
                <h5 class="mb-3"><i class="bi bi-pen"></i> Chữ ký của Bên B (${contract.partyBName})</h5>
                <div class="signature-canvas-box p-3">
                  <canvas id="remoteSignatureCanvas" width="400" height="150" class="w-100" style="cursor: crosshair;"></canvas>
                </div>
                <div class="mt-2">
                  <button class="btn btn-outline-danger btn-sm" id="clearRemoteSignature">
                    <i class="bi bi-x-circle"></i> Xóa chữ ký
                  </button>
                </div>
              </div>
              
              <div class="d-grid gap-2">
                <button class="btn btn-lg border-0" id="submitSignature" style="background: linear-gradient(135deg, #ff9ec8 0%, #c084fc 100%); color: white;">
                  <i class="bi bi-check-circle"></i> Xác nhận và ký hợp đồng
                </button>
                <button class="btn btn-outline-secondary" id="cancelSigning">
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Setup canvas ký từ xa
  setupRemoteSignatureCanvas(contract.id);
  
  // Nút hủy
  document.getElementById('cancelSigning')?.addEventListener('click', () => {
    window.location.href = window.location.pathname;
  });
};

// Setup canvas ký từ xa
const setupRemoteSignatureCanvas = (contractId) => {
  const canvas = document.getElementById('remoteSignatureCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#1d1f2c';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  
  const getMousePos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };
  
  const startDrawing = (e) => {
    isDrawing = true;
    const pos = getMousePos(e);
    lastX = pos.x;
    lastY = pos.y;
  };
  
  const draw = (e) => {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastX = pos.x;
    lastY = pos.y;
  };
  
  const stopDrawing = () => {
    isDrawing = false;
  };
  
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);
  
  // Xóa chữ ký
  document.getElementById('clearRemoteSignature')?.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
  
  // Xác nhận ký
  document.getElementById('submitSignature')?.addEventListener('click', () => {
    const signatureData = canvas.toDataURL('image/png');
    if (!signatureData || canvas.width === 0 || canvas.height === 0) {
      alert('Vui lòng ký vào hợp đồng trước khi xác nhận.');
      return;
    }
    
    // Cập nhật hợp đồng
    const contractIndex = contracts.findIndex(c => c.id === contractId);
    if (contractIndex !== -1) {
      contracts[contractIndex].signatureB = signatureData;
      contracts[contractIndex].status = 'signed';
      contracts[contractIndex].signedAt = new Date().toISOString();
      localStorage.setItem(contractsKey, JSON.stringify(contracts));
    }
    
    // Đánh dấu đã ký
    shareLinks[contractId].signed = true;
    shareLinks[contractId].signedAt = new Date().toISOString();
    localStorage.setItem(shareLinksKey, JSON.stringify(shareLinks));
    
    // Nếu có contract lưu trong contracts[], cập nhật trạng thái signed và lưu
    const idxLocal = contracts.findIndex(c => c.id === contractId);
    if (idxLocal !== -1) {
      contracts[idxLocal].status = 'signed';
      contracts[idxLocal].signedAt = new Date().toISOString();
      localStorage.setItem(contractsKey, JSON.stringify(contracts));
    }
    // Lưu contract hiện tại để khi quay lại giao diện chính có thể khoá
    localStorage.setItem(currentContractKey, contractId);
    
    alert('Cảm ơn bạn đã ký hợp đồng! Hợp đồng đã được lưu thành công.');
    window.location.href = window.location.pathname;
  });
};

// Tạo HTML hợp đồng đầy đủ
const generateContractHTML = (contract) => {
  // Xử lý điều khoản với mandatory terms
  let scopeContent = (contract.scope || '').trim();
  if (mandatoryTerms.scope && scopeContent) {
    scopeContent = scopeContent + '\n\n' + mandatoryTerms.scope;
  } else if (mandatoryTerms.scope) {
    scopeContent = mandatoryTerms.scope;
  }
  
  let paymentContent = (contract.paymentTerms || '').trim();
  if (mandatoryTerms.paymentTerms && paymentContent) {
    paymentContent = paymentContent + '\n\n' + mandatoryTerms.paymentTerms;
  } else if (mandatoryTerms.paymentTerms) {
    paymentContent = mandatoryTerms.paymentTerms;
  }
  
  let specialContent = (contract.specialTerms || '').trim();
  if (mandatoryTerms.specialTerms && specialContent) {
    specialContent = specialContent + '\n\n' + mandatoryTerms.specialTerms;
  } else if (mandatoryTerms.specialTerms) {
    specialContent = mandatoryTerms.specialTerms;
  }
  
  const contractHTML = `
    <h3>HỢP ĐỒNG ${contract.contractType || 'ĐIỆN TỬ'}</h3>
    <p class="muted">
      Ngày tạo hợp đồng: ${formatDate(contract.createdDate) || 'N/A'}<br>
      Ngày có hiệu lực: ${formatDate(contract.effectiveDate) || 'N/A'}
    </p>
    <section>
      <h4>Điều 1. Thông tin các bên</h4>
      <p>
        <strong>Bên A:</strong>
        ${contract.partyAName || '________________'} (MST/CCCD:
        ${contract.partyAId || '________________'}), địa chỉ
        ${contract.partyAAddress || '________________'}.
      </p>
      <p>
        <strong>Bên B:</strong>
        ${contract.partyBName || '________________'} (MST/CCCD:
        ${contract.partyBId || '________________'}), địa chỉ
        ${contract.partyBAddress || '________________'}.
      </p>
    </section>
    <section>
      <h4>Điều 2. Phạm vi và giá trị hợp đồng</h4>
      <p style="white-space: pre-line;">${scopeContent || '________________'}</p>
      <p>
        <strong>Giá trị:</strong>
        ${formatCurrency(contract.contractValue) || '________________'} VNĐ (đã bao gồm thuế nếu có).
      </p>
    </section>
    <section>
      <h4>Điều 3. Thời hạn thực hiện</h4>
      <p>
        Hợp đồng có hiệu lực từ ngày
        ${formatDate(contract.effectiveDate) || '________________'} đến hết ngày
        ${formatDate(contract.expiryDate) || '________________'}. Gia hạn được thực hiện trên cơ
        sở phụ lục kèm theo.
      </p>
    </section>
    <section>
      <h4>Điều 4. Điều khoản thanh toán</h4>
      <p style="white-space: pre-line;">${paymentContent || '________________'}</p>
    </section>
    <section>
      <h4>Điều 5. Điều khoản đặc biệt</h4>
      <p style="white-space: pre-line;">${specialContent || '________________'}</p>
    </section>
    <section>
      <h4>Điều 6. Cam kết chung</h4>
      <ul>
        <li>Hai bên cam kết cung cấp thông tin trung thực và chính xác.</li>
        <li>
          Tranh chấp phát sinh sẽ được ưu tiên giải quyết bằng thương lượng,
          nếu không thành sẽ đưa ra tòa án có thẩm quyền.
        </li>
        <li>
          Hợp đồng có giá trị pháp lý tương đương bản giấy khi được ký số hoặc
          xác nhận bằng email doanh nghiệp.
        </li>
      </ul>
    </section>
    <section class="signatures" style="display: flex; justify-content: space-between; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e4e7ec;">
      <div style="flex: 1; text-align: center; padding-right: 1rem;">
        <p><strong>Đại diện Bên A</strong></p>
        <div class="signature-box" style="height: 80px; border: 2px dashed #e4e7ec; border-radius: 12px; margin: 1rem 0; display: flex; align-items: center; justify-content: center;">
          ${contract.signatureA ? `<img src="${contract.signatureA}" style="max-width: 100%; max-height: 100px;" />` : ''}
        </div>
        ${contract.stampA ? `<div style="margin: 0.5rem 0;"><img src="${contract.stampA}" style="width: 80px; height: 80px;" /></div>` : ''}
        <p>${contract.partyAName || '________________'}</p>
        ${contract.stampCompanyA ? `<p style="font-size: 12px; color: #666;">${contract.stampCompanyA}</p>` : ''}
        ${contract.stampPositionA ? `<p style="font-size: 11px; color: #999;">${contract.stampPositionA}</p>` : ''}
      </div>
      <div style="flex: 1; text-align: center; padding-left: 1rem;">
        <p><strong>Đại diện Bên B</strong></p>
        <div class="signature-box" style="height: 80px; border: 2px dashed #e4e7ec; border-radius: 12px; margin: 1rem 0; display: flex; align-items: center; justify-content: center;">
          ${contract.signatureB ? `<img src="${contract.signatureB}" style="max-width: 100%; max-height: 100px;" />` : ''}
        </div>
        ${contract.stampB ? `<div style="margin: 0.5rem 0;"><img src="${contract.stampB}" style="width: 80px; height: 80px;" /></div>` : ''}
        <p>${contract.partyBName || '________________'}</p>
        ${contract.stampCompanyB ? `<p style="font-size: 12px; color: #666;">${contract.stampCompanyB}</p>` : ''}
        ${contract.stampPositionB ? `<p style="font-size: 11px; color: #999;">${contract.stampPositionB}</p>` : ''}
      </div>
    </section>
  `;
  
  return contractHTML;
};

// JSON Storage functions
const exportToJSON = () => {
  const data = getData();
  const contractData = {
    ...data,
    signatureA: signatureAImage,
    signatureB: signatureBImage,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };
  
  const jsonString = JSON.stringify(contractData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hop-dong-${data.contractType || 'dien-tu'}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  // Hiển thị thông báo
  const exportBtn = document.getElementById('exportJsonBtn');
  if (exportBtn) {
    const originalHTML = exportBtn.innerHTML;
    exportBtn.innerHTML = '<i class="bi bi-check"></i> Đã xuất';
    exportBtn.classList.add('btn-success');
    exportBtn.classList.remove('btn-outline-info');
    setTimeout(() => {
      exportBtn.innerHTML = originalHTML;
      exportBtn.classList.remove('btn-success');
      exportBtn.classList.add('btn-outline-info');
    }, 2000);
  }
};

const importFromJSON = () => {
  const input = document.getElementById('jsonFileInput');
  if (input) {
    input.click();
  }
};

const handleJSONFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const contractData = JSON.parse(e.target.result);
      
      // Kiểm tra version và format
      if (!contractData.version) {
        throw new Error('File không đúng định dạng hợp đồng');
      }
      
      // Điền dữ liệu vào form
      fieldNames.forEach((field) => {
        if (contractData[field] !== undefined && form.elements[field]) {
          form.elements[field].value = contractData[field];
        }
      });
      
      // Khôi phục chữ ký
      if (contractData.signatureA) {
        signatureAImage = contractData.signatureA;
        const canvasA = document.getElementById('signatureCanvasA');
        if (canvasA) {
          const ctxA = canvasA.getContext('2d');
          const img = new Image();
          img.onload = () => {
            ctxA.clearRect(0, 0, canvasA.width, canvasA.height);
            ctxA.drawImage(img, 0, 0, canvasA.width, canvasA.height);
          };
          img.src = contractData.signatureA;
        }
      }
      
      if (contractData.signatureB) {
        signatureBImage = contractData.signatureB;
        const canvasB = document.getElementById('signatureCanvasB');
        if (canvasB) {
          const ctxB = canvasB.getContext('2d');
          const img = new Image();
          img.onload = () => {
            ctxB.clearRect(0, 0, canvasB.width, canvasB.height);
            ctxB.drawImage(img, 0, 0, canvasB.width, canvasB.height);
          };
          img.src = contractData.signatureB;
        }
      }
      
      renderContract();
      updateProgress();
      
      alert('Nhập hợp đồng thành công!');
    } catch (error) {
      alert('Lỗi khi đọc file JSON: ' + error.message);
    }
  };
  reader.readAsText(file);
  
  // Reset input
  event.target.value = '';
};

// Quản lý danh sách hợp đồng - CHỈ BÊN A MỚI CÓ QUYỀN XEM
const loadSavedContracts = () => {
  const contractsList = document.getElementById('contractsList');
  if (!contractsList) return;
  
  // Kiểm tra quyền truy cập
  if (!isContractOwner()) {
    contractsList.innerHTML = `
      <div class="col-12 text-center text-muted py-5">
        <div class="alert alert-warning">
          <i class="bi bi-shield-lock fs-1 d-block mb-3"></i>
          <h5>Không có quyền truy cập</h5>
          <p class="mb-0">Chỉ Bên A (người tạo hợp đồng) mới có quyền xem danh sách hợp đồng đã lưu.</p>
          <p class="mt-2 small">Bên B chỉ có thể ký hợp đồng thông qua link được chia sẻ.</p>
        </div>
      </div>
    `;
    return;
  }
  
  const savedContracts = JSON.parse(localStorage.getItem(contractsKey) || '[]');
  
  // Lọc chỉ hiển thị hợp đồng của chủ sở hữu hiện tại
  const ownerData = JSON.parse(localStorage.getItem(ownerKey) || '{}');
  const ownerContracts = savedContracts.filter(contract => {
    return contract.ownerId === ownerData.createdAt;
  });
  
  if (ownerContracts.length === 0) {
    contractsList.innerHTML = `
      <div class="col-12 text-center text-muted py-5">
        <i class="bi bi-inbox fs-1 d-block mb-2"></i>
        Chưa có hợp đồng nào được lưu
      </div>
    `;
    return;
  }
  
  contractsList.innerHTML = ownerContracts.map((contract, index) => {
    const createdDate = contract.createdAt ? new Date(contract.createdAt).toLocaleDateString('vi-VN') : 'N/A';
    const status = contract.status === 'signed' ? 'success' : 'warning';
    const statusText = contract.status === 'signed' ? 'Đã ký' : 'Chờ ký';
    
    return `
      <div class="col-md-6 col-lg-4">
        <div class="card contract-card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h6 class="card-title mb-0">${contract.contractType || 'Hợp đồng'}</h6>
              <span class="badge bg-${status}">${statusText}</span>
            </div>
            <p class="card-text small text-muted mb-2">
              <i class="bi bi-building"></i> ${contract.partyAName || 'N/A'} ↔ ${contract.partyBName || 'N/A'}
            </p>
            <p class="card-text small text-muted mb-3">
              <i class="bi bi-calendar"></i> ${createdDate}
            </p>
            <div class="d-flex gap-2 flex-wrap">
              <button class="btn btn-sm btn-outline-primary flex-fill" onclick="loadContractFromList('${contract.id}')">
                <i class="bi bi-arrow-down-circle"></i> Tải
              </button>
              <button class="btn btn-sm btn-outline-success" onclick="exportContractToJSON('${contract.id}')">
                <i class="bi bi-download"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteContract('${contract.id}')">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
};

// Load contract từ danh sách - CHỈ BÊN A MỚI CÓ QUYỀN
window.loadContractFromList = (contractId) => {
  // Kiểm tra quyền
  if (!isContractOwner()) {
    alert('Bạn không có quyền xem hợp đồng đã lưu. Chỉ Bên A mới có quyền này.');
    return;
  }
  
  const contract = contracts.find(c => c.id === contractId);
  if (!contract) {
    alert('Không tìm thấy hợp đồng');
    return;
  }
  
  // Kiểm tra quyền sở hữu
  const ownerData = JSON.parse(localStorage.getItem(ownerKey) || '{}');
  if (contract.ownerId !== ownerData.createdAt) {
    alert('Bạn không có quyền truy cập hợp đồng này.');
    return;
  }
  
  // Điền form
  fieldNames.forEach((field) => {
    if (contract[field] !== undefined && form.elements[field]) {
      form.elements[field].value = contract[field];
    }
  });
  
  // Khôi phục chữ ký
  if (contract.signatureA) {
    signatureAImage = contract.signatureA;
    const canvasA = document.getElementById('signatureCanvasA');
    if (canvasA) {
      const ctxA = canvasA.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctxA.clearRect(0, 0, canvasA.width, canvasA.height);
        ctxA.drawImage(img, 0, 0, canvasA.width, canvasA.height);
      };
      img.src = contract.signatureA;
    }
  }
  
  if (contract.signatureB) {
    signatureBImage = contract.signatureB;
    const canvasB = document.getElementById('signatureCanvasB');
    if (canvasB) {
      const ctxB = canvasB.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctxB.clearRect(0, 0, canvasB.width, canvasB.height);
        ctxB.drawImage(img, 0, 0, canvasB.width, canvasB.height);
      };
      img.src = contract.signatureB;
    }
  }
  
  renderContract();
  updateProgress();
  
  const modal = bootstrap.Modal.getInstance(document.getElementById('manageContractsModal'));
  if (modal) modal.hide();
  
  document.getElementById('contract-form').scrollIntoView({ behavior: 'smooth' });
  
  // Nếu hợp đồng đã ký thì khoá giao diện
  if (isContractSigned(contract)) {
    // Set contractId value
    const contractIdInput = document.getElementById('contractId');
    if (contractIdInput) contractIdInput.value = contract.id;
    localStorage.setItem(currentContractKey, contract.id);
    lockForm(contract.id);
  }
};

// Export contract từ danh sách - CHỈ BÊN A MỚI CÓ QUYỀN
window.exportContractToJSON = (contractId) => {
  // Kiểm tra quyền
  if (!isContractOwner()) {
    alert('Bạn không có quyền xuất hợp đồng. Chỉ Bên A mới có quyền này.');
    return;
  }
  
  const contract = contracts.find(c => c.id === contractId);
  if (!contract) {
    alert('Không tìm thấy hợp đồng');
    return;
  }
  
  // Kiểm tra quyền sở hữu
  const ownerData = JSON.parse(localStorage.getItem(ownerKey) || '{}');
  if (contract.ownerId !== ownerData.createdAt) {
    alert('Bạn không có quyền xuất hợp đồng này.');
    return;
  }
  
  const jsonString = JSON.stringify(contract, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hop-dong-${contract.contractType || 'dien-tu'}-${contract.id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Xóa contract - CHỈ BÊN A MỚI CÓ QUYỀN
window.deleteContract = (contractId) => {
  // Kiểm tra quyền
  if (!isContractOwner()) {
    alert('Bạn không có quyền xóa hợp đồng. Chỉ Bên A mới có quyền này.');
    return;
  }
  
  if (!confirm('Bạn có chắc chắn muốn xóa hợp đồng này?')) return;
  
  contracts = contracts.filter(c => c.id !== contractId);
  localStorage.setItem(contractsKey, JSON.stringify(contracts));
  
  loadSavedContracts();
};

saveDraftBtn.addEventListener('click', saveDraft);
loadDraftBtn.addEventListener('click', loadDraft);
copyBtn.addEventListener('click', copyContract);
exportBtn.addEventListener('click', exportContract);
generateLinkBtn?.addEventListener('click', generateShareLink);

// Nút xác minh hợp đồng - hiển thị checksum & QR code
verifyBtn?.addEventListener('click', async () => {
  const data = getData();
  if (!Object.values(data).some(v => v)) {
    alert('Vui lòng điền thông tin hợp đồng trước.');
    return;
  }

  // Tính hash SHA-256
  try {
    const hash = await computeContractHash(data);
    const checksumDisplay = document.getElementById('checksumDisplay');
    if (checksumDisplay) checksumDisplay.value = hash;

    // Tạo QR code
    const qrcodeContainer = document.getElementById('qrcodeContainer');
    if (qrcodeContainer) {
      qrcodeContainer.innerHTML = ''; // Clear previous QR code
      // QR code sẽ chứa checksum
      new QRCode(qrcodeContainer, {
        text: hash,
        width: 200,
        height: 200,
        colorDark: '#ff6b9d',
        colorLight: '#ffffff',
      });
    }

    // Hiển thị modal
    const modal = new bootstrap.Modal(document.getElementById('verifyContractModal'));
    modal.show();
  } catch (err) {
    console.error('Error computing hash:', err);
    alert('Lỗi khi tính toán checksum: ' + err.message);
  }
});

// Copy checksum
document.getElementById('copychecksumBtn')?.addEventListener('click', async () => {
  const checksumDisplay = document.getElementById('checksumDisplay');
  if (checksumDisplay && checksumDisplay.value) {
    await navigator.clipboard.writeText(checksumDisplay.value);
    const btn = document.getElementById('copychecksumBtn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-check"></i>';
    setTimeout(() => {
      btn.innerHTML = originalHTML;
    }, 1500);
  }
});

// Hàm tạo timeline từ contract data
const buildTimeline = (contract) => {
  const events = [];

  if (contract.createdAt) {
    events.push({
      timestamp: new Date(contract.createdAt),
      action: 'Tạo hợp đồng',
      icon: 'bi-file-earmark-plus',
      color: 'primary'
    });
  }

  if (contract.signedAt && contract.status === 'signed') {
    events.push({
      timestamp: new Date(contract.signedAt),
      action: 'Bên A ký xác nhận',
      icon: 'bi-file-earmark-check',
      color: 'success'
    });

    if (contract.signatureB) {
      const signedBTime = new Date(contract.signedAt);
      signedBTime.setMinutes(signedBTime.getMinutes() + 1); // Demo: sau 1 phút
      events.push({
        timestamp: signedBTime,
        action: 'Bên B ký xác nhận',
        icon: 'bi-file-earmark-check',
        color: 'success'
      });
    }
  }

  if (contract.status === 'signed') {
    const lockedTime = new Date(contract.signedAt);
    lockedTime.setMinutes(lockedTime.getMinutes() + 2); // Demo: sau 2 phút
    events.push({
      timestamp: lockedTime,
      action: 'Hợp đồng bị khoá - Không thể chỉnh sửa',
      icon: 'bi-lock-fill',
      color: 'danger'
    });
  }

  // Sort by timestamp
  events.sort((a, b) => a.timestamp - b.timestamp);

  return events;
};

// Nút Timeline
const timelineBtn = document.getElementById('timelineBtn');
timelineBtn?.addEventListener('click', () => {
  const currentId = document.getElementById('contractId')?.value || localStorage.getItem(currentContractKey) || '';
  const contract = currentId ? contracts.find(c => c.id === currentId) : null;

  const events = contract ? buildTimeline(contract) : [];
  const timelineContent = document.getElementById('timelineContent');
  
  if (!timelineContent) return;

  if (events.length === 0) {
    timelineContent.innerHTML = `
      <div class="text-center text-muted py-3">
        <i class="bi bi-hourglass-split"></i> Chưa có sự kiện
      </div>
    `;
  } else {
    timelineContent.innerHTML = events.map((event, idx) => `
      <div style="margin-bottom: 1.5rem; position: relative;">
        <div style="position: absolute; left: -30px; top: 0; width: 20px; height: 20px; border-radius: 50%; background: #${['primary', 'success', 'danger'].includes(event.color) ? (event.color === 'primary' ? '0d6efd' : event.color === 'success' ? '198754' : 'dc3545') : '6c757d'}; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;">
          <i class="bi ${event.icon}" style="font-size: 10px;"></i>
        </div>
        <div>
          <p style="font-weight: 600; margin: 0; color: #333;">${event.action}</p>
          <p style="font-size: 12px; color: #999; margin: 0.25rem 0;">
            ${event.timestamp.toLocaleString('vi-VN')}
          </p>
        </div>
      </div>
    `).join('');
  }

  const modal = new bootstrap.Modal(document.getElementById('timelineModal'));
  modal.show();
});

// Nút Ký & Khoá (Bên A) - owner finalizes and locks contract
const finalizeSignBtn = document.getElementById('finalizeSignBtn');
finalizeSignBtn?.addEventListener('click', () => {
  // Cần có chữ ký Bên A trước
  if (!signatureAImage) {
    alert('Vui lòng ký ở phần "Chữ ký Bên A" trước khi khóa hợp đồng.');
    return;
  }

  // Lưu hoặc cập nhật contract
  const existingId = document.getElementById('contractId')?.value || localStorage.getItem(currentContractKey) || '';
  const savedId = saveContractFromForm(existingId);

  // Đánh dấu signed (owner ký)
  const idx = contracts.findIndex(c => c.id === savedId);
  if (idx !== -1) {
    contracts[idx].status = 'signed';
    contracts[idx].signedAt = new Date().toISOString();
    localStorage.setItem(contractsKey, JSON.stringify(contracts));
  }

  lockForm(savedId);
  alert('Hợp đồng đã được ký bởi Bên A và khoá. Không thể chỉnh sửa nội dung nữa.');
});

// JSON handlers
document.getElementById('exportJsonBtn')?.addEventListener('click', exportToJSON);
document.getElementById('importJsonBtn')?.addEventListener('click', importFromJSON);
document.getElementById('jsonFileInput')?.addEventListener('change', handleJSONFileUpload);

// Quản lý hợp đồng
const manageContractsBtn = document.getElementById('manageContractsBtn');
const manageContractsModal = document.getElementById('manageContractsModal');
if (manageContractsBtn && manageContractsModal) {
  const modal = new bootstrap.Modal(manageContractsModal);
  manageContractsBtn.addEventListener('click', () => {
    loadSavedContracts();
    modal.show();
  });
}

// Chữ ký điện tử
let signatureAImage = null;
let signatureBImage = null;

const setupSignatureCanvas = (canvasId, clearBtnId) => {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#1d1f2c';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  
  const getMousePos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };
  
  const startDrawing = (e) => {
    isDrawing = true;
    const pos = getMousePos(e);
    lastX = pos.x;
    lastY = pos.y;
  };
  
  const draw = (e) => {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    lastX = pos.x;
    lastY = pos.y;
  };
  
  const stopDrawing = () => {
    if (isDrawing) {
      isDrawing = false;
      // Lưu chữ ký dưới dạng hình ảnh
      const imageData = canvas.toDataURL('image/png');
      if (canvasId === 'signatureCanvasA') {
        signatureAImage = imageData;
      } else {
        signatureBImage = imageData;
      }
      renderContract();
    }
  };
  
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);
  
  // Hỗ trợ cảm ứng
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  });
  
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  });
  
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
  });
  
  // Nút xóa
  const clearBtn = document.getElementById(clearBtnId);
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (canvasId === 'signatureCanvasA') {
        signatureAImage = null;
      } else {
        signatureBImage = null;
      }
      renderContract();
    });
  }
};

// Xử lý điều khoản có sẵn
const setupPresetHandlers = () => {
  const scopePreset = document.getElementById('scopePreset');
  const scopeTextarea = document.querySelector('[name="scope"]');
  const paymentPreset = document.getElementById('paymentPreset');
  const paymentTextarea = document.querySelector('[name="paymentTerms"]');
  const specialPreset = document.getElementById('specialPreset');
  const specialTextarea = document.querySelector('[name="specialTerms"]');
  
  if (scopePreset && scopeTextarea) {
    scopePreset.addEventListener('change', (e) => {
      if (e.target.value && presetTerms[e.target.value]) {
        const currentValue = scopeTextarea.value.trim();
        if (currentValue && !currentValue.includes(presetTerms[e.target.value])) {
          scopeTextarea.value = presetTerms[e.target.value] + '\n\n' + currentValue;
        } else {
          scopeTextarea.value = presetTerms[e.target.value];
        }
        renderContract();
        updateProgress();
      }
    });
  }
  
  if (paymentPreset && paymentTextarea) {
    paymentPreset.addEventListener('change', (e) => {
      if (e.target.value && presetTerms[e.target.value]) {
        const currentValue = paymentTextarea.value.trim();
        if (currentValue && !currentValue.includes(presetTerms[e.target.value])) {
          paymentTextarea.value = presetTerms[e.target.value] + '\n\n' + currentValue;
        } else {
          paymentTextarea.value = presetTerms[e.target.value];
        }
        renderContract();
        updateProgress();
      }
    });
  }
  
  if (specialPreset && specialTextarea) {
    specialPreset.addEventListener('change', (e) => {
      if (e.target.value && presetTerms[e.target.value]) {
        const currentValue = specialTextarea.value.trim();
        if (currentValue && !currentValue.includes(presetTerms[e.target.value])) {
          specialTextarea.value = presetTerms[e.target.value] + '\n\n' + currentValue;
        } else {
          specialTextarea.value = presetTerms[e.target.value];
        }
        renderContract();
        updateProgress();
      }
    });
  }
};

// Khởi tạo khi DOM đã load
document.addEventListener('DOMContentLoaded', () => {
  setTodayDate();
  if (preview) preview.innerHTML = emptyState;
  updateProgress();
  setupSignatureCanvas('signatureCanvasA', 'clearSignatureA');
  setupSignatureCanvas('signatureCanvasB', 'clearSignatureB');
  setupPresetHandlers();
  handleRemoteSigning();
  checkPermissions(); // Kiểm tra quyền khi load trang
  // Nếu có contract hiện tại và đã ký thì khoá giao diện
  const currentId = localStorage.getItem(currentContractKey);
  if (currentId) {
    const c = contracts.find(x => x.id === currentId);
    if (isContractSigned(c)) {
      // restore signatures to canvases if present
      if (c.signatureA) {
        signatureAImage = c.signatureA;
        const canvasA = document.getElementById('signatureCanvasA');
        if (canvasA) {
          const ctxA = canvasA.getContext('2d');
          const img = new Image();
          img.onload = () => ctxA.drawImage(img, 0, 0, canvasA.width, canvasA.height);
          img.src = c.signatureA;
        }
      }
      if (c.signatureB) {
        signatureBImage = c.signatureB;
        const canvasB = document.getElementById('signatureCanvasB');
        if (canvasB) {
          const ctxB = canvasB.getContext('2d');
          const img = new Image();
          img.onload = () => ctxB.drawImage(img, 0, 0, canvasB.width, canvasB.height);
          img.src = c.signatureB;
        }
      }
      lockForm(currentId);
    }
  }
});

// Cũng khởi tạo ngay nếu DOM đã sẵn sàng
if (document.readyState === 'loading') {
  // DOM chưa load xong, đã có event listener ở trên
} else {
  // DOM đã load xong
  setTodayDate();
  if (preview) preview.innerHTML = emptyState;
  updateProgress();
  setupSignatureCanvas('signatureCanvasA', 'clearSignatureA');
  setupSignatureCanvas('signatureCanvasB', 'clearSignatureB');
  setupPresetHandlers();
  handleRemoteSigning();
  checkPermissions(); // Kiểm tra quyền khi load trang
  // Nếu có contract hiện tại và đã ký thì khoá giao diện
  const currentId = localStorage.getItem(currentContractKey);
  if (currentId) {
    const c = contracts.find(x => x.id === currentId);
    if (isContractSigned(c)) {
      if (c.signatureA) {
        signatureAImage = c.signatureA;
        const canvasA = document.getElementById('signatureCanvasA');
        if (canvasA) {
          const ctxA = canvasA.getContext('2d');
          const img = new Image();
          img.onload = () => ctxA.drawImage(img, 0, 0, canvasA.width, canvasA.height);
          img.src = c.signatureA;
        }
      }
      if (c.signatureB) {
        signatureBImage = c.signatureB;
        const canvasB = document.getElementById('signatureCanvasB');
        if (canvasB) {
          const ctxB = canvasB.getContext('2d');
          const img = new Image();
          img.onload = () => ctxB.drawImage(img, 0, 0, canvasB.width, canvasB.height);
          img.src = c.signatureB;
        }
      }
      lockForm(currentId);
    }
  }
}

// ============================================================
// SETTINGS & UI HANDLERS
// ============================================================

// Dark Mode Toggle
document.getElementById('darkModeToggle')?.addEventListener('click', toggleDarkMode);

// Settings Button
document.getElementById('settingsBtn')?.addEventListener('click', () => {
  // Sync current settings to toggle switches before opening modal
  const autoSaveToggle = document.getElementById('autoSaveToggle');
  const notificationsToggle = document.getElementById('notificationsToggle');
  const keyboardShortcutsToggle = document.getElementById('keyboardShortcutsToggle');
  
  if (autoSaveToggle) autoSaveToggle.checked = settings.autoSave;
  if (notificationsToggle) notificationsToggle.checked = settings.notifications;
  if (keyboardShortcutsToggle) keyboardShortcutsToggle.checked = settings.keyboardShortcuts;
  
  const modal = new bootstrap.Modal(document.getElementById('settingsModal'));
  modal.show();
});

// Settings Toggles
document.getElementById('autoSaveToggle')?.addEventListener('change', (e) => {
  settings.autoSave = e.target.checked;
  localStorage.setItem('settingAutoSave', e.target.checked);
  showNotification(e.target.checked ? 'Auto-save bật' : 'Auto-save tắt', 'info');
});

document.getElementById('notificationsToggle')?.addEventListener('change', (e) => {
  settings.notifications = e.target.checked;
  localStorage.setItem('settingNotifications', e.target.checked);
});

document.getElementById('keyboardShortcutsToggle')?.addEventListener('change', (e) => {
  settings.keyboardShortcuts = e.target.checked;
  localStorage.setItem('settingKeyboardShortcuts', e.target.checked);
  showNotification(e.target.checked ? 'Phím tắt bật' : 'Phím tắt tắt', 'info');
});

// Clear Data
document.getElementById('clearDataBtn')?.addEventListener('click', () => {
  if (confirm('⚠️ Xóa tất cả dữ liệu hợp đồng? Hành động này không thể hoàn tác!')) {
    localStorage.clear();
    contracts = [];
    shareLinks = {};
    signatureAImage = null;
    signatureBImage = null;
    form.reset();
    preview.innerHTML = emptyState;
    updateProgress();
    showNotification('Đã xóa tất cả dữ liệu', 'success');
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
    if (modal) modal.hide();
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initKeyboardShortcuts();
  setTodayDate();
  if (preview) preview.innerHTML = emptyState;
  updateProgress();
  setupSignatureCanvas('signatureCanvasA', 'clearSignatureA');
  setupSignatureCanvas('signatureCanvasB', 'clearSignatureB');
  setupPresetHandlers();
  handleRemoteSigning();
  checkPermissions();
  
  // Auto-save event listeners
  form?.addEventListener('input', scheduleAutoSave);
  form?.addEventListener('change', scheduleAutoSave);
  
  // Current contract check
  const currentId = localStorage.getItem(currentContractKey);
  if (currentId) {
    const c = contracts.find(x => x.id === currentId);
    if (isContractSigned(c)) {
      if (c.signatureA) {
        signatureAImage = c.signatureA;
        const canvasA = document.getElementById('signatureCanvasA');
        if (canvasA) {
          const ctxA = canvasA.getContext('2d');
          const img = new Image();
          img.onload = () => ctxA.drawImage(img, 0, 0, canvasA.width, canvasA.height);
          img.src = c.signatureA;
        }
      }
      if (c.signatureB) {
        signatureBImage = c.signatureB;
        const canvasB = document.getElementById('signatureCanvasB');
        if (canvasB) {
          const ctxB = canvasB.getContext('2d');
          const img = new Image();
          img.onload = () => ctxB.drawImage(img, 0, 0, canvasB.width, canvasB.height);
          img.src = c.signatureB;
        }
      }
      lockForm(currentId);
    }
  }
});

if (document.readyState === 'loading') {
  // DOM chưa load xong
} else {
  // DOM đã load xong
  initDarkMode();
  initKeyboardShortcuts();
}
