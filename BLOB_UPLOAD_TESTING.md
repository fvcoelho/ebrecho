# Vercel Blob Upload Testing Guide

## 🚀 Complete Setup & Testing Instructions

### 1. **Environment Setup**

#### **Add Your Blob Token**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → Storage → `store_HfNAmd3S2wspxAfM` 
3. Copy your **Read-Write Token**
4. Update both files:
   - `/api/.env`
   - `/api/.env.development`
   
Replace:
```bash
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_REPLACE_WITH_YOUR_TOKEN"
```

With your actual token:
```bash
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_XfB1tD2wspxAfM..."
```

### 2. **Start Services**

```bash
# Terminal 1: API Server
cd api
npm run dev

# Terminal 2: Web App
cd web
npm run dev
```

### 3. **Test Endpoints**

#### **A) Test Blob Connection**
```bash
curl http://localhost:3001/api/test-blob/test-connection
```

Expected response:
```json
{
  "success": true,
  "message": "Blob connection successful",
  "data": {
    "testFile": {
      "url": "https://hfnamd3s2wspxafm.public.blob.vercel-storage.com/test/connection-test.txt",
      "pathname": "test/connection-test.txt",
      "size": 54
    },
    "config": {
      "storeId": "store_HfNAmd3S2wspxAfM",
      "baseUrl": "https://hfnamd3s2wspxafm.public.blob.vercel-storage.com",
      "tokenLength": 89
    }
  }
}
```

#### **B) List Existing Blobs**
```bash
curl http://localhost:3001/api/test-blob/list-blobs
```

### 4. **Frontend Testing**

#### **A) Simple Upload Test**
1. Visit: http://localhost:3000/test-blob-upload
2. Select some images (without Product ID)
3. Check browser console for logs
4. Verify preview functionality

#### **B) Complete Upload Flow**
1. Login to the app
2. Go to: http://localhost:3000/produtos/novo
3. Fill out product form and save
4. Upload images using the new Blob uploader
5. Check browser console for detailed logs

#### **C) Edit Product Test**
1. Go to existing product edit page
2. Upload additional images
3. Verify images appear correctly

### 5. **Expected Logs**

#### **Frontend Console** (look for these emojis):
```
🔑 Requesting upload token
📤 Uploading file to Blob
✅ File uploaded successfully
📮 Notifying API of upload completion
✅ Upload completion processed
```

#### **API Server Logs**:
```
[INFO] Generating upload token { userId: 'xxx', partnerId: 'xxx', productId: 'xxx' }
[INFO] Upload completed { url: 'https://...', pathname: 'image.jpg' }
[INFO] Thumbnail generated successfully { original: 'https://...', thumbnail: 'https://...' }
```

### 6. **Verify Results**

#### **A) Database Check**
Images should be saved in `ProductImage` table with:
- `originalUrl`: Full Vercel Blob URL
- `thumbnailUrl`: Generated thumbnail URL
- `blobId`: Pathname for deletion
- `uploadMethod`: "blob"

#### **B) Blob Storage**
Visit your [Vercel Dashboard Storage](https://vercel.com/dashboard) to see uploaded files.

#### **C) Generated Thumbnails**
Should see thumbnails in `thumbnails/` prefix in blob storage.

### 7. **Troubleshooting**

#### **Connection Issues**
```bash
# Check API logs
cd api && npm run dev

# Test connection
curl http://localhost:3001/api/test-blob/test-connection
```

#### **Upload Failures**
1. Check browser console for detailed error logs
2. Check API server logs
3. Verify token is correctly set
4. Ensure product exists and user has permission

#### **Missing Thumbnails**
- Thumbnails are generated server-side after upload
- Check API logs for Sharp processing errors
- Verify blob write permissions

### 8. **Success Indicators**

✅ **Blob connection test passes**  
✅ **Upload token generation works**  
✅ **Direct upload to Vercel Blob succeeds**  
✅ **Thumbnails are generated automatically**  
✅ **Database records are created**  
✅ **Images display correctly in frontend**  

### 9. **API Documentation**

View complete API docs at: http://localhost:3001/api-docs

Look for:
- **Blob Upload** section
- **Test Blob** section (development only)

---

## 🎯 Ready to Test!

Once you add your Blob token, the entire system should work end-to-end with:
- ✅ Direct browser uploads to Vercel Blob
- ✅ Automatic thumbnail generation  
- ✅ Database integration
- ✅ Real-time progress tracking
- ✅ Error handling and validation

The old local upload system is completely replaced with cloud-based Vercel Blob storage! 🎉