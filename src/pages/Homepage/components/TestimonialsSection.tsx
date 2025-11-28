import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Card } from '@/components/ui';
import { Carousel, Rate } from 'antd';
// 1. Import icon từ @ant-design/icons
import { MessageOutlined } from '@ant-design/icons';

const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const testimonials = [
    {
      name: 'Nguyễn Văn A',
      role: 'Trưởng phòng Marketing',
      rating: 5,
      text: 'Đội ngũ tại Nha Khoa thật tuyệt vời! Quy trình cấy ghép răng rất thoải mái và kết quả vượt ngoài mong đợi. Rất đáng để giới thiệu!',
      initials: 'JS',
    },
    {
      name: 'Lê Văn B',
      role: 'Kỹ sư phần mềm',
      rating: 5,
      text: 'Tôi từng rất sợ nha sĩ, nhưng bác sĩ Sarah và đội ngũ đã thay đổi hoàn toàn. Họ kiên nhẫn, chuyên nghiệp và thật sự quan tâm. Trải nghiệm nha khoa tốt nhất!',
      initials: 'RJ',
    },
    {
      name: 'Phạm Thị C',
      role: 'Giáo viên',
      rating: 5,
      text: 'Các con tôi rất thích đến đây! Dịch vụ cho trẻ em xuất sắc, nhân viên luôn biết cách giúp trẻ thoải mái. Cảm ơn đã chăm sóc nụ cười của gia đình chúng tôi!',
      initials: 'MG',
    },
    {
      name: 'Đỗ Thị D',
      role: 'Chủ doanh nghiệp',
      rating: 5,
      text: 'Chuyên nghiệp, đúng giờ và dễ mến. Dịch vụ thẩm mỹ răng đã giúp tôi tự tin hơn rất nhiều. Rất xứng đáng!',
      initials: 'DL',
    },
  ];

  return (
    <section ref={ref} className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section header (giữ nguyên) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-semibold mb-4">
            Cảm nhận khách hàng
          </span>
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Khách hàng{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">nói gì</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Đừng chỉ nghe chúng tôi nói. Dưới đây là những chia sẻ từ các khách hàng hài lòng.
          </p>
        </motion.div>

        {/* Testimonials carousel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          <Carousel
            autoplay
            dotPosition="bottom"
            className="pb-12"
            slidesToShow={2}
            responsive={[
              {
                breakpoint: 768,
                settings: {
                  slidesToShow: 1,
                },
              },
            ]}
          >
            {testimonials.map((testimonial, index) => (
              <div key={index} className="px-3">
                <Card
                  variant="elevated"
                  hoverable
                  className="h-full"
                  padding="lg"
                >
                  <div className="space-y-4">
                    {/* 2. Thay thế Quote icon */}
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MessageOutlined className="w-6 h-6 text-primary" />
                    </div>

                    {/* Rating (giữ nguyên) */}
                    <Rate disabled defaultValue={testimonial.rating} className="text-sm" />

                    {/* Testimonial text (giữ nguyên) */}
                    <p className="text-foreground leading-relaxed text-lg">"{testimonial.text}"</p>

                    {/* Author info (giữ nguyên) */}
                    <div className="flex items-center gap-4 pt-4 border-t border-border">
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                        {testimonial.initials}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </Carousel>
        </motion.div>

        {/* Stats (giữ nguyên) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto"
        >
          {/* ... */}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
