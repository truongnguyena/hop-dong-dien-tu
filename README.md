# Hợp Đồng Điện Tử (Electronic Contract System)

**Phiên bản:** 2.0.0 ✨ (Nâng cấp bảo mật & tính năng)

Ứng dụng web cho phép tạo, ký, và quản lý hợp đồng điện tử với tính năng bảo mật cao, con dấu điện tử, xác minh checksum, và QR code.

---

## 🎯 Tính Năng Chính

### ✍️ Tạo Hợp Đồng
- Form điền thông tin đầy đủ cho cả hai bên
- Xem trước hợp đồng real-time
- Lưu bản nháp và khôi phục
- Hỗ trợ ký từ xa (remote signing)

### 🔐 Bảo Mật & Ký Số
- **Ký điện tử**: Vẽ chữ ký trên canvas
- **Con Dấu Điện Tử (NEW)**: Dấu tròn tự động với công ty & chức vụ
- **Checksum SHA-256 (NEW)**: Xác minh tính toàn vẹn hợp đồng
- **QR Code (NEW)**: Quét để kiểm tra hợp đồng
- **Watermark (NEW)**: Hiệu ứng trực quan "ĐÃ KÝ & KHOÁ"
- **Lock Contract (NEW)**: Khóa vĩnh viễn, không thể chỉnh sửa

### 📊 Quản Lý & Xuất
- **Timeline (NEW)**: Lịch sử đầy đủ của các sự kiện
- **PDF Export (NEW)**: Xuất PDF kèm dấu + watermark + checksum
- **JSON Export/Import**: Lưu trữ và chia sẻ dễ dàng
- **Manage Contracts**: Danh sách các hợp đồng đã lưu

### 🌐 Ký Từ Xa
- Tạo link chia sẻ cho Bên B
- Bên B ký qua link, không cần tài khoản
- Chia sẻ qua Email, WhatsApp, Zalo

---

## 🚀 Bắt Đầu Nhanh

### Cài Đặt
```bash
git clone https://github.com/truongnguyena/hop-dong-dien-tu.git
cd hop-dong-dien-tu
# Mở file index.html trong trình duyệt
```

### Không Cần Backend
- Ứng dụng hoạt động 100% trên trình duyệt
- Dữ liệu lưu trong localStorage (máy tính cá nhân)
- Không cần server hoặc API

---

## 📖 Hướng Dẫn Sử Dụng

### 1. Tạo Hợp Đồng
1. Điền thông tin hai bên, loại hợp đồng, giá trị
2. Nhập tên công ty & chức vụ (sẽ tạo dấu tự động)
3. Điền các điều khoản (scope, payment, special terms)
4. Bấm "Tạo hợp đồng" để xem trước

### 2. Ký Hợp Đồng
1. Vẽ chữ ký Bên A trên canvas
2. Nếu cần: vẽ chữ ký Bên B
3. Bấm "Ký & Khoá (Bên A)" để khóa hợp đồng vĩnh viễn

### 3. Xác Minh Hợp Đồng (NEW)
1. Bấm nút "Xác minh" (Verify)
2. Xem Checksum SHA-256 và QR code
3. Copy checksum để lưu trữ an toàn
4. Chia sẻ QR code cùng hợp đồng

### 4. Xuất PDF
1. Bấm "Xuất PDF"
2. PDF sẽ chứa:
   - Con dấu điện tử
   - Watermark "ĐÃ KÝ" (nếu đã ký)
   - Checksum SHA-256
   - Thông tin hệ thống & thời gian

### 5. Xem Timeline (NEW)
1. Bấm "Timeline"
2. Xem lịch sử đầy đủ: tạo → ký A → ký B → khóa
3. Timestamps chính xác cho mỗi sự kiện

### 6. Ký Từ Xa
1. Bật "Ký từ xa" trong form
2. Bấm "Link ký từ xa"
3. Sao chép link, gửi cho Bên B
4. Bên B ký qua link (không cần tài khoản)

---

## 🎨 Tính Năng Nâng Cấp v2.0

| Tính Năng | Mô Tả | Tác Dụng |
|-----------|-------|---------|
| **Con Dấu Điện Tử** | Dấu tròn hình anime với tên công ty | Tăng độ tin cậy & chuyên nghiệp |
| **Checksum SHA-256** | Hash từ nội dung hợp đồng | Xác minh không bị sửa đổi |
| **QR Code** | QR từ checksum | Quét để kiểm tra nhanh |
| **Watermark** | "ĐÃ KÝ & KHOÁ" trên PDF | Hiệu ứng trực quan |
| **Lock Contract** | Vô hiệu hóa mọi input sau ký | Ngăn sửa đổi vô tình |
| **Timeline** | Lịch sử sự kiện | Audit trail đầy đủ |
| **PDF Nâng Cao** | Export kèm dấu + watermark + hash | Xuất chuyên nghiệp |

---

## 💾 Cấu Trúc Dữ Liệu

### Lưu Trữ
```
localStorage:
├── eContractDraft          // Bản nháp hiện tại
├── eContracts              // Danh sách hợp đồng lưu
├── eContractShareLinks     // Link chia sẻ & QR
├── eContractOwner          // Thông tin chủ sở hữu
└── eCurrentContractId      // ID hợp đồng đang làm
```

