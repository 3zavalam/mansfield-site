export const SITE_TITLE = 'Websites';
// The personal-site title and description, while the site is in portfolio mode (see Base.astro):
// "Runnin' Down My Dream" / "Mansfield: building in public: data, software and AI projects, business analyses, and freelance work that funds a master's in Valencia."
export const SITE_DESCRIPTION = 'Mansfield: websites designed and built from scratch for businesses.';
export const EMAIL = 'hello@getmansfield.com';
// PLACEHOLDER: replace with Emilio's real Upwork profile URL
export const UPWORK_URL = 'https://www.upwork.com/';
// PLACEHOLDER: replace with Emilio's real X handle URL
export const X_URL = 'https://x.com/';
export const GITHUB_URL = 'https://github.com/3zavalam';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/emilio-zavala-miceli-86595927b/';
export const OLD_PORTFOLIO_URL = 'https://portfolio-vercel-six-beige.vercel.app';
// WhatsApp for new projects (Mexican mobile, +52 993 159 0106). waLink('') gives the base to append encoded text to.
export const WHATSAPP = '529931590106';
export const waLink = (text: string) => `https://wa.me/${WHATSAPP}?text=${text ? encodeURIComponent(text) : ''}`;
