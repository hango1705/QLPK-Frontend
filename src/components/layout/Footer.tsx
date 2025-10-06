// import { Link } from 'react-router-dom';
import {
  FacebookFilled,
  TwitterOutlined,
  InstagramOutlined,
  LinkedinFilled,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    services: [
      { label: 'General Dentistry', href: '#services' },
      { label: 'Cosmetic Dentistry', href: '#services' },
      { label: 'Orthodontics', href: '#services' },
      { label: 'Emergency Care', href: '#services' },
    ],
    company: [
      { label: 'About Us', href: '#about' },
      { label: 'Our Doctors', href: '#doctors' },
      { label: 'Testimonials', href: '#testimonials' },
      { label: 'Contact', href: '#contact' },
    ],
    resources: [
      { label: 'Blog', href: '#' },
      { label: 'FAQs', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
    ],
  };

  const socialLinks = [
    { icon: FacebookFilled, href: '#', label: 'Facebook' },
    { icon: TwitterOutlined, href: '#', label: 'Twitter' },
    { icon: InstagramOutlined, href: '#', label: 'Instagram' },
    { icon: LinkedinFilled, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer id="contact" className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company info */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-2xl text-white font-bold">D</span>
              </div>
              <span className="text-xl font-bold">DentalCare</span>
            </div>
            <p className="text-background/80 leading-relaxed">
              Providing exceptional dental care with compassion and expertise. Your smile is our
              priority.
            </p>
            {/* Cách render social links không đổi */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-background/10 hover:bg-primary flex items-center justify-center transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Services & Company links (giữ nguyên) */}
          <div>
            <h3 className="text-lg font-bold mb-6">Services</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-background/80 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-6">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-background/80 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. Cập nhật phần Contact Us với icon của Ant Design */}
          <div>
            <h3 className="text-lg font-bold mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <EnvironmentOutlined className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <span className="text-background/80">
                  123 Dental Street
                  <br />
                  New York, NY 10001
                </span>
              </li>
              <li className="flex items-center gap-3">
                <PhoneOutlined className="w-5 h-5 text-primary flex-shrink-0" />
                <a
                  href="tel:+15551234567"
                  className="text-background/80 hover:text-primary transition-colors"
                >
                  +1 (555) 123-4567
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MailOutlined className="w-5 h-5 text-primary flex-shrink-0" />
                <a
                  href="mailto:info@dentalcare.com"
                  className="text-background/80 hover:text-primary transition-colors"
                >
                  info@dentalcare.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <ClockCircleOutlined className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <span className="text-background/80">
                  Mon-Fri: 9AM-6PM
                  <br />
                  Sat: 9AM-2PM
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar (giữ nguyên) */}
        <div className="pt-8 border-t border-background/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-background/60 text-sm">
              © {currentYear} DentalCare. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-background/60 hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-background/60 hover:text-primary transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-background/60 hover:text-primary transition-colors">
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
