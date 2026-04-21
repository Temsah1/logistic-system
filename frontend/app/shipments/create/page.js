'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Package, MapPin, User, Scale, Ruler } from 'lucide-react'
import api from '../../../lib/api'
import toast from 'react-hot-toast'

export default function CreateShipment() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      // Calculate estimated delivery (3 days from now)
      const estimatedDelivery = new Date()
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 3)
      
      // Calculate cost (simple calculation based on weight)
      const cost = Math.max(50, parseFloat(data.package.weight) * 10)

      const shipmentData = {
        ...data,
        estimatedDelivery: estimatedDelivery.toISOString(),
        cost: cost
      }

      const response = await api.post('/shipments', shipmentData)
      toast.success('Shipment created successfully!')
      router.push(`/shipments/${response.data.shipment.id}`)
    } catch (error) {
      console.error('Failed to create shipment:', error)
      const message = error.response?.data?.message || 'Failed to create shipment'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          <div className="flex items-center mb-6">
            <Package className="h-8 w-8 text-primary-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Create New Shipment</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Origin Information */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                Origin Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    {...register('origin.address', { required: 'Origin address is required' })}
                    type="text"
                    className="input-field"
                    placeholder="Enter origin address"
                  />
                  {errors.origin?.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.origin.address.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    {...register('origin.city', { required: 'Origin city is required' })}
                    type="text"
                    className="input-field"
                    placeholder="Enter origin city"
                  />
                  {errors.origin?.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.origin.city.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    {...register('origin.postalCode', { required: 'Origin postal code is required' })}
                    type="text"
                    className="input-field"
                    placeholder="Enter postal code"
                  />
                  {errors.origin?.postalCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.origin.postalCode.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    {...register('origin.country')}
                    type="text"
                    className="input-field"
                    defaultValue="Egypt"
                  />
                </div>
              </div>
            </div>

            {/* Destination Information */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                Destination Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    {...register('destination.address', { required: 'Destination address is required' })}
                    type="text"
                    className="input-field"
                    placeholder="Enter destination address"
                  />
                  {errors.destination?.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.destination.address.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    {...register('destination.city', { required: 'Destination city is required' })}
                    type="text"
                    className="input-field"
                    placeholder="Enter destination city"
                  />
                  {errors.destination?.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.destination.city.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    {...register('destination.postalCode', { required: 'Destination postal code is required' })}
                    type="text"
                    className="input-field"
                    placeholder="Enter postal code"
                  />
                  {errors.destination?.postalCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.destination.postalCode.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    {...register('destination.country')}
                    type="text"
                    className="input-field"
                    defaultValue="Egypt"
                  />
                </div>
              </div>
            </div>

            {/* Recipient Information */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-2" />
                Recipient Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Name *
                  </label>
                  <input
                    {...register('recipient.name', { required: 'Recipient name is required' })}
                    type="text"
                    className="input-field"
                    placeholder="Enter recipient name"
                  />
                  {errors.recipient?.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.recipient.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    {...register('recipient.phone', { required: 'Recipient phone is required' })}
                    type="tel"
                    className="input-field"
                    placeholder="Enter phone number"
                  />
                  {errors.recipient?.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.recipient.phone.message}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    {...register('recipient.email')}
                    type="email"
                    className="input-field"
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </div>

            {/* Package Information */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 text-gray-400 mr-2" />
                Package Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (kg) *
                  </label>
                  <div className="relative">
                    <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('package.weight', {
                        required: 'Weight is required',
                        min: { value: 0.1, message: 'Weight must be at least 0.1 kg' }
                      })}
                      type="number"
                      step="0.1"
                      className="input-field pl-10"
                      placeholder="0.0"
                    />
                  </div>
                  {errors.package?.weight && (
                    <p className="mt-1 text-sm text-red-600">{errors.package.weight.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dimensions (cm) *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="relative">
                      <input
                        {...register('package.dimensions.length', {
                          required: 'Length is required',
                          min: { value: 1, message: 'Length must be at least 1 cm' }
                        })}
                        type="number"
                        className="input-field text-center"
                        placeholder="L"
                      />
                      {errors.package?.dimensions?.length && (
                        <p className="mt-1 text-sm text-red-600 text-xs">{errors.package.dimensions.length.message}</p>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        {...register('package.dimensions.width', {
                          required: 'Width is required',
                          min: { value: 1, message: 'Width must be at least 1 cm' }
                        })}
                        type="number"
                        className="input-field text-center"
                        placeholder="W"
                      />
                      {errors.package?.dimensions?.width && (
                        <p className="mt-1 text-sm text-red-600 text-xs">{errors.package.dimensions.width.message}</p>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        {...register('package.dimensions.height', {
                          required: 'Height is required',
                          min: { value: 1, message: 'Height must be at least 1 cm' }
                        })}
                        type="number"
                        className="input-field text-center"
                        placeholder="H"
                      />
                      {errors.package?.dimensions?.height && (
                        <p className="mt-1 text-sm text-red-600 text-xs">{errors.package.dimensions.height.message}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Package Description *
                  </label>
                  <textarea
                    {...register('package.description', {
                      required: 'Description is required',
                      maxLength: { value: 500, message: 'Description cannot exceed 500 characters' }
                    })}
                    rows={3}
                    className="input-field"
                    placeholder="Describe the package contents..."
                  />
                  {errors.package?.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.package.description.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                {...register('notes', {
                  maxLength: { value: 1000, message: 'Notes cannot exceed 1000 characters' }
                })}
                rows={3}
                className="input-field"
                placeholder="Any special instructions or notes..."
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Link href="/dashboard" className="btn-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Shipment...
                  </span>
                ) : (
                  'Create Shipment'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
