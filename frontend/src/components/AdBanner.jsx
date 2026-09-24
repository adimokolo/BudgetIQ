import { useEffect } from 'react';
import {
  ADSENSE_CLIENT,
  ADSENSE_DASHBOARD_SLOT,
  ENABLE_WEB_ADS,
} from '../config/ads';

export default function AdBanner() {
  useEffect(() => {
    if (!ENABLE_WEB_ADS || !ADSENSE_CLIENT || !ADSENSE_DASHBOARD_SLOT) {
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error('BudgetIQ web banner error:', error);
    }
  }, []);

  if (!ENABLE_WEB_ADS || !ADSENSE_CLIENT || !ADSENSE_DASHBOARD_SLOT) {
    return null;
  }

  return (
    <div className="web-ad-banner">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_DASHBOARD_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
