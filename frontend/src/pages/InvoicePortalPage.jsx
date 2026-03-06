import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { portalAPI } from '@/services/api';
import { Zap, CheckCircle, Receipt, Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export const InvoicePortalPage = () => {
  const { invoiceId } = useParams();
  const [searchParams] = useSearchParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await portalAPI.getInvoice(invoiceId);
        setInvoice(response.data);
        
        // Check if payment was successful
        if (searchParams.get('paid') === 'true') {
          toast.success('Payment successful! Thank you.');
        }
        if (searchParams.get('cancelled') === 'true') {
          toast.error('Payment was cancelled');
        }
      } catch (error) {
        toast.error('Invoice not found');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [invoiceId, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Receipt className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">Invoice Not Found</h1>
          <p className="text-slate-500">This invoice may have been removed.</p>
        </div>
      </div>
    );
  }

  const statusColors = {
    draft: 'bg-slate-100 text-slate-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  };

  const isPaid = invoice.status === 'paid';
  const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status !== 'paid';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4" data-testid="invoice-portal">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-[Manrope]">FieldOps</h1>
            <p className="text-sm text-slate-500">Invoice {invoice.invoice_number}</p>
          </div>
        </div>

        {/* Paid Banner */}
        {isPaid && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">Payment Received</h3>
              <p className="text-sm text-green-700">
                Paid on {invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        )}

        {/* Overdue Banner */}
        {isOverdue && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <h3 className="font-semibold text-red-900">Payment Overdue</h3>
            <p className="text-sm text-red-700">This invoice was due on {new Date(invoice.due_date).toLocaleDateString()}</p>
          </div>
        )}

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-[Manrope]">{invoice.title}</CardTitle>
              <p className="text-sm text-slate-500 mt-1">For: {invoice.customer_name}</p>
            </div>
            <Badge className={statusColors[isOverdue ? 'overdue' : invoice.status]}>
              {isOverdue ? 'overdue' : invoice.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal:</span><span>${invoice.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>GST (10%):</span><span>${invoice.tax.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-xl border-t pt-2">
                  <span>Total:</span><span>${invoice.total.toFixed(2)} AUD</span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-700">{invoice.notes}</p>
              </div>
            )}

            <p className="mt-4 text-sm text-slate-500">
              Due date: {new Date(invoice.due_date).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        {/* Pay Button */}
        {!isPaid && invoice.payment_link && (
          <div className="text-center">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-lg px-8"
              onClick={() => window.location.href = invoice.payment_link}
              data-testid="pay-invoice-btn"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Pay ${invoice.total.toFixed(2)} AUD
            </Button>
            <p className="text-sm text-slate-500 mt-3">Secure payment via Stripe</p>
          </div>
        )}

        {isPaid && (
          <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-900">Thank You!</h3>
            <p className="text-green-700">Your payment has been received.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicePortalPage;
