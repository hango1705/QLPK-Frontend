import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
// 1. Import Card và Button từ custom components
import { Card, Button } from '@/components/ui';
// 2. Import các icon từ @ant-design/icons
import {
  SmileOutlined,
  CrownOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  ExperimentOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { publicAPI } from '@/services/api/public';
import type { CategoryDentalService } from '@/types/admin';
import { ServiceDetailModal } from './ServiceDetailModal';

// Icon mapping based on category name
const getIconForCategory = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('tổng quát') || name.includes('tổng quát')) return SmileOutlined;
  if (name.includes('thẩm mỹ') || name.includes('thẩm mỹ')) return CrownOutlined;
  if (name.includes('chỉnh nha') || name.includes('chỉnh nha')) return SafetyOutlined;
  if (name.includes('cấp cứu') || name.includes('cấp cứu')) return ThunderboltOutlined;
  if (name.includes('phẫu thuật') || name.includes('phẫu thuật')) return ExperimentOutlined;
  if (name.includes('trẻ em') || name.includes('trẻ em')) return StarOutlined;
  return SmileOutlined; // default
};

const getColorForCategory = (index: number) => {
  const colors = [
    { bg: 'bg-primary/10', text: 'text-primary' },
    { bg: 'bg-secondary/10', text: 'text-secondary' },
    { bg: 'bg-accent/20', text: 'text-accent-foreground' },
    { bg: 'bg-destructive/10', text: 'text-destructive' },
    { bg: 'bg-primary/10', text: 'text-primary' },
    { bg: 'bg-secondary/10', text: 'text-secondary' },
  ];
  return colors[index % colors.length];
};

const ServicesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [selectedCategory, setSelectedCategory] = useState<CategoryDentalService | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch categories from API
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['public', 'categories'],
    queryFn: () => publicAPI.getAllCategories(),
  });

  const handleLearnMore = (category: CategoryDentalService) => {
    setSelectedCategory(category);
    setModalOpen(true);
  };

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
            Dịch vụ của chúng tôi
          </span>
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Giải pháp{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              nha khoa toàn diện
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Từ khám định kỳ đến các thủ thuật chuyên sâu, chúng tôi cung cấp đầy đủ dịch vụ để giữ
            gìn nụ cười khỏe đẹp.
          </p>
        </motion.div>

        {/* Services grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => {
              const IconComponent = getIconForCategory(category.name);
              const colors = getColorForCategory(index);

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="h-full"
                >
                  <Card
                    variant="elevated"
                    hoverable
                    className="h-full"
                    padding="lg"
                  >
                    <div className="space-y-4 flex flex-col h-full">
                      <div
                        className={`w-14 h-14 rounded-xl ${colors.bg} flex items-center justify-center`}
                      >
                        <IconComponent className={`w-7 h-7 ${colors.text}`} />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">{category.name}</h3>
                      <p className="text-muted-foreground leading-relaxed flex-grow">
                        {category.listDentalServiceEntity && category.listDentalServiceEntity.length > 0
                          ? `Có ${category.listDentalServiceEntity.length} dịch vụ trong danh mục này.`
                          : 'Danh mục dịch vụ nha khoa chuyên nghiệp.'}
                      </p>

                      {/* 4. Sử dụng custom Button component */}
                      <Button
                        variant="ghost"
                        className="p-0 h-auto self-start font-semibold group flex items-center gap-1"
                        onClick={() => handleLearnMore(category)}
                      >
                        Tìm hiểu thêm
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Service Detail Modal */}
        <ServiceDetailModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          category={selectedCategory}
        />
      </div>
    </section>
  );
};

export default ServicesSection;
