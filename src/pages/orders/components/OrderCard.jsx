import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, User, Clock, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

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
        refetch(); // Refresh list
    } catch(e) { 
        toast.error("Failed to update order"); 
    } finally { 
        setIsProcessing(false); 
    }
  };

  // Handle Manual Status Change (e.g., Placed -> Delivered)
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    if (!newStatus) return;

    if (!window.confirm(`Are you sure you want to mark this order as ${newStatus.replace(/_/g, ' ')}?`)) {
        e.target.value = ""; // Reset selection
        return;
    }

    setStatusLoading(true);
    try {
        await api.patch(`/orders/${order._id}/status`, { status: newStatus });
        toast.success("Status updated successfully");
        refetch(); // Refresh list to show new status/tab
    } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
        setStatusLoading(false);
    }
  };

  // Determine which manual status transitions are allowed
  const getAvailableStatusOptions = (currentStatus) => {
      const options = [];
      if (currentStatus === 'placed') {
          options.push('out_for_delivery', 'delivered', 'cancelled');
      } else if (currentStatus === 'out_for_delivery') {
          options.push('delivered', 'cancelled');
      }
      return options;
  };

  const availableStatuses = getAvailableStatusOptions(order.status);

  return (
    <div className="card-base group flex flex-col h-full hover:border-primary/30 transition-all duration-200">
      {/* Header */}
      <div className="px-5 py-4 bg-gray-50/80 border-b border-gray-100 flex justify-between items-start">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <span className="font-mono text-sm font-bold text-gray-900">
               #{order.orderNumber.slice(-6)}
             </span>
             <span className={clsx(
               "w-2 h-2 rounded-full",
               order.paymentStatus === 'paid' ? "bg-green-500" : "bg-orange-500"
             )} />
           </div>
           <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{order.paymentType}</span>
        </div>
        <div className="text-right">
           <span className="text-lg font-bold text-dark block leading-none">£{order.pricing.totalAmount.toFixed(2)}</span>
           <span className="text-xs text-gray-400 font-medium">
             {order.orderedItems.length} items
           </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col gap-5">
        <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center shrink-0 text-primary">
                <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-dark truncate">{order.customerDetails?.name}</h4>
                <p className="text-xs text-gray-500 font-medium">{order.customerDetails?.phoneNumber}</p>
            </div>
        </div>
        
        <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                <MapPin className="w-4 h-4" />
            </div>
            <span className="text-sm text-gray-600 line-clamp-2 leading-relaxed flex-1 mt-1">
                {order.deliveryAddress?.fullAddress}
            </span>
        </div>

        {/* Timestamps & Info */}
        <div className="mt-auto pt-4 flex items-center justify-between text-xs font-medium text-gray-400 border-t border-gray-50">
            <div className="flex items-center gap-1.5">
               <Clock className="w-3.5 h-3.5" />
               {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
            <div className="flex items-center gap-1.5">
                {order.orderType === 'delivery' && <Truck className="w-3.5 h-3.5" />}
                <span className="uppercase">{order.orderType}</span>
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
                        className="btn-danger text-sm py-2 justify-center"
                    >
                        Reject
                    </button>
                    <button 
                        onClick={() => handleResponse('accepted')}
                        disabled={isProcessing}
                        className="btn-primary text-sm py-2 w-full shadow-none justify-center"
                    >
                        Accept Order
                    </button>
                </div>
            )}

            {/* 2. Accepted Order Actions */}
            {order.acceptanceStatus === 'accepted' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                <div className="flex flex-col gap-2 animate-fade-in">
                    
                    {/* Assign Driver Button (Only for Delivery type orders that are not yet out) */}
                    {order.orderType === 'delivery' && order.status === 'placed' && (
                        <button 
                            onClick={onAssignDriver}
                            className="flex items-center justify-center gap-2 w-full btn-primary bg-dark hover:bg-black text-xs py-2.5 transition-all shadow-sm"
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
                                className="block w-full text-xs rounded-lg border-gray-200 bg-gray-50 py-2 pl-3 pr-8 text-gray-700 focus:border-primary focus:ring-primary font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                                <option value="" disabled>Change Status...</option>
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
          className="w-full py-3 bg-white text-xs font-bold text-gray-500 hover:text-primary hover:bg-gray-50 transition-all flex justify-center items-center gap-2 uppercase tracking-wider"
        >
          {isExpanded ? 'Hide Details' : 'View Order Details'}
          {isExpanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
        </button>

        <div className={clsx("bg-gray-50 transition-all duration-300 overflow-hidden", isExpanded ? "max-h-80 overflow-y-auto border-t border-gray-100" : "max-h-0")}>
           <div className="p-5 space-y-3">
              {order.orderedItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-200/50 last:border-0">
                      <div className="flex gap-3">
                          <span className="font-bold text-primary w-5">{item.quantity}x</span>
                          <span className="text-gray-700 font-medium">{item.itemName}</span>
                      </div>
                      <span className="font-bold text-gray-800">£{item.itemTotal.toFixed(2)}</span>
                  </div>
              ))}
              <div className="flex justify-between pt-3 text-sm font-bold text-dark border-t border-gray-200">
                  <span>Total</span>
                  <span>£{order.pricing.totalAmount.toFixed(2)}</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}