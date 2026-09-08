# 📘 ServiceOps — Panduan Alur Aplikasi

Panduan lengkap alur kerja **IT Ticketing & KPI Management System**.

---

## 1. Peta Aplikasi (High-Level)

```
┌──────────┐      ┌──────────┐      ┌──────────────┐      ┌──────────┐
│ Customer │ ───► │  Ticket  │ ───► │ Assignment   │ ───► │Technician│
└──────────┘      └──────────┘      │ (Primary +   │      │  Bekerja │
                                    │ Collaborators)│      └────┬─────┘
                                    └──────────────┘           │
                                                               ▼
┌──────────┐      ┌──────────┐      ┌──────────────┐      ┌──────────┐
│Dashboard │ ◄─── │   KPI    │ ◄─── │  Resolution  │ ◄─── │   SLA    │
│ + Report │      │ Score /  │      │  + Rating    │      │ Tracking │
└──────────┘      │ Leaderb. │      └──────────────┘      └──────────┘
                  └──────────┘
```

Data ticket = **satu-satunya sumber** perhitungan KPI. Tidak ada input manual → semua penilaian dapat diaudit.

---

## 2. Role & Hak Akses

| Role | Login | Bisa Lihat | Bisa Lakukan |
|---|---|---|---|
| **Admin** | `admin / admin123` | Semua | Full CRUD user, category, SLA, KPI config, integrations, semua ticket |
| **Manager** | `manager / password123` | Semua | Sama seperti Admin kecuali hapus admin. Trigger KPI snapshot, digest preview |
| **Supervisor** | `supervisor / password123` | Semua ticket & team | Assign ticket, tambah/hapus collaborator, monitor tim, tidak edit config |
| **Technician** | `tech1 / password123` | Ticket yang diassign ke dirinya (primary OR collaborator) + unassigned | Update status, resolve, isi dokumentasi. Lihat leaderboard & KPI diri sendiri |
| **Customer** | `customer1 / password123` | Ticket sendiri | Buat ticket, lihat status, kasih rating 1–5 setelah resolved |

Halaman **Public Status** (`/status`) → tidak butuh login.

---

## 3. Alur End-to-End: Sebuah Ticket dari Lahir sampai Tutup

### Langkah 1 — Customer membuat Ticket
`Login sebagai customer1` → **New Ticket** → isi Subject, Description, Priority, Category, upload attachment (auto-compressed <600 KB).

Sistem otomatis:
- Generate nomor: `TKT-YYYY-00001`
- Set `status = Open`, `weight` berdasarkan priority (Critical=5, High=3, Medium=2, Low=1)
- Set SLA target berdasarkan rules di Settings (ex: Critical → 15 menit response, 4 jam resolution)
- Tulis activity `created` di timeline
- Tulis audit log

### Langkah 2 — Supervisor / Manager melakukan Assignment
`Login sebagai supervisor` → **Tickets** → klik ticket **Open** → **Assign Technician**.

Ada 2 pilihan dalam dialog:
- **Primary (PIC)** — teknisi utama, pemilik SLA & penerima rating utama
- **Collaborators (optional)** — checklist teknisi lain yang membantu

Setelah assign:
- `technician_id` di-set ke PIC, `technicians[]` = `[PIC, ...collaborators]`
- Status berubah ke **Assigned**, timestamp `assigned_at` tercatat
- Timeline: `Assigned to <PIC> (+N collaborators)`
- Notifikasi Telegram/WhatsApp otomatis terkirim (kalau token diisi di Settings)

Bisa menambah collaborator kemudian → tombol **Add Collaborator** di panel Assignment.

### Langkah 3 — Technician mulai bekerja
`Login sebagai tech1` → **Tickets** → buka ticket → panel **Change Status**:
- Klik **On Progress** → sistem set `first_response_at` & `start_work_at` = sekarang (kalau belum). Ini yang dipakai untuk hitung **Response Time**.
- Klik **Pending** kalau sedang menunggu pihak lain.

Setiap collaborator (bukan hanya PIC) boleh update status.

### Langkah 4 — Selama bekerja: SLA berjalan
Setiap ~30 menit, cron **sla-warning-check** memindai semua ticket open:
- Age ≥ 75% target resolution → **⚠️ SLA WARNING** dikirim ke Telegram/WhatsApp
- Age ≥ 100% target → **🚨 SLA VIOLATION — ESCALATED**
  - `escalated = true`, `escalated_to = supervisor_pertama_yang_aktif`
  - Timeline entry `Auto-escalated to <supervisor> — SLA breached`
  - Badge merah **⚡ Escalated** muncul di ticket detail

Dedup: satu ticket cuma dapat 1 warning + 1 violation, tidak spam.

### Langkah 5 — Resolve Ticket
Technician klik **Resolve Ticket** → dialog wajib isi:
- **Root Cause** — penyebab masalah
- **Resolution / Action** — apa yang dikerjakan
- **Technician Notes** — catatan tambahan
- ☑ **Documentation complete** — checklist untuk KPI dokumentasi

