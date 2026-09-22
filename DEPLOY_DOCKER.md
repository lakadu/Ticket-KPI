# Deploy Lokal / Produksi dengan Docker

Stack ini berjalan sebagai 3 container:

| Service   | Teknologi            | Keterangan                                            |
|-----------|----------------------|-------------------------------------------------------|
| `mongo`   | MongoDB 7            | Database, data disimpan di volume `mongo_data`        |
| `backend` | FastAPI + Uvicorn    | API di `/api`, internal port 8001                     |
| `frontend`| React build + Nginx  | Menyajikan UI + proxy `/api` ke backend (same-origin) |

Karena Nginx menyajikan UI **dan** mem-proxy `/api` ke backend, semuanya
berada pada origin yang sama sehingga cookie auth (httpOnly) bekerja tanpa CORS.

---

## 1. Prasyarat
- Docker Engine 20+ dan Docker Compose v2 (`docker compose`).

## 2. Konfigurasi
```bash
cp .env.docker.example .env
```
Edit `.env` dan **wajib** ganti minimal:
- `JWT_SECRET` (mis. `openssl rand -hex 32`)
- `ADMIN_PASSWORD`
- `WEBHOOK_CRON_SECRET`

Pilihan penting:
- `SEED_DEMO=false` → database bersih (hanya akun admin dibuat). Set `true` bila ingin akun & tiket contoh.
- `APP_PORT=8080` → port di host Anda.

## 3. Build & Jalankan
```bash
docker compose up -d --build
```
Cek status:
```bash
docker compose ps
docker compose logs -f backend
```

Buka: **http://localhost:8080**

Login admin sesuai `ADMIN_EMAIL` / `ADMIN_PASSWORD` di `.env`.
(Jika `SEED_DEMO=true`, akun demo memakai password `password123`.)

## 4. Perintah Umum
```bash
docker compose down            # stop (data tetap ada di volume)
docker compose down -v         # stop + HAPUS data database
docker compose up -d --build   # rebuild setelah update kode
docker compose restart backend # restart 1 service
```

## 5. Produksi di belakang HTTPS
Bila Anda menaruh reverse proxy TLS (mis. Caddy/Traefik/Nginx) di depan port `APP_PORT`:
1. Set `COOKIE_SECURE=true` di `.env`.
2. `COOKIE_SAMESITE=lax` (biarkan) untuk domain yang sama.
3. Rebuild: `docker compose up -d --build`.

## 6. Backup Database
```bash
# Dump
docker compose exec mongo mongodump --db itsm_kpi_db --archive=/data/db/backup.archive
docker cp $(docker compose ps -q mongo):/data/db/backup.archive ./backup.archive

# Restore
docker cp ./backup.archive $(docker compose ps -q mongo):/data/db/backup.archive
docker compose exec mongo mongorestore --archive=/data/db/backup.archive
```

## Catatan
- Backend membaca konfigurasi dari environment (di-inject compose); file `.env` lokal di `backend/` tidak ikut ter-build ke image.
- `REACT_APP_BACKEND_URL` dibiarkan kosong saat build agar frontend memanggil `/api` relatif (di-proxy Nginx). Jangan set ke URL absolut kecuali Anda tahu konsekuensinya terhadap cookie.
