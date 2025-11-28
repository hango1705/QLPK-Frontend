import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button } from '@/components/ui';
import { Package, Plus, Edit, Pill, FolderTree, DollarSign } from 'lucide-react';
import type { ClinicSectionProps } from '../types';
import { formatCurrency } from '../utils';
import { cn } from '@/utils/cn';

const ClinicSection: React.FC<ClinicSectionProps> = ({
  categories,
  services,
  prescriptions,
  onCreateCategory,
  onEditCategory,
  onCreateService,
  onEditService,
  onCreatePrescription,
  onEditPrescription,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'services' | 'prescriptions'>('categories');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/70">
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition',
            activeTab === 'categories'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <FolderTree className="mr-2 inline h-4 w-4" />
          Danh mục ({categories.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('services')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition',
            activeTab === 'services'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Package className="mr-2 inline h-4 w-4" />
          Dịch vụ ({services.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('prescriptions')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition',
            activeTab === 'prescriptions'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Pill className="mr-2 inline h-4 w-4" />
          Đơn thuốc ({prescriptions.length})
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <Card className="border-none bg-white/90 shadow-medium">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg">Danh mục dịch vụ</CardTitle>
              <CardDescription>Quản lý các danh mục dịch vụ nha khoa</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateCategory}
              className="border-primary/40 text-primary hover:bg-primary/10"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo danh mục mới
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <p className="text-sm text-muted-foreground">Đang tải...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                <FolderTree className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>Chưa có danh mục nào</p>
                <Button variant="outline" size="sm" onClick={onCreateCategory} className="mt-4">
                  Tạo danh mục đầu tiên
                </Button>
              </div>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-white/60 px-4 py-4 transition hover:shadow-medium"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                      <FolderTree className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{category.name}</p>
                        {category.listDentalServiceEntity && category.listDentalServiceEntity.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {category.listDentalServiceEntity.length} dịch vụ
                          </Badge>
                        )}
                      </div>
                      {category.listDentalServiceEntity && category.listDentalServiceEntity.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {category.listDentalServiceEntity.slice(0, 3).map((service) => (
                            <Badge key={service.id} variant="outline" className="text-[10px] bg-muted/50">
                              {service.name}
                            </Badge>
                          ))}
                          {category.listDentalServiceEntity.length > 3 && (
                            <Badge variant="outline" className="text-[10px] bg-muted/50">
                              +{category.listDentalServiceEntity.length - 3} khác
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditCategory(category)}
                    className="border-border/70"
                  >
                    <Edit className="mr-2 h-3.5 w-3.5" />
                    Chỉnh sửa
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <Card className="border-none bg-white/90 shadow-medium">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg">Dịch vụ nha khoa</CardTitle>
              <CardDescription>Quản lý các dịch vụ nha khoa</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateService}
              className="border-primary/40 text-primary hover:bg-primary/10"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo dịch vụ mới
            </Button>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                <Package className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>Chưa có dịch vụ nào</p>
                <Button variant="outline" size="sm" onClick={onCreateService} className="mt-4">
                  Tạo dịch vụ đầu tiên
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex flex-col gap-2 rounded-xl border border-border/70 bg-white/60 px-4 py-3 transition hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{service.name}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{service.unit}</span>
                          <DollarSign className="h-3 w-3" />
                          <span className="font-medium text-foreground">
                            {formatCurrency(service.unitPrice)}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditService(service)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Prescriptions Tab */}
      {activeTab === 'prescriptions' && (
        <Card className="border-none bg-white/90 shadow-medium">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg">Đơn thuốc</CardTitle>
              <CardDescription>Quản lý danh mục đơn thuốc</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onCreatePrescription}
              className="border-primary/40 text-primary hover:bg-primary/10"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo đơn thuốc mới
            </Button>
          </CardHeader>
          <CardContent>
            {prescriptions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                <Pill className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>Chưa có đơn thuốc nào</p>
                <Button variant="outline" size="sm" onClick={onCreatePrescription} className="mt-4">
                  Tạo đơn thuốc đầu tiên
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {prescriptions.map((prescription) => (
                  <div
                    key={prescription.name}
                    className="flex flex-col gap-2 rounded-xl border border-border/70 bg-white/60 px-4 py-3 transition hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{prescription.name}</p>
                        {prescription.dosage && (
                          <p className="mt-1 text-xs text-muted-foreground">Liều lượng: {prescription.dosage}</p>
                        )}
                        {prescription.frequency && (
                          <p className="text-xs text-muted-foreground">Tần suất: {prescription.frequency}</p>
                        )}
                        {prescription.duration && (
                          <p className="text-xs text-muted-foreground">Thời gian: {prescription.duration}</p>
                        )}
                        <div className="mt-2 flex items-center gap-1 text-xs">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {formatCurrency(prescription.unitPrice)}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditPrescription(prescription)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {prescription.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{prescription.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClinicSection;

