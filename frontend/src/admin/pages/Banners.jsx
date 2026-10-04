import { useState } from 'react';
import { useSettings, useRefreshSettings } from '../../context/SettingsContext';
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
  const settings        = useSettings();
  const refreshSettings = useRefreshSettings();
  const [uploading, setUploading] = useState('');
  // local preview for logo so it shows instantly after upload
  const [logoPreview, setLogoPreview] = useState(null);

  async function uploadBanner(bannerKey, file) {
    if (!file) return;
    setUploading(bannerKey);
    try {
      const fd = new FormData();
      fd.append('banner', file);
      fd.append('bannerKey', bannerKey);
      // POST /settings/banner uploads to Cloudinary AND saves to DB in one step
      await api.post('/settings/banner', fd, { headers:{'Content-Type':'multipart/form-data'} });
      toast.success('Banner updated!');
      refreshSettings();
    } catch { toast.error('Upload failed.'); }
    finally { setUploading(''); }
  }

  async function uploadLogo(file) {
    if (!file) return;
    setUploading('shop_logo');
    try {
      const fd = new FormData();
      fd.append('banner', file);
      fd.append('bannerKey', 'shop_logo');
      const r = await api.post('/settings/banner', fd, { headers:{'Content-Type':'multipart/form-data'} });
      setLogoPreview(imgUrl(r.data.path));
      toast.success('Logo updated! It\'s now live in the navbar.');
      refreshSettings();
    } catch { toast.error('Logo upload failed.'); }
    finally { setUploading(''); }
  }

  const currentLogo = logoPreview || (settings.shop_logo ? imgUrl(settings.shop_logo) : null);

  return (
    <>
      <div className="admin-topbar">
        <h5 className="mb-0" style={{ fontFamily:"'Rubik',sans-serif", fontWeight:600 }}>Banners & Logo</h5>
        <span style={{ fontSize:13, color:'#888' }}>Upload new banner images and the shop logo</span>
      </div>

      {/* ── Shop Logo ─────────────────────────────────────────────── */}
      <div className="mb-2" style={{ fontFamily:"'Rubik',sans-serif", fontWeight:700, fontSize:15, color:'#444', letterSpacing:0.3 }}>
        <i className="fas fa-store me-2 text-primary" />Shop Logo
      </div>
      <div className="row g-4 mb-4">
        <div className="col-md-6 col-lg-4">
          <div className="bg-white rounded-3 shadow-sm p-4" style={{ border:'2px solid #e8f0fe' }}>
            <h6 style={{ fontFamily:"'Rubik',sans-serif", fontWeight:600, marginBottom:4 }}>
              Navbar Logo
            </h6>
            <p style={{ fontSize:12, color:'#888', marginBottom:12 }}>
              Displayed top-left in the navigation bar · PNG or SVG recommended · shown at 48px height
            </p>

            {/* Preview area */}
            <div style={{
              width:'100%', height:90, background:'#f8f9fa', borderRadius:8,
              marginBottom:12, display:'flex', alignItems:'center', justifyContent:'center',
              border:'1px dashed #dee2e6', overflow:'hidden',
            }}>
              {currentLogo ? (
                <img
                  src={currentLogo}
                  alt="Current logo"
                  style={{ maxHeight:70, maxWidth:'90%', objectFit:'contain' }}
                />
              ) : (
                <span style={{ fontSize:12, color:'#aaa' }}>No logo uploaded yet</span>
              )}
            </div>

            <label className="btn btn-primary btn-sm w-100" style={{ cursor:'pointer' }}>
              {uploading === 'shop_logo'
                ? <><span className="spinner-border spinner-border-sm me-2" />Uploading...</>
                : <><i className="fas fa-cloud-upload-alt me-2" />Upload New Logo</>
              }
              <input
                type="file"
                accept="image/*"
                className="d-none"
                disabled={uploading === 'shop_logo'}
                onChange={e => uploadLogo(e.target.files[0])}
              />
            </label>

            {settings.shop_logo && (
              <p className="mt-2 mb-0" style={{ fontSize:11, color:'#aaa', wordBreak:'break-all' }}>
                {settings.shop_logo}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Banners ───────────────────────────────────────────────── */}
      <div className="mb-2" style={{ fontFamily:"'Rubik',sans-serif", fontWeight:700, fontSize:15, color:'#444', letterSpacing:0.3 }}>
        <i className="fas fa-images me-2 text-primary" />Homepage Banners
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
                  {uploading === key
                    ? <><span className="spinner-border spinner-border-sm me-2" />Uploading...</>
                    : <><i className="fas fa-upload me-2" />Upload New Image</>
                  }
                  <input type="file" accept="image/*" className="d-none" disabled={uploading === key}
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
