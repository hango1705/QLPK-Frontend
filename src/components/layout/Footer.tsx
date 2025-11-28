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
      { label: 'Nha khoa tổng quát', href: '#services' },
      { label: 'Nha khoa thẩm mỹ', href: '#services' },
      { label: 'Chỉnh nha', href: '#services' },
      { label: 'Cấp cứu nha khoa', href: '#services' },
    ],
    company: [
      { label: 'Về chúng tôi', href: '#about' },
      { label: 'Đội ngũ bác sĩ', href: '#doctors' },
      { label: 'Cảm nhận khách hàng', href: '#testimonials' },
      { label: 'Liên hệ', href: '#contact' },
    ],
    resources: [
      { label: 'Blog', href: '#' },
      { label: 'Câu hỏi thường gặp', href: '#' },
      { label: 'Chính sách bảo mật', href: '#' },
      { label: 'Điều khoản dịch vụ', href: '#' },
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
              <span className="text-xl font-bold">eDental</span>
            </div>
            <p className="text-background/80 leading-relaxed">
              Dịch vụ nha khoa tận tâm và chuyên nghiệp. Nụ cười của bạn là ưu tiên của chúng tôi.
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
            <h3 className="text-lg font-bold mb-6">Dịch vụ</h3>
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
            <h3 className="text-lg font-bold mb-6">Công ty</h3>
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
            <h3 className="text-lg font-bold mb-6">Liên hệ</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <EnvironmentOutlined className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <span className="text-background/80">
                  10 Đ.Trần Phú
                  <br />
                  Quận Hà Đông, TP.HCM
                </span>
              </li>
              <li className="flex items-center gap-3">
                <PhoneOutlined className="w-5 h-5 text-primary flex-shrink-0" />
                <a
                  href="tel:+15551234567"
                  className="text-background/80 hover:text-primary transition-colors"
                >
                  0888705203
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MailOutlined className="w-5 h-5 text-primary flex-shrink-0" />
                <a
                  href="mailto:dentalcare@gmail.com"
                  className="text-background/80 hover:text-primary transition-colors"
                >
                  dentalcare@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <ClockCircleOutlined className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <span className="text-background/80">
                  Thứ 2 - Thứ 6: 9:00 - 18:00
                  <br />
                  Thứ 7: 9:00 - 14:00
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar (giữ nguyên) */}
        <div className="pt-8 border-t border-background/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-background/60 text-sm">
              © {currentYear} Nha Khoa. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-background/60 hover:text-primary transition-colors">
                Chính sách bảo mật
              </a>
              <a href="#" className="text-background/60 hover:text-primary transition-colors">
                Điều khoản
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
