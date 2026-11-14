/** Official brand marks from Simple Icons (public/logos), tinted with the brand colour. */
export const BRAND = {
  whatsapp: { name: 'WhatsApp', color: '#25D366' },
  imessage: { name: 'iMessage', color: '#34DA50' },
  elevenlabs: { name: 'ElevenLabs', color: '#000000' },
  twilio: { name: 'Twilio', color: '#F22F46' },
  claude: { name: 'Claude', color: '#D97757' },
  supabase: { name: 'Supabase', color: '#3FCF8E' },
  vercel: { name: 'Vercel', color: '#000000' },
  googlemaps: { name: 'Google Maps', color: '#4285F4' },
  openstreetmap: { name: 'OpenStreetMap', color: '#7EBC6F' },
  wikimediacommons: { name: 'Wikimedia Commons', color: '#006699' },
  unsplash: { name: 'Unsplash', color: '#000000' },
} as const;
export type Brand = keyof typeof BRAND;

export function BrandLogo({ name, size = 16, color, className }: { name: Brand; size?: number; color?: string; className?: string }) {
  return (
    <span
      role="img"
      aria-label={BRAND[name].name}
      className={className}
      style={{
        display: 'inline-block', width: size, height: size, flex: 'none',
        backgroundColor: color ?? BRAND[name].color,
        WebkitMask: `url(/logos/${name}.svg) center / contain no-repeat`,
        mask: `url(/logos/${name}.svg) center / contain no-repeat`,
      }}
    />
  );
}
