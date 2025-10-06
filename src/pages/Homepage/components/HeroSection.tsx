import { motion } from 'framer-motion';
// 1. Import Button từ antd
import { Button } from 'antd';
// 2. Import các icon từ @ant-design/icons
import { ArrowRightOutlined, CalendarOutlined } from '@ant-design/icons';
import heroImage from '@/assets/hero-dental.jpg';

const HeroSection = () => {
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
                Your Trusted Dental Partner
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-5xl md:text-6xl font-bold text-foreground leading-tight"
            >
              Your Smile,{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Our Priority
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg text-muted-foreground leading-relaxed"
            >
              Experience world-class dental care with our team of experienced professionals. We
              combine modern technology with compassionate care to give you the smile you deserve.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              {/* 3. Thay thế các Buttons */}
              <Button
                type="primary"
                size="large"
                className="text-lg px-8 shadow-medium flex items-center justify-center group" // Thêm flex để căn chỉnh
              >
                <CalendarOutlined />
                <span className="mx-2">Book Appointment</span>
                <ArrowRightOutlined className="group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="large" className="text-lg px-8 border-2 hover:bg-primary/5">
                Learn More
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
                <div className="text-sm text-muted-foreground">Years Experience</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Happy Patients</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">25+</div>
                <div className="text-sm text-muted-foreground">Expert Dentists</div>
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
                  <div className="font-semibold text-foreground">Advanced Technology</div>
                  <div className="text-sm text-muted-foreground">Latest dental equipment</div>
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
