import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Card, Carousel } from 'antd';
// 1. Import các icon từ @ant-design/icons
import { LinkedinFilled, TwitterOutlined, MailOutlined } from '@ant-design/icons';
import doctor1 from '@/assets/doctor-1.jpg';
import doctor2 from '@/assets/doctor-2.jpg';
import doctor3 from '@/assets/doctor-3.jpg';

const DoctorsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const doctors = [
    // ... mảng doctors giữ nguyên
    {
      name: 'Dr. Sarah Johnson',
      specialty: 'General & Cosmetic Dentistry',
      image: doctor1,
      description: 'Over 12 years of experience in creating beautiful, healthy smiles.',
      social: {
        linkedin: '#',
        twitter: '#',
        email: 'sarah.johnson@dentalcare.com',
      },
    },
    {
      name: 'Dr. Michael Chen',
      specialty: 'Orthodontics & Pediatric Care',
      image: doctor2,
      description: 'Specialized in orthodontics with a gentle approach for all ages.',
      social: {
        linkedin: '#',
        twitter: '#',
        email: 'michael.chen@dentalcare.com',
      },
    },
    {
      name: 'Dr. Emily Rodriguez',
      specialty: 'Oral Surgery & Implantology',
      image: doctor3,
      description: 'Expert in advanced surgical procedures and dental implants.',
      social: {
        linkedin: '#',
        twitter: '#',
        email: 'emily.rodriguez@dentalcare.com',
      },
    },
  ];

  return (
    <section id="doctors" ref={ref} className="py-20 bg-gradient-fresh">
      <div className="container mx-auto px-4">
        {/* Section header (giữ nguyên) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-semibold mb-4">
            Đội ngũ của chúng tôi
          </span>
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Gặp gỡ{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">các bác sĩ chuyên môn</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Đội ngũ bác sĩ giàu kinh nghiệm luôn tận tâm mang đến cho bạn dịch vụ xuất sắc và phác đồ điều trị cá nhân hóa.
          </p>
        </motion.div>

        {/* Doctors grid for desktop */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {doctors.map((doctor, index) => (
            <motion.div
              key={doctor.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <Card
                className="border-border hover:shadow-medium transition-all duration-300 overflow-hidden"
                bodyStyle={{ padding: '0' }}
              >
                <div className="relative overflow-hidden group">
                  <img
                    src={doctor.image}
                    alt={doctor.name}
                    className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* 2. Thay thế social icons */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <a
                      href={doctor.social.linkedin}
                      className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                    >
                      <LinkedinFilled className="w-5 h-5" />
                    </a>
                    <a
                      href={doctor.social.twitter}
                      className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                    >
                      <TwitterOutlined className="w-5 h-5" />
                    </a>
                    <a
                      href={`mailto:${doctor.social.email}`}
                      className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                    >
                      <MailOutlined className="w-5 h-5" />
                    </a>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">{doctor.name}</h3>
                  <p className="text-primary font-semibold">{doctor.specialty}</p>
                  <p className="text-muted-foreground">{doctor.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Carousel for mobile */}
        <div className="md:hidden">
          <Carousel autoplay dotPosition="bottom" className="pb-8">
            {doctors.map((doctor) => (
              <div key={doctor.name} className="px-2">
                <Card className="border-border shadow-medium" bodyStyle={{ padding: '0' }}>
                  <img src={doctor.image} alt={doctor.name} className="w-full h-80 object-cover" />
                  <div className="p-6 space-y-3">
                    <h3 className="text-xl font-bold text-foreground">{doctor.name}</h3>
                    <p className="text-primary font-semibold">{doctor.specialty}</p>
                    <p className="text-muted-foreground">{doctor.description}</p>
                    {/* 3. Thay thế social icons ở đây nữa */}
                    <div className="flex gap-3 pt-2">
                      <a
                        href={doctor.social.linkedin}
                        className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                      >
                        <LinkedinFilled className="w-5 h-5" />
                      </a>
                      <a
                        href={doctor.social.twitter}
                        className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                      >
                        <TwitterOutlined className="w-5 h-5" />
                      </a>
                      <a
                        href={`mailto:${doctor.social.email}`}
                        className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                      >
                        <MailOutlined className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default DoctorsSection;
