import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { invoicesAPI, customersAPI } from '@/services/api';
import { Plus, Send, Trash2, Receipt, Copy, CreditCard, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const statusColors = {
  draft: 'bg-slate-100 text-slate-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-slate-100 text-slate-800',
};

const InvoiceForm = ({ customers, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    title: '',
    notes: '',
    due_days: 14,
    items: [{ description: '', quantity: 1, unit_price: 0 }],
  });

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unit_price: 0 }],
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = field === 'description' ? value : parseFloat(value) || 0;
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const subtotal = formData.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const tax = subtotal * 0.10;
  const total = subtotal + tax;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customer_id) {
      toast.error('Please select a customer');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Customer *</Label>
          <Select value={formData.customer_id} onValueChange={(v) => setFormData({ ...formData, customer_id: v })}>
            <SelectTrigger data-testid="invoice-customer-select">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name} ({c.email})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Invoice Title *</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Plumbing Repair Service"
            required
            data-testid="invoice-title-input"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Line Items</Label>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="w-24">Qty</TableHead>
                <TableHead className="w-32">Unit Price</TableHead>
                <TableHead className="w-32">Total</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formData.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Service or product"
                      data-testid={`inv-item-desc-${index}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">${(item.quantity * item.unit_price).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>

      <div className="flex justify-end">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>GST (10%):</span><span>${tax.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span><span>${total.toFixed(2)} AUD</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Payment Due (days)</Label>
          <Select value={formData.due_days.toString()} onValueChange={(v) => setFormData({ ...formData, due_days: parseInt(v) })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Due in 7 days</SelectItem>
              <SelectItem value="14">Due in 14 days</SelectItem>
              <SelectItem value="30">Due in 30 days</SelectItem>
              <SelectItem value="60">Due in 60 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Payment terms..."
            rows={2}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="create-invoice-btn">
          Create Invoice
        </Button>
      </DialogFooter>
    </form>
  );
};

export const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [invoicesRes, customersRes] = await Promise.all([
        invoicesAPI.getAll(),
        customersAPI.getAll(),
      ]);
      setInvoices(invoicesRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (data) => {
    try {
      await invoicesAPI.create(data);
      toast.success('Invoice created with payment link!');
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create invoice');
    }
  };

  const handleSend = async (id) => {
    try {
      await invoicesAPI.send(id);
      toast.success('Invoice sent to customer with payment link!');
      fetchData();
    } catch (error) {
      toast.error('Failed to send invoice');
    }
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copied!');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await invoicesAPI.delete(id);
      toast.success('Invoice deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const totalPending = invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + i.total, 0);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;
  }

  return (
    <div className="space-y-6" data-testid="invoices-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-[Manrope]">Invoices</h2>
          <p className="text-slate-500">{invoices.length} invoices</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setDialogOpen(true)} data-testid="new-invoice-btn">
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <p className="text-sm text-green-700">Total Paid</p>
            <p className="text-2xl font-bold text-green-900">${totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700">Pending Payment</p>
            <p className="text-2xl font-bold text-blue-900">${totalPending.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4">
            <p className="text-sm text-slate-700">Total Invoices</p>
            <p className="text-2xl font-bold text-slate-900">{invoices.length}</p>
          </CardContent>
        </Card>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">Add a customer first before creating invoices</p>
            <Button variant="outline" onClick={() => window.location.href = '/customers'}>
              Add Customer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table className="data-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No invoices yet</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id} data-testid={`invoice-row-${invoice.id}`}>
                      <TableCell className="font-mono text-sm">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.customer_name}</p>
                          <p className="text-xs text-slate-500">{invoice.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{invoice.title}</TableCell>
                      <TableCell className="font-semibold">${invoice.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[invoice.status]}>{invoice.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {invoice.status === 'draft' && (
                            <Button variant="ghost" size="icon" onClick={() => handleSend(invoice.id)} title="Send to customer">
                              <Send className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                          {invoice.payment_link && (
                            <Button variant="ghost" size="icon" onClick={() => window.open(invoice.payment_link, '_blank')} title="Payment link">
                              <CreditCard className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleCopyLink(invoice.public_link)} title="Copy link">
                            <Copy className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(invoice.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-[Manrope]">Create New Invoice</DialogTitle>
          </DialogHeader>
          <InvoiceForm customers={customers} onSubmit={handleCreate} onCancel={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoicesPage;
