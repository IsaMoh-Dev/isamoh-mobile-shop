import { useSettings } from '../context/SettingsContext';

export default function FloatButtons() {
  const s = useSettings();
  const phone   = (s.shop_phone || '+251929346248').replace(/[^0-9]/g, '');
  const telegram = s.telegram || 'isadagishop';
  return (
    <div className="float-contact-group">
      <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" className="float-btn float-whatsapp" title="WhatsApp">
        <i className="fab fa-whatsapp" /><span className="float-btn-label">WhatsApp</span>
      </a>
      <a href={`https://t.me/${telegram}`} target="_blank" rel="noreferrer" className="float-btn float-telegram" title="Telegram">
        <i className="fab fa-telegram-plane" /><span className="float-btn-label">Telegram</span>
      </a>
    </div>
  );
}
