import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
  FaTiktok,
  FaXTwitter,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa6";

const links = [
  { name: "Facebook", url: "https://www.facebook.com/share/1FJ5QvqBv8/", Icon: FaFacebookF },
  { name: "Instagram", url: "https://www.instagram.com/kashmetrix/", Icon: FaInstagram },
  { name: "WhatsApp Channel", url: "https://whatsapp.com/channel/0029VbDbhpGHwXbI06FTwg0p", Icon: FaWhatsapp },
  { name: "TikTok", url: "https://vm.tiktok.com/ZN9D6vnXuR6go-kNk4p/", Icon: FaTiktok },
  { name: "X", url: "https://x.com/KashMetrix", Icon: FaXTwitter },
  { name: "LinkedIn", url: "https://www.linkedin.com/company/145283932/", Icon: FaLinkedinIn },
  { name: "YouTube", url: "https://www.youtube.com/channel/UCVUywYg5QP14NVr1tGvy4fg", Icon: FaYoutube },
];

export default function PublicSocialLinks({ footer = false }) {
  return (
    <div
      className={`public-social-links${footer ? " public-social-footer" : ""}`}
      aria-label="KashMetrix social media"
    >
      {footer && <span className="public-social-label">Follow us on</span>}
      <div className="public-social-icons">
        {links.map(({ name, url, Icon }) => (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`KashMetrix on ${name}`}
            title={name}
          >
            <Icon size={18} aria-hidden="true" />
          </a>
        ))}
      </div>
    </div>
  );
}
