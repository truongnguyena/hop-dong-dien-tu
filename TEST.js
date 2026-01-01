// Quick Test Script - Run in browser console
// Test each feature step by step

console.log('=== HỢP ĐỒNG ĐIỆN TỬ v2.0 - TEST SCRIPT ===\n');

// Test 1: Check if all main functions exist
console.log('✓ Test 1: Checking main functions...');
console.log('  - lockForm:', typeof lockForm === 'function');
console.log('  - unlockForm:', typeof unlockForm === 'function');
console.log('  - toggleDarkMode:', typeof toggleDarkMode === 'function');
console.log('  - showNotification:', typeof showNotification === 'function');
console.log('  - setupSignatureCanvas:', typeof setupSignatureCanvas === 'function');

// Test 2: Check settings
console.log('\n✓ Test 2: Checking settings...');
console.log('  - autoSave:', settings.autoSave);
console.log('  - notifications:', settings.notifications);
console.log('  - keyboardShortcuts:', settings.keyboardShortcuts);
console.log('  - darkMode:', settings.darkMode);

// Test 3: Check localStorage
console.log('\n✓ Test 3: Checking localStorage...');
console.log('  - settingAutoSave:', localStorage.getItem('settingAutoSave'));
console.log('  - settingNotifications:', localStorage.getItem('settingNotifications'));
console.log('  - settingKeyboardShortcuts:', localStorage.getItem('settingKeyboardShortcuts'));
console.log('  - settingDarkMode:', localStorage.getItem('settingDarkMode'));

// Test 4: Check canvas
console.log('\n✓ Test 4: Checking signature canvas...');
const canvasA = document.getElementById('signatureCanvasA');
const canvasB = document.getElementById('signatureCanvasB');
console.log('  - Canvas A exists:', !!canvasA);
console.log('  - Canvas B exists:', !!canvasB);
console.log('  - Canvas A pointerEvents:', window.getComputedStyle(canvasA).pointerEvents);
console.log('  - Canvas B pointerEvents:', window.getComputedStyle(canvasB).pointerEvents);

// Test 5: Check form state
console.log('\n✓ Test 5: Checking form state...');
const form = document.getElementById('contractBuilder');
const inputs = form.querySelectorAll('input, select, textarea');
const disabledInputs = Array.from(inputs).filter(el => el.disabled);
console.log('  - Total inputs:', inputs.length);
console.log('  - Disabled inputs:', disabledInputs.length);
console.log('  - Form is locked:', disabledInputs.length > 0);

console.log('\n=== TEST COMPLETE ===');
console.log('Now try:');
console.log('1. Fill form and wait 30 seconds (auto-save should trigger)');
console.log('2. Press Ctrl+S to save draft');
console.log('3. Press Ctrl+O to load contract');
console.log('4. Draw signature on both canvases');
console.log('5. Click "Ký kết" to sign');
console.log('6. Check that form is now locked');
console.log('7. Press Ctrl+Shift+D to create new draft');
console.log('8. Verify you can draw signatures again');
