import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// 1. Import Button từ custom components
import { Button } from '@/components/ui';
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
  const navigate = useNavigate();

  const handleBookAppointment = () => {
    navigate('/login');
  };

  // 3. Cập nhật mảng features để sử dụng icon của Ant Design
  const features = [
    {
      icon: CalendarOutlined,
      title: 'Đặt lịch dễ dàng',
      description: 'Đặt lịch trực tuyến 24/7',
    },
    {
      icon: ClockCircleOutlined,
      title: 'Giờ linh hoạt',
      description: 'Thời gian phục vụ mở rộng',
    },
    {
      icon: PhoneOutlined,
      title: 'Phản hồi nhanh',
      description: 'Hẹn trong ngày',
    },
    {
      icon: EnvironmentOutlined,
      title: 'Vị trí trung tâm',
      description: 'Dễ dàng tìm thấy',
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
              Sẵn sàng thay đổi nụ cười của bạn?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Hẹn lịch ngay hôm nay để bắt đầu hành trình hướng tới nụ cười khỏe đẹp và tự tin hơn.
            </p>
            {/* 4. Sử dụng custom Button component */}
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-primary hover:bg-white/90 text-lg px-10 py-6 h-auto shadow-glow flex items-center justify-center"
              onClick={handleBookAppointment}
            >
              <CalendarOutlined />
              <span className="ml-2">Đặt lịch ngay</span>
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
            <p className="text-white/90 text-lg mb-4">Hoặc gọi trực tiếp</p>
            <a
              href="tel:+15551234567"
              className="text-3xl font-bold text-white hover:text-white/80 transition-colors"
            >
              0888705203
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AppointmentSection;
