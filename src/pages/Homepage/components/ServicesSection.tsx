import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
// 1. Import Card và Button từ antd
import { Card, Button } from 'antd';
// 2. Import các icon từ @ant-design/icons
import {
  SmileOutlined,
  CrownOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  ExperimentOutlined,
  StarOutlined,
} from '@ant-design/icons';

const ServicesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  // 3. Cập nhật mảng services với icon của Ant Design
  const services = [
    {
      icon: SmileOutlined,
      title: 'General Dentistry',
      description:
        'Comprehensive dental care including checkups, cleanings, and preventive treatments.',
      color: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      icon: CrownOutlined,
      title: 'Cosmetic Dentistry',
      description: 'Transform your smile with whitening, veneers, and aesthetic procedures.',
      color: 'bg-secondary/10',
      iconColor: 'text-secondary',
    },
    {
      icon: SafetyOutlined,
      title: 'Orthodontics',
      description: 'Braces and aligners to straighten teeth and improve your bite.',
      color: 'bg-accent/20',
      iconColor: 'text-accent-foreground',
    },
    {
      icon: ThunderboltOutlined,
      title: 'Emergency Care',
      description: '24/7 emergency dental services for urgent dental problems.',
      color: 'bg-destructive/10',
      iconColor: 'text-destructive',
    },
    {
      icon: ExperimentOutlined,
      title: 'Oral Surgery',
      description: 'Expert surgical procedures including extractions and implants.',
      color: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      icon: StarOutlined,
      title: 'Pediatric Dentistry',
      description: 'Specialized care for children in a friendly and comfortable environment.',
      color: 'bg-secondary/10',
      iconColor: 'text-secondary',
    },
  ];

  return (
    <section id="services" ref={ref} className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section header (giữ nguyên) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            Our Services
          </span>
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Comprehensive{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Dental Solutions
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From routine checkups to advanced procedures, we offer a full range of dental services
            to keep your smile healthy and beautiful.
          </p>
        </motion.div>

        {/* Services grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="h-full"
            >
              <Card
                className="h-full border-border hover:shadow-medium transition-all duration-300 cursor-pointer"
                bodyStyle={{ padding: '32px' }}
              >
                <div className="space-y-4 flex flex-col h-full">
                  <div
                    className={`w-14 h-14 rounded-xl ${service.color} flex items-center justify-center`}
                  >
                    <service.icon className={`w-7 h-7 ${service.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{service.title}</h3>
                  <p className="text-muted-foreground leading-relaxed flex-grow">
                    {service.description}
                  </p>

                  {/* 4. Thay thế button bằng Button của Ant Design */}
                  <Button
                    type="link"
                    className="p-0 h-auto self-start font-semibold group flex items-center gap-1"
                  >
                    Learn More
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