Sistem set `status = Resolved`, `resolved_at = sekarang`. Timeline `resolved`. SLA compliance dihitung.

### Langkah 6 — Customer memberi Rating
`Login sebagai customer1` → buka ticket resolved → **Rate 1–5 stars** + optional feedback → submit.

Otomatis:
- `rating` disimpan, ticket berubah ke **Closed**, `closed_at` tercatat
- Timeline `rated`
- Rating masuk ke KPI teknisi

### Langkah 7 — Kalau masalah kembali → Reopen
Admin/Manager/Supervisor klik **Reopen Ticket** → `reopen_count += 1`, `resolved_at` di-reset, status = **Reopened**. Reopen rate menurunkan skor KPI.

---

## 4. Modul-Modul (Sidebar)

### 🏠 Dashboard
Cards: Total / Open / On Progress / Resolved / Closed / Reopened
Metrics: SLA Compliance %, Avg Response, Avg Resolution, Avg Rating
Charts: per bulan, per priority, per category, per technician, ticket aging, top 3 performer.
Bisa difilter (dalam pengembangan lanjut).

### 🎫 Tickets
List semua ticket dengan filter (status, priority) + search + pagination.
Klik row → **Ticket Detail** (deskripsi, timeline, SLA card, resolution, rating, actions).

### ➕ New Ticket
Form buat ticket + upload attachment (client-side compression via `browser-image-compression`).

### 📈 KPI Scores
Tab **Current Period** — tabel KPI live (Total ticket, Weighted Point, SLA %, Response, Resolution, Reopen %, Rating, KPI Score, Performance).
Tab **Monthly History** — trend chart per teknisi dari snapshot bulanan.
Admin/Manager punya tombol **Snapshot This Month** untuk trigger manual.

### 🏆 Leaderboard
Podium 🥇🥈🥉 + full ranking dengan progress bar. Visible untuk semua role (termasuk customer).

### 📊 Reports
Tab **KPI**, **Tickets**, **SLA** → export CSV atau PDF dengan filter periode.
Tab **Weekly Digest** → preview isi pesan yang akan dikirim otomatis tiap Senin 08:00 UTC.

### 👥 Users / Customers
CRUD user; Users = semua role kecuali customer, Customers = list role=customer.

### 🏷️ Categories
CRUD kategori & subkategori.

### ⚙️ Settings
- Tab **SLA Rules** — set response & resolution time (menit) per priority
- Tab **KPI Config** — set weight tiap komponen (harus total 100%), threshold Excellent/Good/Fair, target productivity
- Tab **Integrations** — isi Telegram Bot Token + Chat ID, WhatsApp provider (fonnte/wablas/twilio) + API key + sender number. Tombol **Send Test Notification**.

### 📜 Audit Log
Semua aksi kritikal (login, create, assign, status change, resolve, escalation, KPI config change) tercatat lengkap dengan user & timestamp.

---

## 5. Business Rules Penting

### SLA
Response time = `first_response_at − created_at`
Resolution time = `resolved_at − created_at`
Compliance = `response ≤ target_response` **DAN** `resolution ≤ target_resolution`

Indikator warna:
- 🟢 Green = on track / met
- 🟡 Yellow = warning (≥75% waktu terpakai)
- 🔴 Red = violated

### Weighted Points
Priority: Low=1, Medium=2, High=3, Critical=5.
Kalau ticket punya N teknisi → point dibagi rata `weight / N` supaya adil (collaborator dapat kredit, total system tetap).

### KPI Score (default weights, bisa diubah di Settings)
| Komponen | Bobot | Cara Hitung |
|---|---|---|
| SLA Compliance | 25% | % ticket memenuhi kedua SLA |
| Productivity | 20% | `weighted_point / productivity_target * 100` |
| Response Time | 15% | rasio target/aktual (semakin cepat semakin tinggi) |
| Resolution Time | 15% | rasio target/aktual |
| Reopen Rate | 10% | `100 − (reopen_rate × 5)` |
| Customer Rating | 10% | `avg_rating / 5 × 100` |
| Documentation | 5% | % resolved dengan `documentation_complete = true` |

Kategori: **≥90 Excellent, ≥80 Good, ≥70 Fair, <70 Needs Improvement** (threshold configurable).

### Auto-Escalation
Tiap 30 menit, cron scan open ticket → yang breached (`age ≥ resolution_target`) & belum di-escalate → `escalated=true`, assign supervisor pertama yang aktif, notif dikirim, badge muncul di UI.

### Multi-Technician
- `technician_id` = Primary/PIC (owner SLA & rating)
- `technicians[]` = semua yang menangani (Primary + Collaborators)
- Setiap teknisi di `technicians[]` boleh update status/resolve
- Hanya Admin/Manager/Supervisor bisa tambah/hapus collaborator
- KPI include semua ticket dimana teknisi jadi Primary atau Collaborator

