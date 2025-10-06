import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
// 1. Import Button từ antd
import { Button } from 'antd';
// 2. Import các icon từ @ant-design/icons
import {
  CalendarOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';

const AppointmentSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  // 3. Cập nhật mảng features để sử dụng icon của Ant Design
  const features = [
    {
      icon: CalendarOutlined,
      title: 'Easy Scheduling',
      description: 'Book online 24/7',
    },
    {
      icon: ClockCircleOutlined,
      title: 'Flexible Hours',
      description: 'Extended availability',
    },
    {
      icon: PhoneOutlined,
      title: 'Quick Response',
      description: 'Same-day appointments',
    },
    {
      icon: EnvironmentOutlined,
      title: 'Central Location',
      description: 'Easy to find',
    },
  ];

  return (
    <section ref={ref} className="relative py-20 overflow-hidden">
      {/* Background gradient (giữ nguyên) */}
      <div className="absolute inset-0 bg-gradient-primary opacity-95" />

      {/* Decorative elements (giữ nguyên) */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Smile?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Schedule your appointment today and take the first step towards a healthier, more
              confident smile.
            </p>
            {/* 4. Thay thế Button của shadcn bằng Button của antd */}
            <Button
              type="default" // type="default" của antd có nền trắng
              size="large" // size="lg" tương đương size="large"
              icon={<CalendarOutlined />}
              // Thêm 'flex items-center' để căn chỉnh icon và text khi có padding lớn
              className="bg-white text-primary hover:bg-white/90 text-lg px-10 py-6 h-auto shadow-glow flex items-center justify-center"
            >
              Book Your Appointment Now
            </Button>
          </motion.div>

          {/* Features grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                  {/* 5. Dùng icon antd và style bằng prop 'style' để đảm bảo kích thước */}
                  <feature.icon style={{ fontSize: '32px', color: 'white' }} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/80">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Contact info (giữ nguyên) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mt-16 pt-12 border-t border-white/20"
          >
            <p className="text-white/90 text-lg mb-4">Or call us directly at</p>
            <a
              href="tel:+15551234567"
              className="text-3xl font-bold text-white hover:text-white/80 transition-colors"
            >
              +1 (555) 123-4567
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AppointmentSection;
