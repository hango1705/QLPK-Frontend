import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Loading, Alert, AlertTitle, AlertDescription } from '@/components/ui';
import { showNotification } from '@/components/ui';
import { patientAPI } from '@/services/api/patient';
import { queryKeys } from '@/services/queryClient';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'processing' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // No redirect flags: we avoid redirecting when params are missing to not lose query string

  // Extract VNPay callback parameters (with fallback from sessionStorage if searchParams empty)
  const getParams = () => {
    // Primary: current search params
    if (window.location.search) return new URLSearchParams(window.location.search);
    // Fallback: cached from initial load before any redirect/guard stripped query
    const cached = sessionStorage.getItem('vnpay_callback_search');
    if (cached) return new URLSearchParams(cached);
    return searchParams;
  };
  const params = getParams();

  const vnpAmount = params.get('vnp_Amount');
  const vnpBankCode = params.get('vnp_BankCode');
  const vnpBankTranNo = params.get('vnp_BankTranNo');
  const vnpCardType = params.get('vnp_CardType');
  const vnpTmnCode = params.get('vnp_TmnCode');
  const vnpOrderInfo = params.get('vnp_OrderInfo');
  const vnpPayDate = params.get('vnp_PayDate');
  const vnpResponseCode = params.get('vnp_ResponseCode');
  const vnpTransactionNo = params.get('vnp_TransactionNo');
  const vnpTransactionStatus = params.get('vnp_TransactionStatus');
  const vnpTxnRef = params.get('vnp_TxnRef');
  const vnpSecureHash = params.get('vnp_SecureHash');

  // Extract costId from orderInfo or localStorage
  // Format: "Thanh toan don hang:78275465" or we can store costId in localStorage before redirect
  const getCostId = (): string | null => {
    // Try to get from localStorage first (more reliable)
    const storedCostId = localStorage.getItem('vnpay_costId');
    if (storedCostId) {
      localStorage.removeItem('vnpay_costId'); // Clean up after use
      return storedCostId;
    }
    
    // Fallback: try to extract from orderInfo if it contains costId
    // This is a fallback, better to use localStorage
    return null;
  };

  // Update payment mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async (data: {
      costId: string;
      vnpayParams: Record<string, string>;
    }) => {
      // Use public endpoint for VNPay callback (no auth required)
      return patientAPI.updateCostPaymentFromVNPay(data.costId, data.vnpayParams);
    },
    onSuccess: () => {
      // Invalidate cost queries to refresh payment list
      queryClient.invalidateQueries({ queryKey: queryKeys.patient.costs });
      queryClient.invalidateQueries({ queryKey: queryKeys.patient.myTreatmentPlans });
      
      // Also invalidate nurse queries if this is a nurse payment
      const redirectUrl = getRedirectUrl(false); // Don't clean yet
      if (redirectUrl && redirectUrl.includes('/nurse')) {
        queryClient.invalidateQueries({ queryKey: ['nurse', 'treatmentPlans'] });
        queryClient.invalidateQueries({ queryKey: ['doctor', 'treatmentPhases'] });
      }
      
      setPaymentStatus('success');
      setIsProcessing(false);
      showNotification.success('Cập nhật thanh toán thành công!');
    },
    onError: (error: any) => {
      setPaymentStatus('failed');
      setIsProcessing(false);
      const errorMsg = error.response?.data?.result || error.message || 'Không thể cập nhật thanh toán';
      setErrorMessage(errorMsg);
      showNotification.error(errorMsg);
    },
  });

  useEffect(() => {
    // Debug: Log all URL parameters
    const allParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      allParams[key] = value;
    });
    console.log('VNPay Callback Parameters:', allParams);
    console.log('Full URL:', window.location.href);
    console.log('Search params string:', window.location.search || sessionStorage.getItem('vnpay_callback_search') || '');
    console.log('Referrer:', document.referrer);

    // Check if this is a valid VNPay callback by checking if any VNPay parameter exists
    const hasAnyVNPayParam = vnpAmount || vnpBankCode || vnpResponseCode || vnpTransactionStatus || 
                             vnpTransactionNo || vnpTxnRef || vnpSecureHash || vnpOrderInfo;
    
    if (!hasAnyVNPayParam) {
      // No VNPay parameters - could be:
      // 1. User accessed page directly
      // 2. VNPay redirected without params (cancelled payment or error)
      // 3. User cancelled payment in VNPay
      
      // Check if there's a stored costId (means user was in payment flow)
      const storedCostId = localStorage.getItem('vnpay_costId');
      const redirectUrl = localStorage.getItem('vnpay_redirectUrl');
      
      console.log('No VNPay params found. Stored costId:', storedCostId, 'Redirect URL:', redirectUrl);
      
      // Dừng xử lý, KHÔNG redirect để tránh mất query params khi VNPay thực sự trả về
      setPaymentStatus('failed');
      setIsProcessing(false);
      setErrorMessage('Không nhận được tham số từ VNPay. Vui lòng thử lại.');
      return;
    }

    // Check if we have response code or transaction status
    if (!vnpResponseCode && !vnpTransactionStatus) {
      // Has some VNPay params but missing critical ones - might be incomplete callback
      setPaymentStatus('failed');
      setIsProcessing(false);
      setErrorMessage('Thiếu thông tin từ VNPay. Có thể thanh toán đã bị hủy hoặc có lỗi xảy ra.');
      return;
    }

    // Check payment status
    // vnp_ResponseCode = '00' means success
    // vnp_TransactionStatus = '00' means success
    const isSuccess = vnpResponseCode === '00' && vnpTransactionStatus === '00';

    if (!isSuccess) {
      setPaymentStatus('failed');
      setIsProcessing(false);
      const responseCodeMsg = vnpResponseCode ? ` (Mã: ${vnpResponseCode})` : '';
      setErrorMessage(`Thanh toán không thành công${responseCodeMsg}. Vui lòng thử lại.`);
      return;
    }

    // Payment successful, update in backend
    const costId = getCostId();
    if (!costId) {
      setPaymentStatus('failed');
      setIsProcessing(false);
      setErrorMessage('Không tìm thấy thông tin hóa đơn. Vui lòng liên hệ hỗ trợ.');
      return;
    }

    // Collect all VNPay parameters
    const vnpayParams: Record<string, string> = {
      vnp_Amount: vnpAmount || '',
      vnp_BankCode: vnpBankCode || '',
      vnp_BankTranNo: vnpBankTranNo || '',
      vnp_CardType: vnpCardType || '',
      vnp_OrderInfo: vnpOrderInfo || '',
      vnp_PayDate: vnpPayDate || '',
      vnp_ResponseCode: vnpResponseCode || '',
      vnp_TmnCode: vnpTmnCode || '',
      vnp_TransactionNo: vnpTransactionNo || '',
      vnp_TransactionStatus: vnpTransactionStatus || '',
      vnp_TxnRef: vnpTxnRef || '',
      vnp_SecureHash: vnpSecureHash || '',
    };

    // Update payment status using public VNPay callback endpoint
    updatePaymentMutation.mutate({
      costId,
      vnpayParams,
    });
  }, []);

  const getRedirectUrl = (shouldClean: boolean = true): string => {
    // Check if there's a stored redirect URL (for nurse payment)
    const redirectUrl = localStorage.getItem('vnpay_redirectUrl');
    if (redirectUrl) {
      if (shouldClean) {
        localStorage.removeItem('vnpay_redirectUrl'); // Clean up after use
      }
      return redirectUrl;
    }
    // Default: redirect to patient payment section
    return '/patient?section=payment';
  };

  const handleBackToPayment = () => {
    navigate(getRedirectUrl());
  };

  const handleBackToHome = () => {
    navigate(getRedirectUrl());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8">
        <div className="text-center space-y-6">
          {isProcessing && (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">Đang xử lý thanh toán...</h1>
              <p className="text-muted-foreground">
                Vui lòng đợi trong giây lát. Chúng tôi đang cập nhật thông tin thanh toán của bạn.
              </p>
            </>
          )}

          {paymentStatus === 'success' && (
            <>
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-green-600">Thanh toán thành công!</h1>
              <p className="text-muted-foreground">
                Giao dịch của bạn đã được xử lý thành công.
              </p>

              {/* Payment Details */}
              <div className="mt-6 space-y-3 text-left bg-muted/30 rounded-xl p-4">
                {vnpAmount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số tiền:</span>
                    <span className="font-semibold">
                      {parseInt(vnpAmount) / 100} ₫
                    </span>
                  </div>
                )}
                {vnpBankCode && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngân hàng:</span>
                    <span className="font-semibold">{vnpBankCode}</span>
                  </div>
                )}
                {vnpTransactionNo && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mã giao dịch:</span>
                    <span className="font-semibold">{vnpTransactionNo}</span>
                  </div>
                )}
                {vnpPayDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Thời gian:</span>
                    <span className="font-semibold">
                      {vnpPayDate.slice(6, 8)}/{vnpPayDate.slice(4, 6)}/{vnpPayDate.slice(0, 4)} {vnpPayDate.slice(8, 10)}:{vnpPayDate.slice(10, 12)}:{vnpPayDate.slice(12, 14)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-center mt-6">
                <Button onClick={handleBackToPayment} variant="outline">
                  Quay lại trang thanh toán
                </Button>
                <Button onClick={handleBackToHome}>
                  Về trang chủ
                </Button>
              </div>
            </>
          )}

          {paymentStatus === 'failed' && (
            <>
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 p-4">
                  <XCircle className="h-16 w-16 text-red-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-red-600">Thanh toán thất bại</h1>
              
              {errorMessage && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>Lỗi</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              {/* Transaction Details */}
              {vnpTransactionNo && (
                <div className="mt-6 space-y-3 text-left bg-muted/30 rounded-xl p-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mã giao dịch:</span>
                    <span className="font-semibold">{vnpTransactionNo}</span>
                  </div>
                  {vnpResponseCode && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mã phản hồi:</span>
                      <span className="font-semibold">{vnpResponseCode}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-center mt-6">
                <Button onClick={handleBackToPayment} variant="outline">
                  Quay lại trang thanh toán
                </Button>
                <Button onClick={handleBackToHome}>
                  Về trang chủ
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PaymentCallback;

