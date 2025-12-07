import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Edit2, Armchair, Power, Users } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Tables() {
  const queryClient = useQueryClient();
  const [editingTable, setEditingTable] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const { data } = await api.get('/tables');
      return data.data;
    }
  });

  const mutation = useMutation({
    mutationFn: async (data) => editingTable ? api.put(`/tables/${editingTable._id}`, data) : api.post('/tables', data),
    onSuccess: () => { queryClient.invalidateQueries(['tables']); toast.success("Saved!"); closeModal(); },
    onError: () => toast.error("Failed")
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.patch(`/tables/${id}/toggle-active`),
    onSuccess: () => { queryClient.invalidateQueries(['tables']); toast.success("Updated"); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tables/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['tables']); toast.success("Deleted"); }
  });

  const { register, handleSubmit, reset } = useForm();

  const openModal = (table = null) => {
    setEditingTable(table);
    reset(table ? { tableNumber: table.tableNumber, capacity: table.capacity, area: table.area } : { tableNumber: '', capacity: '', area: 'General' });
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setEditingTable(null); reset(); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-dark">Tables</h1>
          <p className="text-secondary text-sm">Manage floor plan.</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary"><Plus className="w-5 h-5" /> Add Table</button>
      </div>

      {isLoading ? <div className="text-center py-10">Loading...</div> : tables?.length === 0 ? (
        <div className="card-base p-16 text-center text-secondary border-dashed">No tables found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tables.map((table) => (
            <div key={table._id} className="card-base p-5 relative group hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><Armchair className="w-6 h-6" /></div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(table)} className="p-1.5 hover:bg-gray-100 rounded text-secondary"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => { if(window.confirm('Delete?')) deleteMutation.mutate(table._id) }} className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded text-secondary"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-dark">Table {table.tableNumber}</h3>
              <div className="flex justify-between items-center mt-3 text-sm">
                <span className="flex items-center gap-1 text-secondary"><Users className="w-3.5 h-3.5"/> {table.capacity} Seats</span>
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-bold uppercase text-secondary">{table.area}</span>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className={clsx("flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full", table.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                  <div className={clsx("w-1.5 h-1.5 rounded-full", table.isActive ? "bg-green-500" : "bg-red-500")} /> {table.isActive ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => toggleMutation.mutate(table._id)} className="text-secondary hover:text-primary"><Power className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-dark/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-scale-in">
            <h2 className="text-xl font-bold mb-6">{editingTable ? 'Edit Table' : 'New Table'}</h2>
            <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
              <div><label className="input-label">Table Number</label><input {...register('tableNumber', { required: true })} className="input-field" autoFocus /></div>
              <div><label className="input-label">Capacity</label><input type="number" {...register('capacity', { required: true })} className="input-field" /></div>
              <div><label className="input-label">Area</label><input {...register('area')} className="input-field" /></div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}