import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ... (Keep Schema Same as provided)
const timeSlotSchema = z.object({
  day: z.string(),
  isOpen: z.boolean(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
});
const registerSchema = z.object({
  restaurantName: z.string().min(1, "Required"),
  ownerFullName: z.string().min(1, "Required"),
  email: z.string().email(),
  password: z.string().min(8, "Min 8 chars"),
  phoneNumber: z.string().min(10, "Valid phone required"),
  restaurantType: z.enum(['food_delivery_and_dining', 'groceries', 'food_delivery']),
  shopNo: z.string(),
  floor: z.string().optional(),
  area: z.string(),
  city: z.string(),
  landmark: z.string().optional(),
  longitude: z.string().refine(val => !isNaN(parseFloat(val)), "Number required"),
  latitude: z.string().refine(val => !isNaN(parseFloat(val)), "Number required"),
  handlingChargesPercentage: z.string().transform(val => parseFloat(val)),
  stripeSecretKey: z.string().startsWith('sk_', "Must start with sk_"),
  freeDeliveryRadius: z.string().transform(val => parseFloat(val)),
  chargePerMile: z.string().transform(val => parseFloat(val)),
  maxDeliveryRadius: z.string().transform(val => parseFloat(val)),
  timings: z.array(timeSlotSchema),
  businessLicenseNumber: z.string(),
  foodHygieneCertificateNumber: z.string(),
  vatNumber: z.string(),
  beneficiaryName: z.string(),
  sortCode: z.string(),
  accountNumber: z.string(),
  bankAddress: z.string(),
});
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function Register() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      timings: DAYS.map(day => ({ day, isOpen: true, openTime: "09:00", closeTime: "22:00" }))
    }
  });

  const { fields: timingFields } = useFieldArray({ control, name: "timings" });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      // ... (Keep existing submission logic)
      formData.append('restaurantName', data.restaurantName);
      formData.append('ownerFullName', data.ownerFullName);
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('phoneNumber', data.phoneNumber);
      formData.append('restaurantType', data.restaurantType);
      formData.append('handlingChargesPercentage', data.handlingChargesPercentage);
      formData.append('stripeSecretKey', data.stripeSecretKey);
      
      const addressObj = {
        shopNo: data.shopNo,
        floor: data.floor,
        area: data.area,
        city: data.city,
        landmark: data.landmark,
        coordinates: { type: 'Point', coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)] }
      };
      formData.append('address', JSON.stringify(addressObj));

      const deliverySettingsObj = {
        freeDeliveryRadius: data.freeDeliveryRadius,
        chargePerMile: data.chargePerMile,
        maxDeliveryRadius: data.maxDeliveryRadius
      };
      formData.append('deliverySettings', JSON.stringify(deliverySettingsObj));
      formData.append('timings', JSON.stringify(data.timings));

      formData.append('businessLicenseNumber', data.businessLicenseNumber);
      formData.append('foodHygieneCertificateNumber', data.foodHygieneCertificateNumber);
      formData.append('vatNumber', data.vatNumber);
      formData.append('beneficiaryName', data.beneficiaryName);
      formData.append('sortCode', data.sortCode);
      formData.append('accountNumber', data.accountNumber);
      formData.append('bankAddress', data.bankAddress);

      const appendFile = (fieldName, elementId) => {
        const fileInput = document.getElementById(elementId);
        if (fileInput?.files?.length > 0) {
          if (elementId === 'images') {
             for (let i = 0; i < fileInput.files.length; i++) formData.append(fieldName, fileInput.files[i]);
          } else {
             formData.append(fieldName, fileInput.files[0]);
          }
        }
      };
      
      ['profileImage', 'images', 'businessLicenseImage', 'foodHygieneCertificateImage', 'vatCertificateImage', 'bankDocumentImage'].forEach(id => appendFile(id, id));

      await api.post('/ownerRegistration/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success("Application submitted!");
      navigate('/auth/login');

    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const SectionTitle = ({ title }) => (
    <h3 className="text-lg font-bold text-dark border-b border-gray-100 pb-2 mb-4">{title}</h3>
  );

  return (
    <div className="min-h-screen bg-cream py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-dark tracking-tight">Partner Application</h1>
            <p className="text-secondary mt-2">Join our network and start selling today.</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data" className="space-y-6">
          
          <div className="card-base p-8">
            <SectionTitle title="Business Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="input-label">Restaurant Name</label>
                <input {...register('restaurantName')} className="input-field" />
                {errors.restaurantName && <span className="text-red-500 text-xs">{errors.restaurantName.message}</span>}
              </div>
              <div>
                <label className="input-label">Owner Full Name</label>
                <input {...register('ownerFullName')} className="input-field" />
              </div>
              <div>
                <label className="input-label">Email</label>
                <input type="email" {...register('email')} className="input-field" />
              </div>
              <div>
                <label className="input-label">Password</label>
                <input type="password" {...register('password')} className="input-field" />
              </div>
              <div>
                <label className="input-label">Phone Number</label>
                <input {...register('phoneNumber')} className="input-field" />
              </div>
              <div>
                <label className="input-label">Restaurant Type</label>
                <select {...register('restaurantType')} className="input-field">
                  <option value="food_delivery_and_dining">Delivery & Dining</option>
                  <option value="food_delivery">Delivery Only</option>
                  <option value="groceries">Groceries</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card-base p-8">
            <SectionTitle title="Location" />
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
              <div className="md:col-span-2">
                <label className="input-label">Shop No</label>
                <input {...register('shopNo')} className="input-field" />
              </div>
              <div className="md:col-span-2">
                 <label className="input-label">Floor</label>
                 <input {...register('floor')} className="input-field" />
              </div>
              <div className="md:col-span-2">
                 <label className="input-label">City</label>
                 <input {...register('city')} className="input-field" />
              </div>
              <div className="md:col-span-3">
                 <label className="input-label">Area</label>
                 <input {...register('area')} className="input-field" />
              </div>
              <div className="md:col-span-3">
                 <label className="input-label">Landmark</label>
                 <input {...register('landmark')} className="input-field" />
              </div>
              <div className="md:col-span-3">
                 <label className="input-label">Latitude</label>
                 <input type="number" step="any" {...register('latitude')} className="input-field" />
              </div>
              <div className="md:col-span-3">
                 <label className="input-label">Longitude</label>
                 <input type="number" step="any" {...register('longitude')} className="input-field" />
              </div>
            </div>
          </div>

          <div className="card-base p-8">
            <SectionTitle title="Financials & Delivery" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="input-label">Handling Charge (%)</label>
                   <input type="number" step="0.01" {...register('handlingChargesPercentage')} className="input-field" />
                </div>
                <div>
                   <label className="input-label">Stripe Secret Key</label>
                   <input type="password" {...register('stripeSecretKey')} className="input-field" />
                </div>
                <div>
                   <label className="input-label">Free Delivery Radius (miles)</label>
                   <input type="number" step="0.1" {...register('freeDeliveryRadius')} className="input-field" />
                </div>
                <div>
                   <label className="input-label">Charge Per Mile (£)</label>
                   <input type="number" step="0.01" {...register('chargePerMile')} className="input-field" />
                </div>
                <div>
                   <label className="input-label">Max Delivery Radius (miles)</label>
                   <input type="number" step="0.1" {...register('maxDeliveryRadius')} className="input-field" />
                </div>
            </div>
          </div>

           <div className="card-base p-8">
            <SectionTitle title="Documents & Banking" />
            <div className="grid grid-cols-1 gap-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="input-label">Business License No.</label>
                    <input {...register('businessLicenseNumber')} className="input-field" />
                  </div>
                  <div>
                    <label className="input-label">Hygiene Cert No.</label>
                    <input {...register('foodHygieneCertificateNumber')} className="input-field" />
                  </div>
                  <div>
                    <label className="input-label">VAT Number</label>
                    <input {...register('vatNumber')} className="input-field" />
                  </div>
               </div>

               <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <h4 className="text-sm font-bold text-dark mb-4">Bank Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input placeholder="Beneficiary Name" {...register('beneficiaryName')} className="input-field bg-white" />
                    <input placeholder="Sort Code" {...register('sortCode')} className="input-field bg-white" />
                    <input placeholder="Account Number" {...register('accountNumber')} className="input-field bg-white" />
                    <input placeholder="Bank Address" {...register('bankAddress')} className="input-field bg-white" />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                      {id: 'profileImage', label: 'Profile Image'},
                      {id: 'images', label: 'Gallery (Max 5)', multiple: true},
                      {id: 'businessLicenseImage', label: 'Business License'},
                      {id: 'foodHygieneCertificateImage', label: 'Hygiene Cert'},
                      {id: 'vatCertificateImage', label: 'VAT Cert'},
                      {id: 'bankDocumentImage', label: 'Bank Proof'}
                  ].map((field) => (
                      <div key={field.id}>
                        <label className="input-label mb-2">{field.label}</label>
                        <input type="file" id={field.id} multiple={field.multiple} accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                      </div>
                  ))}
               </div>
            </div>
          </div>

          <div className="card-base p-8">
             <SectionTitle title="Operating Hours" />
             <div className="space-y-3">
                {timingFields.map((field, index) => (
                    <div key={field.id} className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-gray-50 pb-3 last:border-0">
                        <span className="w-24 capitalize font-bold text-dark">{field.day}</span>
                        <label className="flex items-center space-x-2">
                           <input type="checkbox" {...register(`timings.${index}.isOpen`)} className="rounded text-primary focus:ring-primary/20" />
                           <span className="text-sm text-secondary">Open</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <input type="time" {...register(`timings.${index}.openTime`)} className="input-field py-1" />
                            <span className="text-secondary text-sm">to</span>
                            <input type="time" {...register(`timings.${index}.closeTime`)} className="input-field py-1" />
                        </div>
                    </div>
                ))}
             </div>
          </div>

          <div className="flex justify-end pt-4 pb-20">
            <Link to="/auth/login" className="btn-secondary mr-4">Back to Login</Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary px-8"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}