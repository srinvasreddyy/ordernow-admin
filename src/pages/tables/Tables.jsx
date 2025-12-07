import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Edit2, Armchair, Power } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Tables() {
  const queryClient = useQueryClient();
  const [editingTable, setEditingTable] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch Tables
  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const { data } = await api.get('/tables');
      return data.data;
    }
  });

  // Add/Update Mutation
  const mutation = useMutation({
    mutationFn: async (data) => {
      if (editingTable) {
        await api.put(`/tables/${editingTable._id}`, data);
      } else {
        await api.post('/tables', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tables']);
      toast.success(editingTable ? "Table updated" : "Table added");
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Operation failed")
  });

  // Toggle Status Mutation
  const toggleMutation = useMutation({
    mutationFn: async (id) => api.patch(`/tables/${id}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries(['tables']);
      toast.success("Status updated");
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/tables/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['tables']);
      toast.success("Table deleted");
    }
  });

  // Form Handling
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const openModal = (table = null) => {
    setEditingTable(table);
    if (table) {
      reset({ tableNumber: table.tableNumber, capacity: table.capacity, area: table.area });
    } else {
      reset({ tableNumber: '', capacity: '', area: 'General' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTable(null);
    reset();
  };

  const onSubmit = (data) => mutation.mutate(data);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Table Management</h1>
          <p className="text-gray-500 text-sm">Organize your dining area layout</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" /> Add Table
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading tables...</div>
      ) : tables?.length === 0 ? (
        <div className="bg-white p-10 rounded-xl border border-dashed text-center text-gray-500">
          No tables found. Add one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tables.map((table) => (
            <div key={table._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 relative group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                  <Armchair className="w-6 h-6" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(table)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => { if(window.confirm('Delete table?')) deleteMutation.mutate(table._id) }}
                    className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded text-gray-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900">Table {table.tableNumber}</h3>
              <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                <span>{table.capacity} Seats</span>
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs uppercase font-medium">{table.area}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className={clsx("text-xs font-medium", table.isActive ? "text-green-600" : "text-red-500")}>
                  {table.isActive ? 'Active' : 'Inactive'}
                </span>
                <button 
                  onClick={() => toggleMutation.mutate(table._id)}
                  className="text-gray-400 hover:text-indigo-600"
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{editingTable ? 'Edit Table' : 'Add New Table'}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Table Number</label>
                <input {...register('tableNumber', { required: true })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g. A1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Capacity</label>
                <input type="number" {...register('capacity', { required: true, min: 1 })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="4" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Area</label>
                <input {...register('area')} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g. Patio" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}