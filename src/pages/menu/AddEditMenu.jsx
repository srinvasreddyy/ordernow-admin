import { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus, Trash2, Save, Image as ImageIcon, Layers, Tag, Box, Info, CheckCircle2, Loader2, X } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// --- Zod Schemas ---
const variantSchema = z.object({
  variantName: z.string().min(1, "Name required"),
  additionalPrice: z.coerce.number().min(0).default(0)
});

const variantGroupSchema = z.object({
  groupTitle: z.string().min(1, "Group Title required"),
  variants: z.array(variantSchema).min(1, "At least one variant required")
});

const addonSchema = z.object({
  optionTitle: z.string().min(1, "Option title required"),
  price: z.coerce.number().min(0).default(0)
});

const addonGroupSchema = z.object({
  groupTitle: z.string().min(1, "Title required"),
  customizationBehavior: z.enum(['compulsory', 'optional']),
  minSelection: z.coerce.number().min(0).default(0),
  maxSelection: z.coerce.number().optional(),
  addons: z.array(addonSchema).min(1, "At least one addon option required")
});

const menuSchema = z.object({
  itemName: z.string().min(1, "Item Name is required"),
  description: z.string().optional(),
  isFood: z.boolean(),
  itemType: z.enum(['veg', 'non-veg', 'egg']),
  basePrice: z.coerce.number().min(0, "Price must be positive"),
  categoryNames: z.string().optional(),
  packageType: z.string().optional(),
  minimumQuantity: z.coerce.number().min(1).default(1),
  maximumQuantity: z.coerce.number().optional(),
  isBestseller: z.boolean().optional(),
  variantGroups: z.array(variantGroupSchema).optional(),
  addonGroups: z.array(addonGroupSchema).optional(),
});

