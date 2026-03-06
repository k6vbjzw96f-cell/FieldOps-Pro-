import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { portalAPI } from '@/services/api';
import { Zap, CheckCircle, XCircle, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const QuotePortalPage = () => {
  const { quoteId } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await portalAPI.getQuote(quoteId);
        setQuote(response.data);
      } catch (error) {
        toast.error('Quote not found');
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [quoteId]);

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await portalAPI.acceptQuote(quoteId);
      setQuote({ ...quote, status: 'accepted' });
      toast.success('Quote accepted! We will contact you shortly.');
    } catch (error) {
      toast.error('Failed to accept quote');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    setActionLoading(true);
    try {
      await portalAPI.declineQuote(quoteId);
      setQuote({ ...quote, status: 'declined' });
      toast.success('Quote declined');
    } catch (error) {
      toast.error('Failed to decline quote');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">Quote Not Found</h1>
          <p className="text-slate-500">This quote may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  const statusColors = {
    draft: 'bg-slate-100 text-slate-800',
    sent: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4" data-testid="quote-portal">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-[Manrope]">FieldOps Solutions</h1>
            <p className="text-sm text-slate-500">Quote {quote.quote_number}</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-[Manrope]">{quote.title}</CardTitle>
              <p className="text-sm text-slate-500 mt-1">For: {quote.customer_name}</p>
            </div>
            <Badge className={statusColors[quote.status]}>{quote.status}</Badge>
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
                {quote.items.map((item, index) => (
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
                <div className="flex justify-between"><span>Subtotal:</span><span>${quote.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>GST (10%):</span><span>${quote.tax.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-xl border-t pt-2">
                  <span>Total:</span><span>${quote.total.toFixed(2)} AUD</span>
                </div>
              </div>
            </div>

            {quote.notes && (
              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-700">{quote.notes}</p>
              </div>
            )}

            <p className="mt-4 text-sm text-slate-500">
              Valid until: {new Date(quote.valid_until).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        {quote.status === 'sent' && (
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleAccept}
              disabled={actionLoading}
              data-testid="accept-quote-btn"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Accept Quote
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleDecline}
              disabled={actionLoading}
              data-testid="decline-quote-btn"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Decline
            </Button>
          </div>
        )}

        {quote.status === 'accepted' && (
          <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-900">Quote Accepted</h3>
            <p className="text-green-700">Thank you! We will contact you shortly to proceed.</p>
          </div>
        )}

        {quote.status === 'declined' && (
          <div className="text-center p-6 bg-slate-50 rounded-lg border border-slate-200">
            <XCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700">Quote Declined</h3>
            <p className="text-slate-500">If you change your mind, please contact us.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotePortalPage;
