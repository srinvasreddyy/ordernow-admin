//
import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, User, Clock, Truck, ClipboardList, MessageSquare, ChefHat, Plus, Tag } from 'lucide-react';
import clsx from 'clsx';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
};

export default function OrderCard({ order, activeTab, onAssignDriver, refetch }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  // Handle Accept/Reject
  const handleResponse = async (acceptance) => {
    setIsProcessing(true);
    try {
        await api.patch(`/orders/${order._id}/respond`, { acceptance });
        toast.success(`Order ${acceptance}`);
        refetch(); 
    } catch(e) { 
        toast.error("Failed to update order"); 
    } finally { 
        setIsProcessing(false); 
    }
  };

  // Handle Manual Status Change
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    if (!newStatus) return;

    if (!window.confirm(`Are you sure you want to mark this order as ${newStatus.replace(/_/g, ' ')}?`)) {
        e.target.value = ""; 
        return;
    }

    setStatusLoading(true);
    try {
        await api.patch(`/orders/${order._id}/status`, { status: newStatus });
        toast.success("Status updated successfully");
        refetch(); 
    } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
        setStatusLoading(false);
    }
  };

  // Status Options Logic
  const getAvailableStatusOptions = (currentStatus) => {
      const options = [];
      if (currentStatus === 'placed') {
          options.push('out_for_delivery', 'delivered', 'cancelled');
      } else if (currentStatus === 'preparing') {
          options.push('ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled');
      } else if (currentStatus === 'ready_for_pickup') {
          options.push('delivered', 'cancelled');
      } else if (currentStatus === 'out_for_delivery') {
          options.push('delivered', 'cancelled');
      }
      return options;
  };

  const availableStatuses = getAvailableStatusOptions(order.status);

  // Address Display Logic
  const displayAddress = order.deliveryAddress?.fullAddress || 
                         order.deliveryAddress?.addressLine1 || 
                         "Address details not available";

  // Date Formatting
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
  });
  const orderTime = new Date(order.createdAt).toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="card-base group flex flex-col h-full hover:border-primary/30 transition-all duration-200 shadow-sm hover:shadow-md">
      {/* Header */}
      <div className="px-5 py-4 bg-gray-50/80 border-b border-gray-100 flex justify-between items-start">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <span className="bg-white border border-gray-200 font-mono text-xs font-bold text-gray-700 px-2 py-0.5 rounded shadow-sm">
               #{order.orderNumber.slice(-6)}
             </span>
             <span className={clsx(
               "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
               order.paymentStatus === 'paid' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
             )}>
                {order.paymentStatus}
             </span>
           </div>
           <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                {order.paymentType}
           </span>
        </div>
        <div className="text-right">
           <span className="text-xl font-black text-dark block leading-none tracking-tight">{formatCurrency(order.pricing.totalAmount)}</span>
           <span className="text-xs text-gray-400 font-medium">
             {order.orderedItems.length} items
           </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col gap-5">
        {/* Customer Info */}
        <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                <User className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-dark truncate">{order.customerDetails?.name || "Guest User"}</h4>
                <p className="text-xs text-gray-500 font-medium">{order.customerDetails?.phoneNumber}</p>
            </div>
        </div>
        
        {/* Address Info */}
        <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-500">
                <MapPin className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-600 line-clamp-2 leading-relaxed flex-1 mt-1 font-medium">
                {displayAddress}
            </span>
        </div>

        {/* Timestamps & Order Type */}
        <div className="mt-auto pt-4 flex items-center justify-between text-xs font-medium text-gray-400 border-t border-gray-50">
            <div className="flex items-center gap-1.5" title={`Ordered on ${orderDate} at ${orderTime}`}>
               <Clock className="w-3.5 h-3.5" />
               <span className="text-gray-600">{orderDate}, {orderTime}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
                {order.orderType === 'delivery' && <Truck className="w-3.5 h-3.5" />}
                <span className="uppercase font-bold text-gray-700">{order.orderType}</span>
            </div>
        </div>

        {/* --- ACTION AREA --- */}
        <div className="space-y-3 pt-2">
            
            {/* 1. New Order Actions */}
            {activeTab === 'new' && (
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => handleResponse('rejected')}
                        disabled={isProcessing}
                        className="btn-danger text-sm py-2 justify-center font-bold"
                    >
                        Reject
                    </button>
                    <button 
                        onClick={() => handleResponse('accepted')}
                        disabled={isProcessing}
                        className="btn-primary text-sm py-2 w-full shadow-md justify-center font-bold"
                    >
                        Accept Order
                    </button>
                </div>
            )}

            {/* 2. Accepted Order Actions */}
            {order.acceptanceStatus === 'accepted' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                <div className="flex flex-col gap-2 animate-fade-in">
                    
                    {/* Assign Driver */}
                    {order.orderType === 'delivery' && (order.status === 'placed' || order.status === 'preparing') && (
                        <button 
                            onClick={onAssignDriver}
                            className="flex items-center justify-center gap-2 w-full bg-dark text-white hover:bg-black rounded-lg text-xs font-bold py-2.5 transition-all shadow-sm"
                        >
                            <Truck className="w-4 h-4" />
                            {order.assignedDeliveryPartnerId ? 'Reassign Driver' : 'Assign Delivery Partner'}
                        </button>
                    )}

                    {/* Manual Status Dropdown */}
                    {availableStatuses.length > 0 && (
                        <div className="relative">
                            <select 
                                disabled={statusLoading}
                                onChange={handleStatusChange}
                                value=""
                                className="block w-full text-xs font-bold rounded-lg border-gray-200 bg-white py-2.5 pl-3 pr-8 text-gray-700 focus:border-primary focus:ring-primary cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                <option value="" disabled>Update Status...</option>
                                {availableStatuses.map(status => (
                                    <option key={status} value={status}>
                                        Mark as {status.replace(/_/g, ' ').toUpperCase()}
                                    </option>
                                ))}
                            </select>
                            {statusLoading && (
                                <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                    <div className="w-3 h-3 border-2 border-gray-400 border-t-primary rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* Expandable Order Details */}
      <div className="border-t border-gray-100">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-600 transition-all flex justify-center items-center gap-2 uppercase tracking-wider"
        >
          {isExpanded ? 'Hide Details' : 'View Items & Notes'}
          {isExpanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
        </button>

        <div className={clsx("bg-gray-50 transition-all duration-300 overflow-hidden", isExpanded ? "max-h-[600px] overflow-y-auto border-t border-gray-200" : "max-h-0")}>
           <div className="p-5 space-y-4">
              
              {/* Ordered Items List */}
              {order.orderedItems.map((item, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                      {/* Item Header */}
                      <div className="flex justify-between items-start mb-3 relative z-10">
                          <div className="flex gap-3">
                              <span className="bg-gray-900 text-white px-2.5 py-1 rounded-lg text-sm font-black h-fit shadow-md">
                                  {item.quantity}x
                              </span>
                              <div className="flex flex-col">
                                <span className="text-gray-900 font-bold text-base">{item.itemName}</span>
                                <span className="text-[10px] text-gray-400 font-mono">{item.itemId}</span>
                              </div>
                          </div>
                          <span className="font-bold text-gray-800 text-sm">{formatCurrency(item.itemTotal)}</span>
                      </div>

                      {/* Configurations & Instructions Container */}
                      <div className="space-y-3 relative z-10 pl-11">
                          
                          {/* Variants & Addons */}
                          {(item.selectedVariants?.length > 0 || item.selectedAddons?.length > 0) && (
                              <div className="flex flex-wrap gap-2">
                                  {/* Variants */}
                                  {item.selectedVariants?.map((v, idx) => (
                                      <div key={idx} className="flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-medium">
                                          <Tag size={10} className="text-slate-400" />
                                          <span className="text-slate-500 uppercase text-[9px] font-bold mr-1">{v.groupTitle || 'Option'}:</span>
                                          <span className="font-bold">{v.variantName || v.details?.variantName || "Variant"}</span>
                                      </div>
                                  ))}

                                  {/* Addons */}
                                  {item.selectedAddons?.map((a, idx) => (
                                      <div key={idx} className="flex items-center gap-1 bg-green-50 border border-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">
                                          <Plus size={10} className="text-green-600" />
                                          {a.optionTitle || a.details?.optionTitle || "Extra"}
                                      </div>
                                  ))}
                              </div>
                          )}

                          {/* ITEM INSTRUCTIONS (Highlighted) */}
                          {item.instructions && (
                              <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 p-2.5 rounded-lg">
                                  <ChefHat size={16} className="text-orange-600 mt-0.5 shrink-0" />
                                  <div className="flex flex-col">
                                      <span className="text-[9px] font-black text-orange-400 uppercase tracking-wider">Kitchen Note</span>
                                      <p className="text-xs text-orange-800 font-medium leading-snug italic">"{item.instructions}"</p>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              ))}
              
              {/* General Order Notes */}
              {order.notes && (
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex gap-3 shadow-sm">
                      <ClipboardList className="w-5 h-5 text-yellow-700 mt-0.5" />
                      <div>
                          <span className="font-bold text-yellow-800 text-xs uppercase tracking-wide block mb-1">Customer Special Request</span>
                          <p className="text-sm text-yellow-900 font-medium">{order.notes}</p>
                      </div>
                  </div>
              )}

              {/* Totals Breakdown */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.pricing.subtotal)}</span></div>
                  <div className="flex justify-between"><span>Delivery Fee</span><span>{formatCurrency(order.pricing.deliveryFee)}</span></div>
                  <div className="flex justify-between"><span>Handling</span><span>{formatCurrency(order.pricing.handlingCharge || 0)}</span></div>
                  <div className="flex justify-between font-black text-dark text-base pt-3 border-t border-gray-200 mt-2">
                      <span>Total</span>
                      <span>{formatCurrency(order.pricing.totalAmount)}</span>
                  </div>
              </div>

           </div>
        </div>
      </div>
    </div>
  );
}