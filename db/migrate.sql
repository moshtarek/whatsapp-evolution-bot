-- إضافة الحقول الجديدة لدعم الملفات والصور
ALTER TABLE rules ADD COLUMN reply_type TEXT DEFAULT 'text';
ALTER TABLE rules ADD COLUMN media_url TEXT;
ALTER TABLE rules ADD COLUMN filename TEXT;
