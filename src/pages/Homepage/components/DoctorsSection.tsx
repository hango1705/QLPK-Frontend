import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Card } from '@/components/ui';
import { Carousel } from 'antd';
// 1. Import các icon từ @ant-design/icons
import { LinkedinFilled, TwitterOutlined, MailOutlined } from '@ant-design/icons';
import doctor1 from '@/assets/doctor-1.jpg';
import doctor2 from '@/assets/doctor-2.jpg';
import doctor3 from '@/assets/doctor-3.jpg';

const DoctorsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

const doctors = [
  {
    name: 'BS. Nguyễn Thị Minh',
    specialty: 'Nha khoa tổng quát & Thẩm mỹ',
    image: doctor1,
    description: 'Hơn 12 năm kinh nghiệm trong việc mang lại nụ cười khỏe đẹp cho khách hàng.',
    social: {
      linkedin: '#',
      twitter: '#',
      email: 'minh.nguyen@dentalcare.vn',
    },
  },
  {
    name: 'BS. Trần Quốc Huy',
    specialty: 'Chỉnh nha & Nha khoa trẻ em',
    image: doctor2,
    description: 'Chuyên sâu về chỉnh nha với phong cách nhẹ nhàng, thân thiện cho mọi lứa tuổi.',
    social: {
      linkedin: '#',
      twitter: '#',
      email: 'huy.tran@dentalcare.vn',
    },
  },
  {
    name: 'BS. Lê Thu Hà',
    specialty: 'Phẫu thuật răng hàm mặt & Cấy ghép Implant',
    image: doctor3,
    description: 'Giàu kinh nghiệm trong các ca phẫu thuật chuyên sâu và cấy ghép implant nha khoa.',
    social: {
      linkedin: '#',
      twitter: '#',
      email: 'ha.le@dentalcare.vn',
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
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              các bác sĩ chuyên môn
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Đội ngũ bác sĩ giàu kinh nghiệm luôn tận tâm mang đến cho bạn dịch vụ xuất sắc và phác
            đồ điều trị cá nhân hóa.
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
                variant="elevated"
                hoverable
                className="overflow-hidden"
                padding="none"
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
                <Card variant="elevated" padding="none">
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
