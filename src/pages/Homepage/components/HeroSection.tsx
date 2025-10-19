import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
// 1. Import Button từ custom components
import { Button } from '@/components/ui';
// 2. Import các icon từ @ant-design/icons
import { ArrowRightOutlined, CalendarOutlined } from '@ant-design/icons';
import heroImage from '@/assets/hero-dental.jpg';

const HeroSection = () => {
  const navigate = useNavigate();

  const handleBookAppointment = () => {
    navigate('/login');
  };

  const handleLearnMore = () => {
    navigate('/#about');
  };
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-hero overflow-hidden pt-20">
      {/* Background decoration (giữ nguyên) */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary-glow rounded-full blur-3xl opacity-20 animate-float" />
      <div
        className="absolute bottom-20 left-0 w-96 h-96 bg-secondary-light rounded-full blur-3xl opacity-20 animate-float"
        style={{ animationDelay: '1.5s' }}
      />

      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left content (logic giữ nguyên) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
                Đối tác nha khoa đáng tin cậy của bạn
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-5xl md:text-6xl font-bold text-foreground leading-tight"
            >
              Nụ cười của bạn,{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Ưu tiên của chúng tôi
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg text-muted-foreground leading-relaxed"
            >
              Trải nghiệm dịch vụ nha khoa đẳng cấp cùng đội ngũ chuyên gia giàu kinh nghiệm. Chúng
              tôi kết hợp công nghệ hiện đại với sự tận tâm để mang đến cho bạn nụ cười rạng rỡ.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              {/* 3. Sử dụng custom Button components */}
              <Button
                variant="primary"
                size="lg"
                className="text-lg px-8 shadow-medium flex items-center justify-center group"
                onClick={handleBookAppointment}
              >
                <CalendarOutlined />
                <span className="mx-2">Đặt lịch hẹn</span>
                <ArrowRightOutlined className="group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8"
                onClick={handleLearnMore}
              >
                Tìm hiểu thêm
              </Button>
            </motion.div>

            {/* Stats (giữ nguyên) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="grid grid-cols-3 gap-6 pt-8"
            >
              <div>
                <div className="text-3xl font-bold text-primary">15+</div>
                <div className="text-sm text-muted-foreground">Năm kinh nghiệm</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Khách hàng hài lòng</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">25+</div>
                <div className="text-sm text-muted-foreground">Bác sĩ chuyên môn</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right image (giữ nguyên) */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-glow">
              <img
                src={heroImage}
                alt="Modern dental clinic"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-medium p-6 max-w-xs"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
                <div>
                  <div className="font-semibold text-foreground">Công nghệ tiên tiến</div>
                  <div className="text-sm text-muted-foreground">
                    Trang thiết bị nha khoa hiện đại
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
