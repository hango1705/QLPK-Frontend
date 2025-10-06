import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
// 1. Import các icon từ @ant-design/icons
import {
  TrophyOutlined,
  HeartOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import clinicImage from '@/assets/clinic-interior.jpg';

const AboutSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  // 2. Cập nhật mảng features để sử dụng icon của Ant Design
  const features = [
    {
      icon: TrophyOutlined,
      title: 'Expert Care',
      description: 'Board-certified dentists with years of experience',
    },
    {
      icon: HeartOutlined,
      title: 'Patient Focused',
      description: 'Personalized treatment plans for every patient',
    },
    {
      icon: SafetyCertificateOutlined,
      title: 'Safe & Hygienic',
      description: 'Strict sterilization protocols for your safety',
    },
    {
      icon: ClockCircleOutlined,
      title: 'Flexible Hours',
      description: 'Extended hours to fit your busy schedule',
    },
  ];

  return (
    <section id="about" ref={ref} className="py-20 bg-gradient-fresh">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left image (giữ nguyên) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="rounded-3xl overflow-hidden shadow-medium">
              <img
                src={clinicImage}
                alt="Dental clinic interior"
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-secondary/20 rounded-3xl -z-10" />
          </motion.div>

          {/* Right content (giữ nguyên) */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
                About Us
              </span>
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Committed to Excellence in{' '}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Dental Care
                </span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                With over 15 years of experience, our clinic has been serving the community with
                exceptional dental care. We combine the latest technology with compassionate service
                to ensure every visit is comfortable and effective.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 pt-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    {/* 3. Cách render icon không cần thay đổi */}
                    {/* Icon Ant Design cũng là component và nhận className */}
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
