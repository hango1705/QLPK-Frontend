import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Card, Carousel, Rate } from 'antd';
// 1. Import icon từ @ant-design/icons
import { MessageOutlined } from '@ant-design/icons';

const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const testimonials = [
    {
      name: 'Jennifer Smith',
      role: 'Marketing Manager',
      rating: 5,
      text: 'The team at DentalCare is absolutely amazing! They made my dental implant procedure so comfortable and the results exceeded my expectations. Highly recommend!',
      initials: 'JS',
    },
    {
      name: 'Robert Johnson',
      role: 'Software Engineer',
      rating: 5,
      text: 'I was terrified of dentists, but Dr. Sarah and her team changed everything. They are patient, professional, and truly care about their patients. Best dental experience ever!',
      initials: 'RJ',
    },
    {
      name: 'Maria Garcia',
      role: 'Teacher',
      rating: 5,
      text: 'My kids love coming here! The pediatric care is outstanding, and the staff knows how to make children feel comfortable. Thank you for taking such great care of our smiles!',
      initials: 'MG',
    },
    {
      name: 'David Lee',
      role: 'Business Owner',
      rating: 5,
      text: 'Professional, punctual, and pleasant. The cosmetic work they did on my teeth has boosted my confidence tremendously. Worth every penny!',
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
            Testimonials
          </span>
          <h2 className="text-4xl font-bold text-foreground mb-4">
            What Our{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">Patients Say</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Don't just take our word for it. Here's what our satisfied patients have to say about
            their experience with us.
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
                  className="border-border hover:shadow-medium transition-all duration-300 h-full"
                  bodyStyle={{ padding: '32px' }}
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
