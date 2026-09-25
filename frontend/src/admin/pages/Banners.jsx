import { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { imgUrl } from '../../utils/imageUrl';

const BANNER_KEYS = [
  { key:'banner_1',    label:'Hero Banner 1',     size:'Full width hero' },
  { key:'banner_2',    label:'Hero Banner 2',     size:'Full width hero' },
  { key:'banner_3',    label:'Hero Banner 3',     size:'Full width hero' },
  { key:'banner_4',    label:'Hero Banner 4',     size:'Full width hero' },
  { key:'ad_banner_1', label:'Ad Banner Left',    size:'500x150px' },
  { key:'ad_banner_2', label:'Ad Banner Right',   size:'500x150px' },
];

export default function AdminBanners() {
  const settings = useSettings();
  const [uploading, setUploading] = useState('');

  async function uploadBanner(bannerKey, file) {
    if (!file) return;
    setUploading(bannerKey);
    try {
      const fd = new FormData();
      fd.append('banner', file);
      fd.append('bannerKey', bannerKey);
      const r = await api.post('/settings/banner', fd, { headers:{'Content-Type':'multipart/form-data'} });
      await api.put('/settings', { [bannerKey]: r.data.path });
      toast.success(`Banner updated! Refresh to see changes.`);
    } catch { toast.error('Upload failed.'); }
    finally { setUploading(''); }
  }

  return (
    <>
      <div className="admin-topbar">
        <h5 className="mb-0" style={{ fontFamily:"'Rubik',sans-serif", fontWeight:600 }}>Banners</h5>
        <span style={{ fontSize:13, color:'#888' }}>Upload new banner images for the homepage</span>
      </div>

      <div className="row g-4">
        {BANNER_KEYS.map(({ key, label, size }) => {
          const current = settings[key];
          return (
            <div key={key} className="col-md-6 col-lg-4">
              <div className="bg-white rounded-3 shadow-sm p-4">
                <h6 style={{ fontFamily:"'Rubik',sans-serif", fontWeight:600, marginBottom:4 }}>{label}</h6>
                <p style={{ fontSize:12, color:'#888', marginBottom:12 }}>Recommended: {size}</p>
                {current && (
                  <img src={imgUrl(current)} alt={label} style={{ width:'100%', height:100, objectFit:'cover', borderRadius:8, marginBottom:12 }} />
                )}
                <label className="btn btn-outline-primary btn-sm w-100" style={{ cursor:'pointer' }}>
                  {uploading === key ? <><span className="spinner-border spinner-border-sm me-2" />Uploading...</> : <><i className="fas fa-upload me-2" />Upload New Image</>}
                  <input type="file" accept="image/*" className="d-none" disabled={uploading===key}
                    onChange={e => uploadBanner(key, e.target.files[0])} />
                </label>
                {current && <p className="mt-2 mb-0" style={{ fontSize:11, color:'#888', wordBreak:'break-all' }}>{current}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