### Contract Object
```javascript
{
  id: "contract_1735760123456_abc123",
  partyAName, partyAId, partyAAddress,
  partyBName, partyBId, partyBAddress,
  stampCompanyA, stampPositionA,
  stampCompanyB, stampPositionB,
  stampA, stampB,              // Hình ảnh dấu
  contractHash: "sha256...",   // Checksum
  signatureA, signatureB,      // Base64 chữ ký
  status: "draft" | "signed",
  createdAt, signedAt,
  contractType, contractValue,
  scope, paymentTerms, specialTerms
}
```

---

## 🔒 Bảo Mật

### ✅ Client-Side (Đã Cài Đặt)
- SHA-256 hash via Web Crypto API
- Watermark & lock UI ngăn sửa đổi
- localStorage lưu an toàn (trình duyệt quản lý)

### ⚠️ Hạn Chế
- Không ngăn được sửa localStorage nếu có quyền trực tiếp
- Chữ ký là hình ảnh PNG, không phải digital signature thực
- Chưa có server-side verification

### 🎯 Khuyến Cáo (Tương Lai)
- Tích hợp backend để lưu & hash trên server
- Sử dụng digital signature (RSA/ECDSA)
- Blockchain integration cho high-value contracts
- 2FA cho owner authentication

---

## 🛠️ Công Nghệ

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 5.3 (UI Framework)
- Bootstrap Icons
- QR Code Library
- Web Crypto API (SHA-256)

**Storage:**
- localStorage (Browser)
- No Backend Required

**Browser Compatibility:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 📁 Cấu Trúc Thư Mục

```
hop-dong-dien-tu/
├── index.html           # Main UI
├── script.js            # Logic & Features (1600+ lines)
├── styles.css           # Styling
├── README.md            # Tài liệu này
├── FEATURES.md          # Danh sách tính năng chi tiết
└── .git/                # Version control
```

---

## 🐛 Xử Sự Cố

| Vấn Đề | Giải Pháp |
|--------|----------|
| Chữ ký không hiển thị | Kiểm tra canvas có được render không (F12) |
| QR code lỗi | Cài lại thư viện qrcodejs hoặc reload trang |
| localStorage đầy | Xóa bản nháp cũ hoặc clear cache |
| Hợp đồng khóa nhưng vẫn có thể edit | Reload trang, check console errors |

### Debug
```javascript
// Console (Ctrl+Shift+K)
localStorage.getItem('eContracts')        // Xem hợp đồng
localStorage.getItem('eCurrentContractId') // ID hiện tại
contracts                                  // Array hợp đồng
Object.keys(localStorage)                 // Tất cả keys
```

---

## 📝 Ví Dụ JSON Export

```json
{
  "id": "contract_1735760123456_abc123",
  "partyAName": "Công ty ABC",
  "partyBName": "Công ty XYZ",
  "contractType": "Cung cấp dịch vụ",
  "contractValue": "5000000000",
  "stampCompanyA": "Công ty TNHH ABC",
  "stampPositionA": "Tổng Giám Đốc",
  "stampA": "data:image/png;base64,...",
  "status": "signed",
  "createdAt": "2026-01-01T10:30:00Z",
  "signedAt": "2026-01-01T10:45:00Z",
  "contractHash": "abc123def456...",
  "exportedAt": "2026-01-01T10:50:00Z",
  "version": "1.0"
}
```

---

## 🌍 Triển Khai

### Local Deployment
```bash
# Chỉ cần mở index.html trong trình duyệt
# Hoặc chạy local server:
python -m http.server 8000
# http://localhost:8000
```

### Online Deployment
- **Netlify**: Kéo thả thư mục → Deploy
- **GitHub Pages**: Push lên repo → Enable Pages
- **Vercel**: Connect repo → Auto-deploy
- **Any Web Host**: Upload 3 file (index.html, script.js, styles.css)

---

## 📊 Thống Kê

- **Lines of Code**: ~1600 (script.js)
- **Number of Features**: 8+ chính
- **Browser Support**: 4+ modern browsers
- **Performance**: < 500ms PDF export
- **Storage**: ~100KB per contract (localStorage)

---

## 🎓 Học Tập

Tài liệu để hiểu code:
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Bootstrap 5](https://getbootstrap.com/)

---

## 🤝 Đóng Góp

Bạn có thể:
1. Fork repository
2. Tạo branch cho feature mới
3. Commit với message rõ ràng
4. Push lên GitHub
5. Tạo Pull Request

---

## 📄 License

MIT License - Tự do sử dụng, sửa đổi, phân phối

---

## 📞 Liên Hệ & Support

- **GitHub**: github.com/truongnguyena/hop-dong-dien-tu
- **Issues**: Báo cáo lỗi tại GitHub Issues
- **Email**: Thông qua GitHub profile

---

## 🙏 Cảm Ơn

- Bootstrap team for UI framework
- QR Code JS library
- All contributors & users

---

**Phiên bản**: 2.0.0  
**Ngày cập nhật**: 2026-01-01  
**Trạng thái**: ✅ Stable & Production Ready
