# Testing Checklist - v2.0 Features

## ✅ Completed Features

### 1. Dark Mode Toggle
- [x] Dark mode button visible in hero header (top right with moon icon)
- [x] CSS variables updated for dark theme
- [x] Bootstrap data-bs-theme attribute applied
- [x] Dark mode persists in localStorage (settingDarkMode)
- [x] All colors update when toggled
- [x] Form controls styled for dark mode
- [x] Modals styled for dark mode

### 2. Settings Modal
- [x] Settings button visible in hero header
- [x] Modal opens with 4 toggle options
- [x] Auto-Save toggle
- [x] Notifications toggle
- [x] Keyboard Shortcuts toggle
- [x] Clear Data button with confirmation
- [x] Settings sync to toggles when modal opens
- [x] Settings persist in localStorage

### 3. Auto-Save Feature
- [x] Debounced 30-second auto-save
- [x] Respects autoSave setting
- [x] Toast notification on auto-save
- [x] Event listeners on form input/change
- [x] Saves to localStorage with contract data

### 4. Keyboard Shortcuts
- [x] Ctrl+S: Save Draft
- [x] Ctrl+O: Load/Open Contract
- [x] Ctrl+Shift+D: New Draft (reset form)
- [x] Ctrl+,: Open Settings
- [x] Respects keyboardShortcuts setting
- [x] Shows toast notification on shortcut use

### 5. Toast Notifications
- [x] showNotification() utility function
- [x] Success, Error, Info types
- [x] Respects notifications setting
- [x] Bootstrap styled container
- [x] Auto-dismiss with duration control
- [x] Fixed position in viewport

### 6. Input Validation & XSS Prevention
- [x] validateInput() function with HTML escaping
- [x] Prevents XSS attacks in inputs

### 7. Error Handling
- [x] Try-catch blocks in major functions
- [x] saveDraft wrapped in error handling
- [x] loadDraft wrapped in error handling
- [x] copyContract wrapped in error handling
- [x] exportContract wrapped in error handling

### 8. Digital Stamp (Existing)
- [x] createStamp() generates circular 150x150px PNG
- [x] Includes company name and position
- [x] Animated and colored
- [x] Base64 encoded
- [x] Displays on contract preview

### 9. Contract Locking (Existing)
- [x] lockForm() disables all inputs after signing
- [x] Hides clear signature buttons
- [x] Shows lock badge
- [x] Displays watermark "✓ ĐÃ KÝ"

### 10. Checksum Verification (Existing)
- [x] computeContractHash() uses SHA-256
- [x] Displays in verification modal
- [x] Included in PDF export

### 11. QR Code (Existing)
- [x] QR Code JS library integrated
- [x] Generates QR code for contract verification
- [x] Displays in verification modal

## 🧪 Testing Instructions

### Test Dark Mode
1. Click the moon icon in hero header
2. Verify all colors change to dark theme
3. Refresh page - dark mode should persist
4. Open Settings modal - verify toggle is checked
5. Click toggle to switch modes

### Test Settings Modal
1. Click settings icon in hero header
2. Verify all toggle states match current settings
3. Toggle "Auto-save" - should show notification
4. Toggle "Phím tắt" - should show notification
5. Click "Xóa tất cả dữ liệu" - should ask for confirmation
6. Refresh page - settings should persist

### Test Auto-Save
1. Fill in contract information (Tên bên A, etc.)
2. Wait 30 seconds
3. Check browser console: should see "Bản nháp đã lưu tự động" notification
4. Open DevTools → Application → localStorage
5. Should see 'contracts' key with contract data
6. Refresh page - data should be restored

### Test Keyboard Shortcuts
1. Fill in form with some data
2. Press **Ctrl+S** - should show "Bản nháp đã lưu" notification
3. Press **Ctrl+O** - should open manage contracts modal
4. Press **Ctrl+Shift+D** - form should reset to empty
5. Press **Ctrl+,** - should open settings modal
6. Disable shortcuts in Settings, test again (should not work)

### Test Toast Notifications
1. Perform any action that triggers notification (save, auto-save, toggle, etc.)
2. Verify toast appears in bottom-right corner
3. Verify it auto-dismisses after 3 seconds
4. Disable notifications in Settings
5. Perform action again - should not show toast

### Test Contract Stamp
1. Fill in "Công ty A" and "Vị trí A" in stamp section
2. Click "Tạo con dấu A"
3. Verify circular stamp appears with company name
4. Click preview button - stamp should show in contract
5. Repeat for Bên B

### Test Contract Locking
1. Fill in contract information
2. Draw signature on canvas A
3. Draw signature on canvas B
4. Click "Ký kết" button
5. Verify all form inputs become disabled
6. Verify "Đã kí" lock badge appears
7. Verify watermark "✓ ĐÃ KÝ" appears on contract
8. Refresh page - locked state should persist

### Test Checksum & Verification
1. Create and sign a contract (steps above)
2. Click "Xác minh" button
3. Verify SHA-256 checksum displays
4. Verify QR code displays
5. Edit localStorage to change checksum manually
6. Note: Current verification is display-only (UI enhancement feature)

### Test PDF Export
1. Create a signed contract with stamps
2. Click "Xuất PDF"
3. Verify PDF opens in print dialog
4. In print preview, verify:
   - Watermark "✓ ĐÃ KÝ" appears (semi-transparent)
   - Checksum SHA-256 displays
   - Stamps display correctly
   - Contract content displays
   - Footer with generation date appears

## 📝 Known Limitations

- PDF export is via print dialog (not direct download)
- Checksum verification is display-only (no actual validation on load)
- Keyboard shortcuts use global listeners (may conflict with browser shortcuts)
- Dark mode uses CSS variables (requires modern browser support)
- All data stored in localStorage (subject to storage limits, no cloud sync)

## 🔄 Settings Persistence

Settings stored in localStorage:
- `settingAutoSave`: boolean
- `settingNotifications`: boolean
- `settingKeyboardShortcuts`: boolean
- `settingDarkMode`: boolean

Contract data stored in localStorage:
- `contracts`: array of contract objects
- `currentContract`: current contract ID
- `shareLinks`: object with share link mappings

