import { useState } from 'react';
import { Link } from 'react-router-dom';
// 1. Import Button từ antd
import { Button } from 'antd';
// 2. Import các icon từ @ant-design/icons
import { MenuOutlined, CloseOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Dịch vụ', href: '#services' },
    { label: 'Bác sĩ', href: '#doctors' },
    { label: 'Giới thiệu', href: '#about' },
    { label: 'Liên hệ', href: '#contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-soft">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground py-2 hidden md:block">
        <div className="container mx-auto px-4 flex justify-end items-center gap-6 text-sm">
          {/* 3. Thay thế icon trong Top bar */}
          <div className="flex items-center gap-2">
            <PhoneOutlined className="w-4 h-4" />
            <span>0888705203</span>
          </div>
          <div className="flex items-center gap-2">
            <MailOutlined className="w-4 h-4" />
            <span>dentalcare@gmail.com</span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo (giữ nguyên) */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <span className="text-2xl text-white font-bold">D</span>
            </div>
            <span className="text-xl font-bold text-foreground">eDental</span>
          </Link>

          {/* Desktop menu (giữ nguyên) */}
          <div className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-foreground hover:text-primary transition-colors duration-300 font-medium"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* 4. Thay thế CTA Button */}
          <div className="hidden md:block">
            <Button type="primary" size="large">
              Đặt lịch hẹn
            </Button>
          </div>

          {/* 5. Thay thế Mobile menu button icons */}
          <button className="md:hidden text-foreground" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? (
              <CloseOutlined className="w-6 h-6" />
            ) : (
              <MenuOutlined className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 pb-4"
            >
              <div className="flex flex-col gap-4">
                {menuItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-foreground hover:text-primary transition-colors duration-300 font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                {/* 6. Thay thế Button trong mobile menu */}
                <Button type="primary" size="large" className="w-full mt-2">
                  Đặt lịch hẹn
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Header;