---

## 6. Notifikasi (Telegram + WhatsApp)

Trigger:
1. **Ticket assigned** — kirim ke channel `Ticket Assigned`
2. **SLA Warning** (age ≥75%) — kirim `⚠️ SLA WARNING`
3. **SLA Violation + auto-escalation** — kirim `🚨 SLA VIOLATION — ESCALATED`
4. **Weekly Digest** setiap Senin 08:00 UTC — top performers + total ticket

Config di **Settings → Integrations**. Kosongkan token = silent (no-op, tidak error).

Provider WhatsApp yang didukung: **Fonnte** (Indonesia), **Wablas**, **Twilio WhatsApp Business**.

---

## 7. Cron Jobs (`.emergent/crons.yml`)

| Nama | Jadwal | Endpoint | Fungsi |
|---|---|---|---|
| kpi-monthly-snapshot | 1st tiap bulan, 01:00 UTC | `/api/cron/kpi-snapshot` | Simpan KPI per teknisi bulan lalu ke `kpi_snapshots` |
| sla-warning-check | Setiap 30 menit | `/api/cron/sla-check` | Scan ticket, kirim SLA warning/violation, auto-escalate |
| weekly-digest | Senin 08:00 UTC | `/api/cron/weekly-digest` | Kirim ringkasan mingguan ke Telegram/WhatsApp |

Semua endpoint pakai `Bearer WEBHOOK_CRON_SECRET`, ack 2xx cepat, kerja di background.

---

## 8. Data Model (MongoDB Collections)

```
users              → {id, email, username, name, role, department, phone, active, password_hash, created_at}
categories         → {id, name, subcategories:[], created_at}
tickets            → {id, number, subject, description, customer_id, department,
                       category_id, subcategory, priority, status,
                       technician_id, technicians:[],
                       created_at, assigned_at, first_response_at, start_work_at,
                       resolved_at, closed_at,
                       root_cause, resolution, technician_notes, documentation_complete,
                       attachments:[], rating, feedback,
                       reopen_count, escalated, escalated_at, escalated_to}
ticket_activities  → {id, ticket_id, user_id, type, description, timestamp}
settings           → {key, value}   -- 'sla_rules' | 'kpi_config' | 'integrations'
kpi_snapshots      → {technician_id, period:'YYYY-MM', kpi_score, ...} (upsert by tech+period)
audit_logs         → {id, user_id, action, entity, entity_id, meta, timestamp}
notify_dedup       → {key, created_at}   -- untuk dedup SLA alerts
digest_history     → {id, run_id, period_start, period_end, ..., message, created_at}
counters           → {key:'ticket_YYYY', seq}  -- untuk penomoran ticket
```

---

## 9. Quick Cheat-Sheet: Skenario Umum

| Yang mau dilakukan | Langkahnya |
|---|---|
| Customer buat komplain | Login customer → New Ticket → isi form → Submit |
| Supervisor assign ke tim | Ticket detail → Assign Technician → pilih PIC + centang collaborator → Assign |
| Tambah teknisi ke ticket yang sudah jalan | Ticket detail → Add Collaborator → pilih → Add |
| Ganti PIC | Assign Technician ulang dengan primary baru |
| Technician mulai kerja | Ticket detail → Change Status → **On Progress** |
| Technician selesai | Ticket detail → **Resolve Ticket** → isi form root cause + resolution + centang doc |
| Customer kasih rating | Login customer → buka ticket Resolved → klik bintang + feedback → Submit |
| Reopen ticket | Admin/Manager/Supervisor → ticket Closed → **Reopen Ticket** |
| Lihat KPI teknisi | KPI Scores tab Current Period, atau Leaderboard |
| Lihat trend KPI bulanan | KPI Scores tab Monthly History (chart + tabel) |
| Trigger snapshot manual | KPI Scores → tombol **Snapshot This Month** |
| Export laporan | Reports → pilih tab → set filter periode → tombol CSV/PDF |
| Setup notifikasi | Settings → Integrations → isi token → Save → **Send Test Notification** |
| Ubah SLA target | Settings → SLA Rules → edit angka menit → Save |
| Ubah bobot KPI | Settings → KPI Config → total harus 100% → Save |
| Audit siapa melakukan apa | Audit Log |
| Cek status untuk publik | buka `/status` (tanpa login) |

---

## 10. Test Credentials (Demo)

Buka `/login` → klik salah satu tombol demo di kanan bawah untuk auto-fill:

```
Admin        admin       / admin123
Manager      manager     / password123
Supervisor   supervisor  / password123
Technician   tech1       / password123   (juga tech2, tech3)
Customer     customer1   / password123   (juga customer2)
```

Password bisa juga login pakai email (contoh `admin@itsm.local`).

---

Semua flow di atas dapat diaudit lewat **Audit Log** dan **Ticket Timeline** — setiap perubahan tercatat lengkap dengan siapa & kapan.