export default function AddEditMenu() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('basic');

  // --- Image State ---
  const [displayPreview, setDisplayPreview] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  
  // Refs for file inputs to clear them programmatically
  const displayInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const { register, control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(menuSchema),
    defaultValues: { 
      isFood: true, 
      itemType: 'veg', 
      isBestseller: false, 
      minimumQuantity: 1,
      variantGroups: [], 
      addonGroups: [] 
    }
  });

  const { fields: variantGroups, append: addVariantGroup, remove: removeVariantGroup } = useFieldArray({ control, name: "variantGroups" });
  const { fields: addonGroups, append: addAddonGroup, remove: removeAddonGroup } = useFieldArray({ control, name: "addonGroups" });

  useEffect(() => {
      if (user?.restaurantType === 'groceries') {
          setValue('isFood', false);
      } else {
          setValue('isFood', true);
      }
  }, [user?.restaurantType, setValue]);

  const { data: menuItemData } = useQuery({
    queryKey: ['menuItem', id],
    queryFn: async () => {
        const { data } = await api.get(`/menuItems/${id}`);
        return data.data;
    },
    enabled: isEditMode,
  });

  useEffect(() => {
    if (menuItemData) {
        reset({
            ...menuItemData,
            categoryNames: menuItemData.categories?.map(c => c.categoryName).join(', '),
            variantGroups: menuItemData.variantGroups || [],
            addonGroups: menuItemData.addonGroups || []
        });
        // Set initial previews from backend
        if (menuItemData.displayImageUrl) setDisplayPreview(menuItemData.displayImageUrl);
        if (menuItemData.imageUrls) {
            setGalleryPreviews(menuItemData.imageUrls.map(url => ({ url, isExisting: true })));
        }
    }
  }, [menuItemData, reset]);

  const mutation = useMutation({
    mutationFn: async (formData) => {
        const config = { headers: { 'Content-Type': 'multipart/form-data' } };
        isEditMode ? await api.put(`/menuItems/${id}`, formData, config) : await api.post('/menuItems', formData, config);
    },
    onSuccess: () => {
        queryClient.invalidateQueries(['menuItems']);
        toast.success(`Item ${isEditMode ? 'updated' : 'created'} successfully!`);
        navigate('/menu');
    },
    onError: (err) => toast.error(err.response?.data?.message || "Operation failed")
  });

  // --- Image Handlers ---

  const handleDisplayChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDisplayPreview(URL.createObjectURL(file));
    }
  };

  const removeDisplayImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear preview and input value. 
    // This reveals the dropzone so user can upload a different image.
    setDisplayPreview(null);
    if (displayInputRef.current) displayInputRef.current.value = '';
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = files.map(file => ({
        url: URL.createObjectURL(file),
        file,
        isExisting: false
    }));
    
    setGalleryFiles(prev => [...prev, ...files]);
    setGalleryPreviews(prev => [...prev, ...newPreviews]);
    
    if (galleryInputRef.current) galleryInputRef.current.value = ''; 
  };

  const removeGalleryImage = (index) => {
    const target = galleryPreviews[index];
    
    if (!target.isExisting) {
        const fileIndex = galleryFiles.indexOf(target.file);
        if (fileIndex > -1) {
            const newFiles = [...galleryFiles];
            newFiles.splice(fileIndex, 1);
            setGalleryFiles(newFiles);
        }
    }
    
    const newPreviews = [...galleryPreviews];
    newPreviews.splice(index, 1);
    setGalleryPreviews(newPreviews);
  };

  // --- Submit Handler ---

  const onSubmit = async (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        if (key === 'categoryNames') {
            const cats = data.categoryNames ? data.categoryNames.split(',').map(s => s.trim()).filter(Boolean) : [];
            formData.append('categoryNames', JSON.stringify(cats));
        } else if (['variantGroups', 'addonGroups'].includes(key)) {
            formData.append(key, JSON.stringify(data[key]));
        } else {
             formData.append(key, data[key]);
        }
    });

    if (displayInputRef.current?.files[0]) {
        formData.append('displayImage', displayInputRef.current.files[0]);
    }
    
    if (galleryFiles.length > 0) {
        galleryFiles.forEach(file => {
            formData.append('galleryImages', file);
        });
    }

    mutation.mutate(formData);
  };

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
        type="button"
        onClick={() => setActiveTab(id)}
        className={clsx(
            "flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all",
            activeTab === id 
            ? 'bg-white text-primary shadow-sm ring-1 ring-gray-200' 
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
        )}
    >
        {Icon && <Icon className="w-4 h-4" />}
        {label}
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto pb-32 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
            <button type="button" onClick={() => navigate('/menu')} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors shadow-sm">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-dark">{isEditMode ? 'Edit Menu Item' : 'New Menu Item'}</h1>
                <p className="text-sm text-secondary">Fill in the details to add a product to your catalog.</p>
            </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Tabs */}
            <div className="bg-gray-100/80 p-1.5 rounded-xl inline-flex flex-wrap gap-1">
                <TabButton id="basic" label="Basic Details" icon={Box} />
                <TabButton id="variants" label="Variants & Sizes" icon={Layers} />
                <TabButton id="addons" label="Add-ons & Extras" icon={Tag} />
            </div>

            {/* Basic Info Tab */}
            <div className={clsx(activeTab === 'basic' ? 'block' : 'hidden', "space-y-6")}>
                <div className="card-base p-8 space-y-6">
                    <h3 className="text-lg font-bold text-dark border-b border-gray-100 pb-4 mb-2">Product Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="input-label">Item Name <span className="text-red-500">*</span></label>
                            <input {...register('itemName')} className="input-field" placeholder="e.g. Classic Cheese Burger" />
                            {errors.itemName && <span className="text-red-500 text-xs mt-1 block">{errors.itemName.message}</span>}
                        </div>
                        
                        <div className="col-span-2">
                            <label className="input-label">Description</label>
                            <textarea {...register('description')} rows={3} className="input-field resize-none" placeholder="A brief description of the dish, ingredients, etc..." />
                        </div>

                        <div>
                            <label className="input-label">Base Price (£) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                                <input {...register('basePrice')} type="number" step="0.01" className="input-field pl-8" placeholder="0.00" />
                            </div>
                            {errors.basePrice && <span className="text-red-500 text-xs mt-1 block">{errors.basePrice.message}</span>}
                        </div>

                        <div>
                            <label className="input-label">Item Type</label>
                            <select {...register('itemType')} className="input-field">
                                <option value="veg">Vegetarian</option>
                                <option value="non-veg">Non-Vegetarian</option>
                                <option value="egg">Contains Egg</option>
                            </select>
                        </div>

                        <div>
                            <label className="input-label">Minimum Quantity</label>
                            <input {...register('minimumQuantity')} type="number" className="input-field" placeholder="Default: 1" />
                            <p className="text-[11px] text-gray-400 mt-1">Min amount user must add.</p>
                        </div>

                        <div>
                            <label className="input-label">Maximum Quantity (Optional)</label>
                            <input {...register('maximumQuantity')} type="number" className="input-field" placeholder="No Limit" />
                            <p className="text-[11px] text-gray-400 mt-1">Max amount user can add.</p>
                        </div>

                        <div className="col-span-2">
                            <label className="input-label">Category Tags</label>
                            <input {...register('categoryNames')} className="input-field" placeholder="e.g. Burgers, Lunch, Spicy" />
                            <p className="text-xs text-secondary mt-1.5 flex items-center gap-1">
                                <Info className="w-3 h-3" /> Separate multiple categories with commas.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 pt-4 border-t border-gray-100">
                        <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-orange-50/30 transition-all flex-1">
                            <input {...register('isBestseller')} type="checkbox" className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary/25" />
                            <div>
                                <span className="block text-sm font-bold text-dark">Mark as Bestseller</span>
                                <span className="block text-xs text-secondary">Highlight this item on the menu</span>
                            </div>
                        </label>
                        <label className={clsx("flex items-center gap-3 p-4 border border-gray-200 rounded-xl transition-all flex-1", "bg-gray-50 opacity-80 cursor-not-allowed")}>
                            <input {...register('isFood')} type="checkbox" className="w-5 h-5 rounded border-gray-300 text-gray-400" disabled />
                            <div>
                                <span className="block text-sm font-bold text-gray-600">Is Food Item?</span>
                                <span className="block text-xs text-gray-500">Locked by Restaurant Type</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="card-base p-8">
                    <h3 className="text-lg font-bold text-dark border-b border-gray-100 pb-4 mb-6">Media</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Display Image Upload */}
                        <div>
                            <label className="input-label mb-2">Display Image</label>
                            {/* Hidden input moved OUTSIDE conditional rendering to persist ref */}
                            <input 
                                type="file" 
                                id="displayImage" 
                                ref={displayInputRef}
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleDisplayChange} 
                            />
                            
                            <div className="relative group">
                                {displayPreview ? (
                                    <div className="h-48 rounded-xl overflow-hidden border border-gray-200 relative">
                                        <img src={displayPreview} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button 
                                                type="button" 
                                                onClick={removeDisplayImage} 
                                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transform scale-90 group-hover:scale-100 transition-all shadow-lg"
                                                title="Remove Image"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <label 
                                        htmlFor="displayImage"
                                        className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-primary/50 transition-all"
                                    >
                                        <div className="p-4 bg-gray-100 rounded-full mb-3">
                                            <ImageIcon className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">Click to upload main image</span>
                                        <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Gallery Images Upload */}
                        <div>
                            <label className="input-label mb-2">Gallery Images</label>
                            <div className="grid grid-cols-3 gap-3">
                                {galleryPreviews.map((img, index) => (
                                    <div key={index} className="aspect-square rounded-xl overflow-hidden border border-gray-200 relative group">
                                        <img src={img.url} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button 
                                                type="button" 
                                                onClick={() => removeGalleryImage(index)} 
                                                className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg"
                                                title="Remove from Uploads"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                
                                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-primary/50 transition-all">
                                    <Plus className="w-6 h-6 text-gray-400" />
                                    <span className="text-[10px] text-gray-500 mt-1">Add</span>
                                    <input 
                                        type="file" 
                                        id="galleryImages" 
                                        ref={galleryInputRef}
                                        multiple 
                                        accept="image/*" 
                                        className="hidden"
                                        onChange={handleGalleryChange}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Variants Tab */}
            <div className={clsx(activeTab === 'variants' ? 'block' : 'hidden', "space-y-6")}>
                <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex gap-3">
                        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-blue-900">What are Variants?</p>
                            <p className="text-sm text-blue-800">Use this for mutually exclusive options like Sizes (Small, Medium, Large) or Bases. The user picks exactly one.</p>
                        </div>
                    </div>
                </div>

                {variantGroups.map((group, groupIndex) => (
                    <div key={group.id} className="card-base overflow-visible border border-gray-200">
                        <div className="card-header bg-gray-50/50 py-3 flex justify-between items-center">
                            <h4 className="font-bold text-dark text-sm uppercase tracking-wide">Variant Group {groupIndex + 1}</h4>
                            <button type="button" onClick={() => removeVariantGroup(groupIndex)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <label className="input-label">Group Title</label>
                                <input 
                                    {...register(`variantGroups.${groupIndex}.groupTitle`)} 
                                    placeholder="e.g. Size, Crust Type" 
                                    className={clsx("input-field", errors?.variantGroups?.[groupIndex]?.groupTitle && "border-red-500")}
                                />
                                {errors?.variantGroups?.[groupIndex]?.groupTitle && <span className="text-xs text-red-500 mt-1">Required</span>}
                            </div>
                            
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Options</label>
                                <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center">
                                    <p className="text-sm text-gray-500 mb-2">Add options like "Small", "Large" etc.</p>
                                    <div className="grid grid-cols-2 gap-4 text-left mt-4">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Option Name</label>
                                            <input {...register(`variantGroups.${groupIndex}.variants.0.variantName`)} placeholder="e.g. Small" className="input-field bg-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Extra Price (£)</label>
                                            <input type="number" {...register(`variantGroups.${groupIndex}.variants.0.additionalPrice`)} className="input-field bg-white" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-left mt-2">
                                        <div>
                                            <input {...register(`variantGroups.${groupIndex}.variants.1.variantName`)} placeholder="e.g. Medium" className="input-field bg-white" />
                                        </div>
                                        <div>
                                            <input type="number" {...register(`variantGroups.${groupIndex}.variants.1.additionalPrice`)} className="input-field bg-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                
                <button 
                    type="button" 
                    onClick={() => addVariantGroup({ groupTitle: "", variants: [{ variantName: "", additionalPrice: 0 }, { variantName: "", additionalPrice: 0 }] })} 
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary hover:text-primary hover:bg-orange-50 transition-all flex items-center justify-center gap-2 font-medium"
                >
                    <Plus className="w-5 h-5" /> Add New Variant Group
                </button>
            </div>

            {/* Addons Tab */}
            <div className={clsx(activeTab === 'addons' ? 'block' : 'hidden', "space-y-6")}>
                <div className="flex justify-between items-center bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <div className="flex gap-3">
                        <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-purple-900">What are Add-ons?</p>
                            <p className="text-sm text-purple-800">Use this for multiple optional choices like Extra Toppings, Sauces, or Sides.</p>
                        </div>
                    </div>
                </div>

                {addonGroups.map((group, index) => (
                    <div key={group.id} className="card-base overflow-visible border border-gray-200">
                        <div className="card-header bg-gray-50/50 py-3 flex justify-between items-center">
                            <h4 className="font-bold text-dark text-sm uppercase tracking-wide">Add-on Group {index + 1}</h4>
                            <button type="button" onClick={() => removeAddonGroup(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-12 gap-6 mb-6">
                                <div className="col-span-12 md:col-span-6">
                                    <label className="input-label">Group Title</label>
                                    <input 
                                        {...register(`addonGroups.${index}.groupTitle`)} 
                                        placeholder="e.g. Choose Toppings" 
                                        className={clsx("input-field", errors?.addonGroups?.[index]?.groupTitle && "border-red-500")} 
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-6">
                                    <label className="input-label">Type</label>
                                    <select {...register(`addonGroups.${index}.customizationBehavior`)} className="input-field">
                                        <option value="optional">Optional (0 min)</option>
                                        <option value="compulsory">Compulsory (At least 1)</option>
                                    </select>
                                </div>
                                <div className="col-span-6 md:col-span-3">
                                    <label className="input-label">Min Selection</label>
                                    <input type="number" {...register(`addonGroups.${index}.minSelection`)} className="input-field" placeholder="0" />
                                </div>
                                <div className="col-span-6 md:col-span-3">
                                    <label className="input-label">Max Selection</label>
                                    <input type="number" {...register(`addonGroups.${index}.maxSelection`)} className="input-field" placeholder="No Limit" />
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 block">Choices</label>
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="grid grid-cols-2 gap-4 mb-3 last:mb-0">
                                        <div>
                                            <input {...register(`addonGroups.${index}.addons.${i}.optionTitle`)} placeholder={`Option ${i + 1} Name`} className="input-field bg-white" />
                                        </div>
                                        <div>
                                            <input type="number" {...register(`addonGroups.${index}.addons.${i}.price`)} placeholder="Price (£)" className="input-field bg-white" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}

                <button 
                    type="button" 
                    onClick={() => addAddonGroup({ groupTitle: "", customizationBehavior: "optional", minSelection: 0, addons: [{ optionTitle: "", price: 0 }] })} 
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary hover:text-primary hover:bg-orange-50 transition-all flex items-center justify-center gap-2 font-medium"
                >
                    <Plus className="w-5 h-5" /> Add New Add-on Group
                </button>
            </div>

            {/* Floating Action Footer */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 z-30">
                <div className="bg-dark text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center border border-gray-800">
                    <div className="hidden sm:flex items-center pl-2 gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-gray-300">
                            {isEditMode ? 'Editing existing item' : 'Creating new item'}
                        </span>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button type="button" onClick={() => navigate('/menu')} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors">
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={mutation.isPending || isSubmitting}
                            className="flex-1 sm:flex-none px-8 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 min-w-[140px]"
                        >
                            {mutation.isPending || isSubmitting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                            ) : (
                                <><Save className="w-4 h-4" /> Save Item</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    </div>
  );
}