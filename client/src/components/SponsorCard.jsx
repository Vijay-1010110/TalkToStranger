import React from 'react';
import AdBanner from './AdBanner';

/**
 * Backwards-compatible SponsorCard component that delegates to the centralized AdBanner system.
 */
export default function SponsorCard(props) {
  return <AdBanner {...props} />;
}
