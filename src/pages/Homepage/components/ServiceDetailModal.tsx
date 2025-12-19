import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui';
import type { CategoryDentalService, DentalService } from '@/types/admin';

interface ServiceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryDentalService | null;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const ServiceDetailModal = ({ open, onOpenChange, category }: ServiceDetailModalProps) => {
  const services = category?.listDentalServiceEntity || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{category?.name}</DialogTitle>
          <DialogDescription>
            Danh sách các dịch vụ và giá tiền trong danh mục này
          </DialogDescription>
        </DialogHeader>

        {services.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Chưa có dịch vụ nào trong danh mục này
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {services.map((service: DentalService) => (
              <Card key={service.id} variant="outlined" padding="md" className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-foreground mb-2">{service.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Đơn vị:</span>
                      <span className="font-medium">{service.unit}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(service.unitPrice)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">/ {service.unit}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

