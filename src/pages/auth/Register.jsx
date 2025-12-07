// src/pages/auth/Register.jsx
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// Schema (kept same)
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
    <div className="min-h-screen bg-cream py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: intro */}
          <div className="w-full lg:w-1/3 flex flex-col items-start justify-center p-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-dark mb-2">Partner Application</h1>
            <p className="text-secondary mb-6">Join our network and reach more customers. Fill the application below and we'll review your submission.</p>
            <div className="bg-white p-4 rounded-xl border border-gray-100 w-full shadow-soft">
              <p className="text-sm text-secondary">Already applied?</p>
              <Link to="/auth/login" className="mt-3 inline-block btn-secondary">Back to Login</Link>
            </div>
          </div>

          {/* Right: form */}
          <div className="w-full lg:w-2/3 bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
            <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data" className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Restaurant Name</label>
                  <input {...register('restaurantName')} className={`input-field ${errors.restaurantName ? 'ring-1 ring-red-200' : ''}`} />
                  {errors.restaurantName && <p className="text-xs text-red-500 mt-1">{errors.restaurantName.message}</p>}
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

              {/* Location card */}
              <div className="card-base p-6">
                <SectionTitle title="Location" />
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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

              {/* Financials */}
              <div className="card-base p-6">
                <SectionTitle title="Financials & Delivery" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label className="input-label">Charge Per Mile</label>
                    <input type="number" step="0.01" {...register('chargePerMile')} className="input-field" />
                  </div>
                </div>
              </div>

              {/* Documents & Banking */}
              <div className="card-base p-6">
                <SectionTitle title="Documents & Banking" />
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid gap-4 md:grid-cols-3">
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

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h4 className="text-sm font-bold text-dark mb-3">Bank Details</h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input placeholder="Beneficiary Name" {...register('beneficiaryName')} className="input-field" />
                      <input placeholder="Sort Code" {...register('sortCode')} className="input-field" />
                      <input placeholder="Account Number" {...register('accountNumber')} className="input-field" />
                      <input placeholder="Bank Address" {...register('bankAddress')} className="input-field" />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
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
                          <input type="file" id={field.id} multiple={field.multiple} accept="image/*"
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                        </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Operating hours */}
              <div className="card-base p-6">
                <SectionTitle title="Operating Hours" />
                <div className="space-y-3">
                  {timingFields.map((field, index) => (
                    <div key={field.id} className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-gray-50 pb-3 last:border-0">
                      <span className="w-full sm:w-28 capitalize font-medium text-dark">{field.day}</span>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" {...register(`timings.${index}.isOpen`)} className="rounded text-primary focus:ring-primary/20" />
                        <span className="text-sm text-secondary">Open</span>
                      </label>
                      <div className="flex items-center gap-2 ml-auto">
                        <input type="time" {...register(`timings.${index}.openTime`)} className="input-field py-1 w-32" />
                        <span className="text-secondary text-sm">to</span>
                        <input type="time" {...register(`timings.${index}.closeTime`)} className="input-field py-1 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 pb-6">
                <Link to="/auth/login" className="btn-secondary">Back to Login</Link>
                <button type="submit" disabled={isSubmitting} className="btn-primary px-6">
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
