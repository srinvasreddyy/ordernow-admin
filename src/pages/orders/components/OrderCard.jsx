import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, User, Clock, Truck } from 'lucide-react';
import clsx from 'clsx';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

export default function OrderCard({ order, activeTab, onAssignDriver, refetch }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleResponse = async (acceptance) => {
    setIsProcessing(true);
    try {
        await api.patch(`/orders/${order._id}/respond`, { acceptance });
        toast.success(`Order ${acceptance}`);
        refetch();
    } catch(e) { toast.error("Failed to update order"); } 
    finally { setIsProcessing(false); }
  };

  return (
    <div className="card-base group transition-all duration-300 hover:shadow-md flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold text-gray-700 bg-white px-2 py-1 rounded border border-gray-200">
            #{order.orderNumber.slice(-6)}
          </span>
          <span className={clsx(
            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
            order.paymentStatus === 'paid' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
          )}>
            {order.paymentType}
          </span>
        </div>
        <span className="text-lg font-bold text-dark">£{order.pricing.totalAmount.toFixed(2)}</span>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col gap-4">
        <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-600">
                <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
                <h4 className="font-bold text-sm text-dark truncate">{order.customerDetails?.name}</h4>
                <p className="text-xs text-gray-500">{order.customerDetails?.phoneNumber}</p>
            </div>
        </div>
        
        <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-600 line-clamp-2">{order.deliveryAddress?.fullAddress}</span>
        </div>

        <div className="text-xs text-gray-400 flex items-center gap-1 mt-auto pt-2">
            <Clock className="w-3 h-3" />
            {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>

        {/* Buttons */}
        <div className="pt-2">
          {activeTab === 'new' && (
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleResponse('rejected')}
                disabled={isProcessing}
                className="btn-secondary text-red-600 border-red-100 hover:bg-red-50 text-sm py-2"
              >
                Reject
              </button>
              <button 
                onClick={() => handleResponse('accepted')}
                disabled={isProcessing}
                className="btn-primary text-sm py-2"
              >
                Accept
              </button>
            </div>
          )}
          {activeTab === 'preparing' && (
             <button 
                onClick={onAssignDriver}
                className="w-full btn-primary bg-dark hover:bg-black text-sm py-2 flex items-center justify-center gap-2"
             >
                <Truck className="w-4 h-4" /> Assign Driver
             </button>
          )}
        </div>
      </div>

      {/* Expandable Section */}
      <div className="border-t border-gray-100">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2 bg-white text-xs font-bold text-gray-500 hover:text-primary transition-colors flex justify-center items-center gap-1 uppercase tracking-wider"
        >
          {isExpanded ? 'Hide Items' : 'View Items'}
          {isExpanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
        </button>

        <div className={clsx("bg-gray-50 transition-all duration-300 overflow-hidden", isExpanded ? "max-h-64 overflow-y-auto border-t border-gray-100" : "max-h-0")}>
           <div className="p-4 space-y-2">
              {order.orderedItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                      <div className="flex gap-2">
                          <span className="font-bold text-gray-900 w-6">{item.quantity}x</span>
                          <span className="text-gray-700">{item.itemName}</span>
                      </div>
                      <span className="font-medium text-gray-600">£{item.itemTotal.toFixed(2)}</span>
                  </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}