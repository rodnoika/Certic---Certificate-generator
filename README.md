# Certic - Certificate Generator

Генератор сертификатов с настраиваемыми полями | Certificate generator with customizable fields

## Запуск | Setup

```bash
npm install

npm run dev
```

## Настройка полей на шаблоне | Template Field Setup

1. Загрузите шаблон сертификата (PNG/JPG) | Upload your certificate template (PNG/JPG)
2. Используйте мышь для рисования прямоугольных областей для полей | Use mouse to draw rectangular areas for fields:
   - 🔷 ФИО | Full Name
   - 🟩 Курс/Название | Course/Title
   - 🟧 ID сертификата | Certificate ID
3. Для каждого поля можно настроить выравнивание (лево/центр/право) | For each field you can set alignment (left/center/right)

## Генерация сертификатов | Certificate Generation

### Одиночная генерация | Single Generation
- Введите ФИО | Enter full name
- Введите название курса(ов) через запятую | Enter course name(s) separated by comma
- Нажмите "Сгенерировать" | Click "Generate"

### Пакетная генерация | Batch Generation
Загрузите CSV файл со следующими колонками | Upload CSV file with following columns:
```csv
fio,courses
"Иванов Иван Иванович","Курс 1"
"Петрова Анна Петровна","Курс 2, Курс 3"
```

## Готовые сертификаты | Generated Certificates

- Одиночные сертификаты доступны для скачивания сразу после генерации | Single certificates are available for download right after generation
- Пакетные сертификаты упаковываются в ZIP-архив | Batch certificates are packed into ZIP archive
- Все сертификаты сохраняются в формате PNG | All certificates are saved in PNG format

### Структура файлов | File Structure

- Готовые файлы хранятся в Vercel Blob Storage | Generated files are stored in Vercel Blob Storage
- URL для доступа: `{BLOB_PUBLIC_BASE_URL}/{templateId}/out/` | Access URL: `{BLOB_PUBLIC_BASE_URL}/{templateId}/out/`
- Формат имени файла: `CERT-{DATE}-{UUID}-{course}-{name}.png` | Filename format: `CERT-{DATE}-{UUID}-{course}-{name}.png`

## Логи | Logs

История генерации сохраняется в:
- `logs/certificates.jsonl` (локально) | Generation history is saved in `logs/certificates.jsonl` (locally)
- `{templateId}/logs/certificates.jsonl` (Vercel Blob) | `{templateId}/logs/certificates.jsonl` (Vercel Blob)